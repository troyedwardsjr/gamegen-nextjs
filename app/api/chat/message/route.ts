import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProviderManager } from '@/lib/llm/providers/manager';
import { ChatCompletionRequest, LLMCapability } from '@/lib/llm/types';

// Types for the request/response
interface ChatMessageRequest {
  sessionId: string;
  messageId: string;
  content: string;
  contextType: 'game-design' | 'code-help' | 'art-generation' | 'general';
  gameId?: string;
}

interface StreamingResponse {
  type: 'message_start' | 'content_delta' | 'message_stop' | 'error';
  message?: any;
  delta?: string;
  error?: string;
}

// Context-specific system prompts
const SYSTEM_PROMPTS = {
  'game-design': `You are an expert game designer and pixel art game development assistant. You specialize in:

- Game mechanics and system design
- Pixel art creation and animation guidance
- Level design and player progression
- Balancing gameplay elements
- Creating engaging user experiences
- Technical implementation advice for 2D games

Always provide practical, actionable advice with specific examples. When discussing pixel art, describe color palettes, sprite dimensions, and animation techniques. Focus on creating fun, engaging gameplay experiences.`,

  'code-help': `You are a senior software engineer specializing in game development. You excel at:

- Game programming in JavaScript/TypeScript, C#, and Python
- Game engines like Unity, Godot, and web-based frameworks
- Performance optimization and debugging
- Code architecture and best practices
- Algorithm design for game systems
- Cross-platform development

Provide clean, well-commented code examples. Explain complex concepts clearly and suggest best practices for maintainable game code.`,

  'art-generation': `You are a pixel art specialist and game artist. You're expert at:

- Pixel art techniques and color theory
- Character design and animation
- Environmental art and tilesets
- UI/UX design for games
- Asset optimization and technical constraints
- Visual storytelling through art

Provide detailed descriptions of pixel art techniques, color choices, and composition. When suggesting art, include specific pixel dimensions, color palettes, and animation frame counts.`,

  'general': `You are a helpful AI assistant for game development. You can help with:

- Brainstorming game ideas
- Project planning and scope management
- Learning resources and tutorials
- Industry insights and trends
- Creative problem solving
- General game development questions

Be encouraging and supportive while providing practical, actionable advice. Help users think through problems and discover solutions.`
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatMessageRequest = await request.json();
    const { sessionId, messageId, content, contextType, gameId } = body;

    // Validate request
    if (!sessionId || !messageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from request
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get chat history for context
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('message_type, content')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true })
      .limit(10); // Last 10 messages for context

    if (messagesError) {
      console.error('Failed to fetch chat history:', messagesError);
    }

    // Build conversation history
    const conversationHistory = messages?.map(msg => ({
      role: msg.message_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    })) || [];

    // Add system prompt
    const systemPrompt = SYSTEM_PROMPTS[contextType] || SYSTEM_PROMPTS.general;
    
    // Prepare LLM request
    const chatRequest: ChatCompletionRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: content }
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
      metadata: {
        sessionId,
        messageId,
        contextType,
        gameId,
        userId: user.id
      }
    };

    // Get LLM provider
    const providerManager = ProviderManager.getInstance();
    
    const provider = await providerManager.selectProvider({
      capabilities: [LLMCapability.TEXT_GENERATION],
      cost_priority: 'balanced'
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'No suitable AI provider available' },
        { status: 503 }
      );
    }

    // Create AI message record
    let aiMessage: any = null;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    // Set up streaming response
    const encoder = new TextEncoder();
    let responseContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create initial AI message record
          const { data: newMessage, error: createError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              parent_message_id: messageId,
              message_type: 'ai',
              content: '',
              status: 'sending',
              is_streaming: true,
              model_used: provider.getId(),
              provider_id: provider.getId()
            })
            .select()
            .single();

          if (createError) {
            throw new Error('Failed to create AI message record');
          }

          aiMessage = newMessage;

          // Send message start event
          const startEvent: StreamingResponse = {
            type: 'message_start',
            message: aiMessage
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`)
          );

          // Process streaming response
          const response = await provider.complete(chatRequest);
          
          if (!response.body) {
            throw new Error('No response body from provider');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // Handle different streaming event types from Claude/OpenAI
                  if (data.type === 'content_block_delta' || data.type === 'content_delta') {
                    const delta = data.delta?.text || data.delta || '';
                    responseContent += delta;

                    // Send content delta
                    const deltaEvent: StreamingResponse = {
                      type: 'content_delta',
                      delta
                    };
                    
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(deltaEvent)}\n\n`)
                    );

                    // Update message in database periodically
                    if (responseContent.length % 100 === 0) {
                      await supabase
                        .from('chat_messages')
                        .update({
                          content: responseContent,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', aiMessage.id);
                    }
                  } else if (data.type === 'message_stop' || data.type === 'done') {
                    // Extract usage statistics if available
                    if (data.usage) {
                      totalTokens = data.usage.total_tokens || 0;
                      promptTokens = data.usage.prompt_tokens || 0;
                      completionTokens = data.usage.completion_tokens || 0;
                    }
                    break;
                  }
                } catch (parseError) {
                  console.error('Failed to parse streaming data:', parseError);
                }
              }
            }
          }

          // Calculate cost (rough estimate - adjust based on actual provider pricing)
          const costCents = Math.ceil((promptTokens * 0.001 + completionTokens * 0.002) * 100);

          // Update final message
          const { data: updatedMessage, error: updateError } = await supabase
            .from('chat_messages')
            .update({
              content: responseContent,
              status: 'delivered',
              is_streaming: false,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
              cost_cents: costCents,
              delivered_at: new Date().toISOString()
            })
            .eq('id', aiMessage.id)
            .select()
            .single();

          if (updateError) {
            console.error('Failed to update message:', updateError);
          }

          // Send final message event
          const stopEvent: StreamingResponse = {
            type: 'message_stop',
            message: updatedMessage || { ...aiMessage, content: responseContent, is_streaming: false }
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(stopEvent)}\n\n`)
          );

          // Track usage for billing/analytics
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: user.id,
              feature_type: 'chat_completion',
              tokens_used: totalTokens,
              cost_cents: costCents,
              metadata: {
                sessionId,
                messageId: aiMessage.id,
                provider: provider.getId(),
                model: provider.getId(),
                contextType
              }
            });

        } catch (error) {
          console.error('Streaming error:', error);
          
          // Update message with error status
          if (aiMessage) {
            await supabase
              .from('chat_messages')
              .update({
                status: 'error',
                is_streaming: false,
                content: responseContent || 'Failed to generate response'
              })
              .eq('id', aiMessage.id);
          }

          // Send error event
          const errorEvent: StreamingResponse = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CHAT_API_ERROR'
      },
      { status: 500 }
    );
  }
}