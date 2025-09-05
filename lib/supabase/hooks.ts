'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from './client'
import { GameService, ProfileService, DatabaseError } from './utils'
import type { Database, Tables } from './database.types'

// Generic hook for data fetching with loading states
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: {
    enabled?: boolean
    refetchOnMount?: boolean
    staleTime?: number
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DatabaseError | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options

  const isStale = useMemo(() => {
    if (!lastFetch) return true
    return Date.now() - lastFetch > staleTime
  }, [lastFetch, staleTime])

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await queryFn()
      setData(result)
      setLastFetch(Date.now())
    } catch (err) {
      setError(err instanceof DatabaseError ? err : new DatabaseError(String(err)))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [queryFn, enabled])

  useEffect(() => {
    if (enabled && (refetchOnMount || isStale)) {
      fetchData()
    }
  }, [...deps, enabled, fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  }
}

// Auth hooks
export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, loading }
}

export function useProfile(userId?: string) {
  const { user } = useUser()
  const targetUserId = userId || user?.id

  const profileService = useMemo(() => new ProfileService(), [])

  return useSupabaseQuery(
    () => {
      if (!targetUserId) throw new Error('No user ID provided')
      return profileService.findById(targetUserId)
    },
    [targetUserId],
    { enabled: !!targetUserId }
  )
}

export function useProfileByUsername(username: string) {
  const profileService = useMemo(() => new ProfileService(), [])

  return useSupabaseQuery(
    () => profileService.findByUsername(username),
    [username],
    { enabled: !!username }
  )
}

// Game hooks
export function useGame(gameId: string) {
  const gameService = useMemo(() => new GameService(), [])

  return useSupabaseQuery(
    () => gameService.findById(gameId),
    [gameId],
    { enabled: !!gameId }
  )
}

export function usePublicGames(options: {
  limit?: number
  offset?: number
  genre?: string
  search?: string
} = {}) {
  const gameService = useMemo(() => new GameService(), [])

  return useSupabaseQuery(
    () => gameService.findPublicGames(options),
    [options.limit, options.offset, options.genre, options.search]
  )
}

export function useUserGames(userId: string, includePrivate: boolean = true) {
  const gameService = useMemo(() => new GameService(), [])

  return useSupabaseQuery(
    () => gameService.findUserGames(userId, includePrivate),
    [userId, includePrivate],
    { enabled: !!userId }
  )
}

export function useMyGames() {
  const { user } = useUser()
  return useUserGames(user?.id, true)
}

// Real-time subscriptions
export function useRealtimeSubscription<T = any>(
  table: keyof Database['public']['Tables'],
  filter?: string,
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([])
  const [connected, setConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let channel = supabase.channel(`realtime-${table}`)

    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          filter,
        },
        (payload) => {
          if (callback) {
            callback(payload)
          }
          // Handle different event types
          switch (payload.eventType) {
            case 'INSERT':
              setData((prev) => [...prev, payload.new as T])
              break
            case 'UPDATE':
              setData((prev) =>
                prev.map((item: any) =>
                  item.id === payload.new.id ? payload.new : item
                )
              )
              break
            case 'DELETE':
              setData((prev) =>
                prev.filter((item: any) => item.id !== payload.old.id)
              )
              break
          }
        }
      )
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
        },
        (payload) => {
          if (callback) {
            callback(payload)
          }
        }
      )
    }

    channel
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, callback, supabase])

  return { data, connected }
}

// Collaboration hooks
export function useCollaborationSession(gameId: string) {
  const [session, setSession] = useState<Tables<'collaboration_sessions'> | null>(
    null
  )
  const [participants, setParticipants] = useState<any[]>([])
  const [locks, setLocks] = useState<Record<string, any>>({})

  const { connected } = useRealtimeSubscription(
    'collaboration_sessions',
    `game_id=eq.${gameId}`,
    (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.game_id === gameId) {
        setSession(payload.new)
        setParticipants(payload.new.participants || [])
        setLocks(payload.new.active_locks || {})
      }
    }
  )

  return {
    session,
    participants,
    locks,
    connected,
  }
}

// Analytics hooks
export function useGameAnalytics(gameId: string, timeRange: '7d' | '30d' | '90d' = '30d') {
  const supabase = createClient()

  return useSupabaseQuery(async () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    const { data: sessions, error } = await supabase
      .from('play_sessions')
      .select('*')
      .eq('game_id', gameId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw new DatabaseError('Failed to fetch game analytics', error.code)

    // Calculate metrics
    const totalPlays = sessions?.length || 0
    const totalDuration = sessions?.reduce((acc, session) => 
      acc + (session.session_duration || 0), 0) || 0
    const averageDuration = totalPlays > 0 ? totalDuration / totalPlays : 0
    const averageCompletion = sessions?.length 
      ? sessions.reduce((acc, session) => 
          acc + (session.completion_percentage || 0), 0) / sessions.length 
      : 0

    return {
      totalPlays,
      totalDuration,
      averageDuration,
      averageCompletion,
      sessions: sessions || [],
    }
  }, [gameId, timeRange])
}

// Credits hooks
export function useCredits() {
  const { user } = useUser()
  const { data: profile, refetch } = useProfile(user?.id)

  const useCredits = useCallback(async (amount: number) => {
    if (!user?.id) throw new Error('User not authenticated')

    const profileService = new ProfileService()
    const updatedProfile = await profileService.updateCredits(user.id, amount)
    
    // Trigger refetch to update local state
    refetch()
    
    return updatedProfile
  }, [user?.id, refetch])

  return {
    credits: profile?.credits_remaining || 0,
    creditsUsedToday: profile?.credits_used_today || 0,
    useCredits,
    refetch,
  }
}

// Search hooks
export function useGameSearch(query: string, filters: {
  genre?: string
  tags?: string[]
  minRating?: number
} = {}) {
  const supabase = createClient()

  return useSupabaseQuery(async () => {
    if (!query.trim()) return []

    let dbQuery = supabase
      .from('games')
      .select(`
        *,
        profiles:creator_id(username, display_name, avatar_url)
      `)
      .in('visibility', ['public', 'educational'])
      .textSearch('search_vector', query)

    if (filters.genre) {
      dbQuery = dbQuery.eq('genre', filters.genre as any)
    }

    if (filters.tags && filters.tags.length > 0) {
      dbQuery = dbQuery.overlaps('tags', filters.tags)
    }

    const { data, error } = await dbQuery.limit(50)

    if (error) {
      throw new DatabaseError('Failed to search games', error.code)
    }

    return data || []
  }, [query, filters.genre, filters.tags, filters.minRating])
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  limit: number = 20
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newData = await fetchFn(offset, limit)
      
      if (newData.length < limit) {
        setHasMore(false)
      }

      setData((prev) => [...prev, ...newData])
      setOffset((prev) => prev + limit)
    } catch (error) {
      console.error('Failed to fetch more data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, offset, limit, loading, hasMore])

  const reset = useCallback(() => {
    setData([])
    setOffset(0)
    setHasMore(true)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    hasMore,
    fetchMore,
    reset,
  }
}