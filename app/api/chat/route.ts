import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
} from '@/lib/api/utils';
import {
  applyMessageModifiers,
  type LengthOption,
  type ToneOption,
} from '@/lib/config/message-modifiers';
import { getSystemPrompt } from '@/lib/config/prompts';
import {
  createChat,
  getChatById,
  messageExistsById,
  saveMessage,
} from '@/lib/db/chat-queries';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { generateChatTitle } from '@/lib/utils/generate-chat-title';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Check rate limit before processing the request
    const rateLimitResult = await checkRateLimit();

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.error || 'Rate limit exceeded',
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': getRateLimitConfig(
              rateLimitResult.role,
            ).limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After':
              rateLimitResult.reset > 0
                ? Math.max(
                    0,
                    Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
                  ).toString()
                : '0',
          },
        },
      );
    }

    const user = await getAuthenticatedUserFromRequest(req);

    // Extract chatId from query params or body
    const url = new URL(req.url);
    let chatId = url.searchParams.get('chatId');

    const body = await req.json();
    const {
      messages,
      id,
      isRegenerate,
      tone,
      length,
    }: {
      messages: UIMessage[];
      id?: string;
      isRegenerate?: boolean;
      tone?: ToneOption;
      length?: LengthOption;
    } = body;

    if (!chatId && id) {
      chatId = id;
    }

    let chatTitle = 'New Chat';
    
    if (chatId) {
      const existingChat = await getChatById(chatId);

      if (!existingChat) {
        const firstUserMessage = messages.find((m) => m.role === 'user');

        if (firstUserMessage) {
          const textContent =
            firstUserMessage.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('') || '';

          if (textContent.trim()) {
            // Generate AI title immediately (happens in parallel with chat creation)
            chatTitle = await generateChatTitle(textContent);
          }
        }

        await createChat(user.id, chatTitle, chatId);
      } else {
        chatTitle = existingChat.title;
      }
    }

    // Save user message BEFORE streaming (ensures correct order)
    if (chatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const content = lastMessage.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        try {
          const exists = await messageExistsById(lastMessage.id);
          if (!exists) {
            const savedUserMsg = await saveMessage(
              chatId,
              'user',
              content,
              lastMessage.parts,
              [],
              lastMessage.id,
            );
            console.log('[Chat API] Saved user message:', savedUserMsg.id, 'for chat:', chatId);
          } else {
            console.log('[Chat API] User message already exists:', lastMessage.id);
          }
        } catch (error) {
          console.error('[Chat API] Error checking/saving user message:', error);
        }
      }
    }

    const modifiedMessages = [...messages];
    if (tone || length) {
      const lastMessageIndex = modifiedMessages.length - 1;
      const lastMessage = modifiedMessages[lastMessageIndex];

      if (lastMessage?.role === 'user') {
        const originalContent = lastMessage.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        const modifiedContent = applyMessageModifiers(
          originalContent,
          tone || 'neutral',
          length || 'auto',
        );

        modifiedMessages[lastMessageIndex] = {
          ...lastMessage,
          parts: lastMessage.parts.map((part) =>
            part.type === 'text' ? { ...part, text: modifiedContent } : part,
          ),
        };
      }
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt('default'),
      messages: convertToModelMessages(modifiedMessages),
      // Don't save in onFinish - let client save with correct message ID
    });

    const response = result.toUIMessageStreamResponse({
      messageMetadata({ part }) {
        // Send chat metadata on finish event
        if (part.type === 'finish' && chatId && chatTitle) {
          return {
            chatId,
            chatTitle,
            isNewChat: messages.length === 1,
          };
        }
        return undefined;
      },
    });
    
    const headers = new Headers(response.headers);
    
    headers.set(
      'X-RateLimit-Limit',
      getRateLimitConfig(rateLimitResult.role).limit.toString(),
    );
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return handleApiError(error, 'Chat API Error');
  }
}
