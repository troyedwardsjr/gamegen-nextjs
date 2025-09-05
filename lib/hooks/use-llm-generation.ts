/**
 * React Hook for LLM Generation
 * 
 * Custom React hooks for handling LLM text generation requests,
 * streaming responses, usage tracking, and error handling.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  GenerationRequest,
  GenerationResponse,
  StreamChunk,
  LLMMessage,
  TokenUsage,
  LLMError
} from '@/lib/llm/types'

export interface UseLLMGenerationOptions {
  onStreamChunk?: (chunk: StreamChunk) => void
  onError?: (error: LLMError) => void
  onComplete?: (response: GenerationResponse) => void
  maxRetries?: number
  retryDelay?: number
}

export interface GenerationState {
  isGenerating: boolean
  response: GenerationResponse | null
  streamContent: string
  error: LLMError | null
  usage: TokenUsage | null
  cost: number | null
  isStreaming: boolean
  retryCount: number
}

export interface GenerationActions {
  generate: (request: GenerationRequest) => Promise<GenerationResponse | null>
  generateStream: (request: GenerationRequest) => Promise<void>
  cancel: () => void
  retry: () => Promise<void>
  reset: () => void
}

/**
 * Main hook for LLM generation
 */
export function useLLMGeneration(options: UseLLMGenerationOptions = {}): GenerationState & GenerationActions {
  const {
    onStreamChunk,
    onError,
    onComplete,
    maxRetries = 3,
    retryDelay = 1000
  } = options
  
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    response: null,
    streamContent: '',
    error: null,
    usage: null,
    cost: null,
    isStreaming: false,
    retryCount: 0
  })
  
  const lastRequestRef = useRef<GenerationRequest | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  
  /**
   * Make a regular (non-streaming) generation request
   */
  const generate = useCallback(async (
    request: GenerationRequest
  ): Promise<GenerationResponse | null> => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Store request for potential retry
    lastRequestRef.current = request
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController()
    
    setState(prev => ({
      ...prev,
      isGenerating: true,
      response: null,
      streamContent: '',
      error: null,
      usage: null,
      cost: null,
      isStreaming: false
    }))
    
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new LLMError(
          errorData.error || 'Generation failed',
          errorData.code || 'GENERATION_ERROR',
          undefined,
          response.status < 500 // Retryable if server error
        )
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new LLMError(
          data.error || 'Generation failed',
          data.code || 'GENERATION_ERROR'
        )
      }
      
      const generationResponse = data.data as GenerationResponse
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        response: generationResponse,
        usage: generationResponse.usage,
        cost: data.cost || null,
        retryCount: 0
      }))
      
      if (onComplete) {
        onComplete(generationResponse)
      }
      
      return generationResponse
      
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: new LLMError('Request cancelled', 'REQUEST_CANCELLED')
        }))
        return null
      }
      
      const llmError = error instanceof LLMError 
        ? error 
        : new LLMError(error.message || 'Unknown error', 'UNKNOWN_ERROR')
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: llmError
      }))
      
      if (onError) {
        onError(llmError)
      }
      
      return null
    }
  }, [onComplete, onError])
  
  /**
   * Make a streaming generation request
   */
  const generateStream = useCallback(async (
    request: GenerationRequest
  ): Promise<void> => {
    // Cancel any ongoing requests
    cancel()
    
    // Store request for potential retry
    lastRequestRef.current = { ...request, stream: true }
    
    setState(prev => ({
      ...prev,
      isGenerating: true,
      response: null,
      streamContent: '',
      error: null,
      usage: null,
      cost: null,
      isStreaming: true
    }))
    
    try {
      // Create EventSource for streaming
      const url = new URL('/api/llm/generate', window.location.origin)
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...request, stream: true })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new LLMError(
          errorData.error || 'Streaming failed',
          errorData.code || 'STREAMING_ERROR'
        )
      }
      
      // Handle server-sent events
      if (!response.body) {
        throw new Error('No response body for streaming')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                setState(prev => ({
                  ...prev,
                  isGenerating: false,
                  isStreaming: false,
                  retryCount: 0
                }))
                return
              }
              
              try {
                const chunk = JSON.parse(data) as StreamChunk | { type: 'error'; error: string; code: string }
                
                if ('error' in chunk) {
                  throw new LLMError(chunk.error, chunk.code)
                }
                
                // Handle different chunk types
                if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                  setState(prev => ({
                    ...prev,
                    streamContent: prev.streamContent + chunk.delta!.text
                  }))
                }
                
                if (chunk.usage) {
                  setState(prev => ({
                    ...prev,
                    usage: chunk.usage!
                  }))
                }
                
                // Call chunk handler
                if (onStreamChunk) {
                  onStreamChunk(chunk)
                }
                
              } catch (parseError) {
                console.warn('[useLLMGeneration] Failed to parse chunk:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      const llmError = error instanceof LLMError 
        ? error 
        : new LLMError(error.message || 'Streaming failed', 'STREAMING_ERROR')
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        error: llmError
      }))
      
      if (onError) {
        onError(llmError)
      }
    }
  }, [onStreamChunk, onError])
  
  /**
   * Cancel current generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setState(prev => ({
      ...prev,
      isGenerating: false,
      isStreaming: false,
      error: prev.error || new LLMError('Request cancelled', 'REQUEST_CANCELLED')
    }))
  }, [])
  
  /**
   * Retry last request
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!lastRequestRef.current || state.retryCount >= maxRetries) {
      return
    }
    
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null
    }))
    
    // Add retry delay
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, state.retryCount)))
    }
    
    const request = lastRequestRef.current
    
    if (request.stream) {
      await generateStream(request)
    } else {
      await generate(request)
    }
  }, [state.retryCount, maxRetries, retryDelay, generate, generateStream])
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel()
    
    setState({
      isGenerating: false,
      response: null,
      streamContent: '',
      error: null,
      usage: null,
      cost: null,
      isStreaming: false,
      retryCount: 0
    })
    
    lastRequestRef.current = null
  }, [cancel])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])
  
  return {
    ...state,
    generate,
    generateStream,
    cancel,
    retry,
    reset
  }
}

/**
 * Hook for simple text generation
 */
export function useTextGeneration() {
  const generation = useLLMGeneration()
  
  const generateText = useCallback(async (
    prompt: string,
    options: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      stream?: boolean
    } = {}
  ): Promise<string | null> => {
    const {
      systemPrompt,
      maxTokens = 2000,
      temperature = 0.7,
      stream = false
    } = options
    
    const request: GenerationRequest = {
      messages: [{ role: 'user', content: prompt }],
      system_prompt: systemPrompt,
      max_tokens: maxTokens,
      temperature,
      stream
    }
    
    if (stream) {
      await generation.generateStream(request)
      return generation.streamContent || null
    } else {
      const response = await generation.generate(request)
      return response?.content || null
    }
  }, [generation])
  
  return {
    ...generation,
    generateText
  }
}

/**
 * Hook for chat conversations
 */
export function useChatGeneration() {
  const [messages, setMessages] = useState<LLMMessage[]>([])
  const generation = useLLMGeneration()
  
  const sendMessage = useCallback(async (
    content: string,
    options: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      stream?: boolean
    } = {}
  ): Promise<void> => {
    const userMessage: LLMMessage = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    
    setMessages(newMessages)
    
    const request: GenerationRequest = {
      messages: newMessages,
      system_prompt: options.systemPrompt,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      stream: options.stream
    }
    
    if (options.stream) {
      await generation.generateStream(request)
      
      if (generation.streamContent) {
        const assistantMessage: LLMMessage = { 
          role: 'assistant', 
          content: generation.streamContent 
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } else {
      const response = await generation.generate(request)
      
      if (response) {
        const assistantMessage: LLMMessage = { 
          role: 'assistant', 
          content: response.content 
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    }
  }, [messages, generation])
  
  const clearMessages = useCallback(() => {
    setMessages([])
    generation.reset()
  }, [generation])
  
  const undoLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -2)) // Remove last user and assistant message
    generation.reset()
  }, [generation])
  
  return {
    ...generation,
    messages,
    sendMessage,
    clearMessages,
    undoLastMessage
  }
}

/**
 * Hook for tracking generation costs
 */
export function useGenerationCost() {
  const [totalCost, setTotalCost] = useState(0)
  const [sessionCost, setSessionCost] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  
  const generation = useLLMGeneration({
    onComplete: (response) => {
      // Estimate cost if not provided
      const cost = estimateGenerationCost(response.usage, response.provider_id)
      
      setTotalCost(prev => prev + cost)
      setSessionCost(prev => prev + cost)
      setRequestCount(prev => prev + 1)
    }
  })
  
  const resetSessionCost = useCallback(() => {
    setSessionCost(0)
    setRequestCount(0)
  }, [])
  
  return {
    ...generation,
    totalCost,
    sessionCost,
    requestCount,
    averageCostPerRequest: requestCount > 0 ? sessionCost / requestCount : 0,
    resetSessionCost
  }
}

/**
 * Estimate generation cost (placeholder implementation)
 */
function estimateGenerationCost(usage: TokenUsage, providerId: string): number {
  const rates = {
    claude: { input: 0.000003, output: 0.000015 }, // Per token
    openai: { input: 0.0000015, output: 0.000002 },
    gemini: { input: 0.0000005, output: 0.0000015 }
  }
  
  const rate = rates[providerId as keyof typeof rates] || rates.claude
  
  return (usage.prompt_tokens * rate.input) + (usage.completion_tokens * rate.output)
}