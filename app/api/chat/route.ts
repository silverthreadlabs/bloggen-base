import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
} from '@/lib/api/utils';
import {
  createChat,
  getChatById,
  messageExistsById,
  saveMessage,
} from '@/lib/db/chat-queries';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getSystemPrompt } from '@/lib/config/prompts';

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
    }: { messages: UIMessage[]; id?: string; isRegenerate?: boolean } = body;

    // If not in query, check body.id (from useChat id parameter)
    if (!chatId && id) {
      chatId = id;
    }

    // Vercel pattern: Check if chat exists, if not create it (auto-create on first message)
    if (chatId) {
      const existingChat = await getChatById(chatId);

      if (!existingChat) {
        // Chat doesn't exist yet - create it now (seamless new chat pattern)
        console.log('[API] Creating new chat with ID:', chatId);

        // Generate title from first user message (similar to Vercel)
        const firstUserMessage = messages.find((m) => m.role === 'user');
        let title = 'New Chat';

        if (firstUserMessage) {
          const textContent =
            firstUserMessage.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('') || '';

          // Use first 50 chars as title
          if (textContent.trim()) {
            title = textContent.slice(0, 50).trim();
          }
        }

        // Create chat with generated ID (server-generated from /chat page)
        await createChat(user.id, title, chatId);
      }
    }

    // If chatId is provided, save the user message asynchronously (don't wait)
    if (chatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        // Extract text content from parts
        const content = lastMessage.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        // Check if this message ID already exists in the database
        // This prevents duplicates even if content is the same
        console.log('[API] Checking if user message exists:', {
          messageId: lastMessage.id,
          content: content.substring(0, 50) + '...',
        });

        messageExistsById(lastMessage.id)
          .then((exists) => {
            console.log('[API] Message exists check result:', {
              messageId: lastMessage.id,
              exists,
            });

            if (!exists) {
              console.log(
                '[API] Saving new user message with ID:',
                lastMessage.id,
              );
              // New message - save it with the AI SDK's ID
              return saveMessage(
                chatId,
                'user',
                content,
                lastMessage.parts,
                [],
                lastMessage.id, // Use the AI SDK's message ID
              );
            } else {
              console.log(
                '[API] User message ID already exists in DB, skipping save (regeneration or duplicate)',
              );
            }
          })
          .catch((error) =>
            console.error('Error checking/saving user message:', error),
          );
      }
    }

    // Start streaming immediately with system prompt
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt('default'),
      messages: convertToModelMessages(messages),
    });

    // Add rate limit headers to successful response
    const response = result.toUIMessageStreamResponse();
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
