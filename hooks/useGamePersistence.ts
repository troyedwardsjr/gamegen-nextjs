"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types';

export interface GameData {
  id?: string;
  title: string;
  description?: string;
  game_data: Record<string, any>;
  settings: Record<string, any>;
  scripts: GameScript[];
  assets: GameAsset[];
  thumbnail_url?: string;
  tags?: string[];
  genre?: string;
  visibility: 'private' | 'unlisted' | 'public' | 'educational';
}

export interface GameScript {
  id?: string;
  name: string;
  javascript_code: string;
  script_type: 'system' | 'component' | 'observer' | 'behavior' | 'initialization';
  description?: string;
  is_active: boolean;
  execution_order: number;
  dependencies: string[];
}

export interface GameAsset {
  id?: string;
  name: string;
  asset_type: 'sprite' | 'audio' | 'texture' | 'animation' | 'font' | 'data';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  properties?: Record<string, any>;
  generated_by_ai?: boolean;
  generation_prompt?: string;
}

export interface GamePersistenceState {
  currentGame: GameData | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  conflictData?: GameData;
}

export interface UseGamePersistenceOptions {
  gameId?: string;
  autoSaveInterval?: number; // milliseconds
  enableRealTimeSync?: boolean;
  enableVersionControl?: boolean;
  onSaveSuccess?: (game: GameData) => void;
  onSaveError?: (error: string) => void;
  onConflict?: (localData: GameData, serverData: GameData) => void;
}

export function useGamePersistence(options: UseGamePersistenceOptions = {}) {
  const {
    gameId,
    autoSaveInterval = 10000, // 10 seconds
    enableRealTimeSync = true,
    enableVersionControl = true,
    onSaveSuccess,
    onSaveError,
    onConflict
  } = options;

  const { user } = useAuth();
  const supabase = createClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastServerVersionRef = useRef<number>(0);
  const pendingChangesRef = useRef<Partial<GameData>>({});

  const [state, setState] = useState<GamePersistenceState>({
    currentGame: null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
    saveStatus: 'idle',
  });

  // Load game data
  const loadGame = useCallback(async (id: string): Promise<GameData | null> => {
    if (!user) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load main game data
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError || !game) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Game not found' }));
        return null;
      }

      // Load associated scripts
      const { data: scripts } = await supabase
        .from('game_scripts')
        .select('*')
        .eq('game_id', id)
        .order('execution_order');

      // Load associated assets
      const { data: assets } = await supabase
        .from('game_assets')
        .select('*')
        .eq('game_id', id)
        .order('created_at');

      const gameData: GameData = {
        id: game.id,
        title: game.title,
        description: game.description || undefined,
        game_data: (game.game_data as Record<string, any>) || {},
        settings: {
          genre: game.genre,
          tags: game.tags,
          visibility: (game.visibility as GameData['visibility']) || 'private',
          thumbnail_url: game.thumbnail_url
        },
        scripts: (scripts || []).map(script => ({
          id: script.id,
          name: script.name,
          javascript_code: script.javascript_code,
          script_type: script.script_type as GameScript['script_type'],
          description: script.description || undefined,
          is_active: script.is_active || false,
          execution_order: script.execution_order || 0,
          dependencies: script.dependencies || []
        })),
        assets: (assets || []).map(asset => ({
          id: asset.id,
          name: asset.name,
          asset_type: asset.asset_type as GameAsset['asset_type'],
          file_path: asset.file_path,
          file_size: asset.file_size || undefined,
          mime_type: asset.mime_type || undefined,
          properties: (asset.properties as Record<string, any>) || undefined,
          generated_by_ai: asset.generated_by_ai || undefined,
          generation_prompt: asset.generation_prompt || undefined
        })),
        thumbnail_url: game.thumbnail_url || undefined,
        tags: game.tags || [],
        genre: game.genre || undefined,
        visibility: (game.visibility as GameData['visibility']) || 'private'
      };

      setState(prev => ({
        ...prev,
        currentGame: gameData,
        isLoading: false,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }));

      return gameData;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Failed to load game' 
      }));
      return null;
    }
  }, [user, supabase]);

  // Create new game
  const createGame = useCallback(async (initialData: Partial<GameData> = {}): Promise<GameData | null> => {
    console.log('[useGamePersistence] createGame called with initialData:', initialData);
    if (!user) {
      console.log('[useGamePersistence] No user, returning null');
      return null;
    }

    console.log('[useGamePersistence] Creating game with scripts:', initialData.scripts?.length || 0);
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const gameData: TablesInsert<'games'> = {
        creator_id: user.id,
        title: initialData.title || 'Untitled Game',
        description: initialData.description || '',
        game_data: initialData.game_data || {},
        genre: initialData.genre || null,
        tags: initialData.tags || [],
        visibility: initialData.visibility || 'private',
        thumbnail_url: initialData.thumbnail_url || null
      };

      const { data: newGame, error: createError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (createError || !newGame) {
        throw new Error(createError?.message || 'Failed to create game');
      }

      // Save initial scripts if provided
      const savedScripts = [];
      if (initialData.scripts && initialData.scripts.length > 0) {
        console.log('[useGamePersistence] Saving', initialData.scripts.length, 'initial scripts');
        for (const script of initialData.scripts) {
          console.log('[useGamePersistence] Saving script:', script.name);
          const { data: savedScript, error: scriptError } = await supabase
            .from('game_scripts')
            .insert({
              game_id: newGame.id,
              creator_id: user.id,
              name: script.name,
              javascript_code: script.javascript_code,
              script_type: script.script_type,
              description: script.description || undefined,
              is_active: script.is_active,
              execution_order: script.execution_order,
              dependencies: script.dependencies,
              source_hash: btoa(script.javascript_code)
            })
            .select()
            .single();
          
          if (scriptError) {
            console.warn('[useGamePersistence] Failed to save script:', script.name, scriptError);
          } else {
            console.log('[useGamePersistence] Script saved:', savedScript?.name);
            savedScripts.push({
              id: savedScript?.id,
              name: script.name,
              javascript_code: script.javascript_code,
              script_type: script.script_type,
              description: script.description || undefined,
              is_active: script.is_active,
              execution_order: script.execution_order,
              dependencies: script.dependencies
            });
          }
        }
      }

      const createdGame: GameData = {
        id: newGame.id,
        title: newGame.title,
        description: newGame.description || undefined,
        game_data: (newGame.game_data as Record<string, any>) || {},
        settings: {
          genre: newGame.genre || undefined,
          tags: newGame.tags || [],
          visibility: (newGame.visibility as GameData['visibility']) || 'private',
          thumbnail_url: newGame.thumbnail_url || undefined
        },
        scripts: savedScripts,
        assets: initialData.assets || [],
        thumbnail_url: newGame.thumbnail_url || undefined,
        tags: newGame.tags || [],
        genre: newGame.genre || undefined,
        visibility: (newGame.visibility as GameData['visibility']) || 'private'
      };

      console.log('[useGamePersistence] Game created with', createdGame.scripts.length, 'scripts');

      setState(prev => ({
        ...prev,
        currentGame: createdGame,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        saveStatus: 'saved'
      }));

      onSaveSuccess?.(createdGame);
      return createdGame;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: error.message || 'Failed to create game',
        saveStatus: 'error' 
      }));
      onSaveError?.(error.message || 'Failed to create game');
      return null;
    }
  }, [user, supabase, onSaveSuccess, onSaveError]);

  // Save game data
  const saveGame = useCallback(async (gameData?: Partial<GameData>, createVersion = false): Promise<boolean> => {
    if (!user || !state.currentGame) return false;

    const dataToSave = { ...state.currentGame, ...gameData };
    setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving', error: null }));

    try {
      // Update main game record
      const updateData: TablesUpdate<'games'> = {
        title: dataToSave.title,
        description: dataToSave.description,
        game_data: dataToSave.game_data,
        genre: dataToSave.genre || null,
        tags: dataToSave.tags || [],
        visibility: dataToSave.visibility,
        thumbnail_url: dataToSave.thumbnail_url || null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', state.currentGame.id!)
        .select()
        .single();

      if (updateError || !updatedGame) {
        throw new Error(updateError?.message || 'Failed to update game');
      }

      // Create version if requested
      if (createVersion && enableVersionControl) {
        await supabase
          .from('game_versions')
          .insert({
            game_id: state.currentGame.id!,
            creator_id: user.id,
            version_number: Date.now(), // Simple versioning
            game_data: dataToSave.game_data,
            change_summary: 'Auto-saved version'
          });
      }

      // Save scripts
      if (dataToSave.scripts) {
        for (const script of dataToSave.scripts) {
          if (script.id) {
            await supabase
              .from('game_scripts')
              .update({
                name: script.name,
                javascript_code: script.javascript_code,
                script_type: script.script_type,
                description: script.description || undefined,
                is_active: script.is_active,
                execution_order: script.execution_order,
                dependencies: script.dependencies,
                updated_at: new Date().toISOString()
              })
              .eq('id', script.id);
          } else {
            await supabase
              .from('game_scripts')
              .insert({
                game_id: state.currentGame.id!,
                creator_id: user.id,
                name: script.name,
                javascript_code: script.javascript_code,
                script_type: script.script_type,
                description: script.description || undefined,
                is_active: script.is_active,
                execution_order: script.execution_order,
                dependencies: script.dependencies,
                source_hash: btoa(script.javascript_code)
              });
          }
        }
      }

      setState(prev => ({
        ...prev,
        currentGame: { ...dataToSave, id: updatedGame.id },
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        saveStatus: 'saved'
      }));

      // Clear pending changes
      pendingChangesRef.current = {};

      onSaveSuccess?.(dataToSave);
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: error.message || 'Failed to save game',
        saveStatus: 'error'
      }));
      onSaveError?.(error.message || 'Failed to save game');
      return false;
    }
  }, [user, state.currentGame, enableVersionControl, supabase, onSaveSuccess, onSaveError]);

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback((changes: Partial<GameData>) => {
    // Merge with pending changes
    pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule new save
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (Object.keys(pendingChangesRef.current).length > 0) {
        saveGame(pendingChangesRef.current);
      }
    }, autoSaveInterval);

    // Mark as having unsaved changes
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, [saveGame, autoSaveInterval]);

  // Update game data with auto-save
  const updateGame = useCallback((changes: Partial<GameData>) => {
    if (!state.currentGame) return;

    // Update local state optimistically
    setState(prev => ({
      ...prev,
      currentGame: prev.currentGame ? { ...prev.currentGame, ...changes } : null
    }));

    // Schedule auto-save
    scheduleAutoSave(changes);
  }, [state.currentGame, scheduleAutoSave]);

  // Force save immediately
  const forceSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (Object.keys(pendingChangesRef.current).length > 0 || state.hasUnsavedChanges) {
      return saveGame(pendingChangesRef.current, true);
    }
    
    return Promise.resolve(true);
  }, [saveGame, state.hasUnsavedChanges]);

  // Real-time synchronization
  useEffect(() => {
    if (!enableRealTimeSync || !state.currentGame?.id) return;

    const channel = supabase
      .channel(`game_${state.currentGame.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'games',
          filter: `id=eq.${state.currentGame.id}`
        }, 
        (payload) => {
          // Handle real-time updates from other users
          const updatedGame = payload.new as Tables<'games'>;
          
          // Check for conflicts
          if (state.hasUnsavedChanges) {
            // There's a conflict - show conflict resolution
            setState(prev => ({
              ...prev,
              saveStatus: 'conflict',
              conflictData: {
                ...prev.currentGame!,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                game_data: (updatedGame.game_data as Record<string, any>) || {},
                settings: {
                  genre: updatedGame.genre || undefined,
                  tags: updatedGame.tags || [],
                  visibility: (updatedGame.visibility as GameData['visibility']) || 'private',
                  thumbnail_url: updatedGame.thumbnail_url || undefined
                }
              }
            }));
            
            if (onConflict && state.currentGame) {
              onConflict(state.currentGame, {
                ...state.currentGame,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                game_data: (updatedGame.game_data as Record<string, any>) || {}
              });
            }
          } else {
            // No conflicts, update local state
            setState(prev => ({
              ...prev,
              currentGame: prev.currentGame ? {
                ...prev.currentGame,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                game_data: (updatedGame.game_data as Record<string, any>) || {},
                settings: {
                  genre: updatedGame.genre || undefined,
                  tags: updatedGame.tags || [],
                  visibility: (updatedGame.visibility as GameData['visibility']) || 'private',
                  thumbnail_url: updatedGame.thumbnail_url || undefined
                }
              } : null
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealTimeSync, state.currentGame?.id, state.hasUnsavedChanges, supabase, onConflict]);

  // Load game on mount
  useEffect(() => {
    if (gameId && user) {
      loadGame(gameId);
    }
  }, [gameId, user, loadGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Force save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        forceSave(); // Try to save quickly
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges, forceSave]);

  return {
    // State
    ...state,
    
    // Actions
    loadGame,
    createGame,
    updateGame,
    saveGame,
    forceSave,
    
    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null, saveStatus: 'idle' })),
    resolveConflict: (useLocal: boolean) => {
      if (state.conflictData) {
        const dataToUse = useLocal ? state.currentGame! : state.conflictData;
        setState(prev => ({
          ...prev,
          currentGame: dataToUse,
          saveStatus: 'idle',
          conflictData: undefined
        }));
        saveGame(dataToUse, true);
      }
    }
  };
}