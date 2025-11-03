import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { saveMessage, messageExistsById } from '@/lib/db/chat-queries';
import { getAuthenticatedUserFromRequest, handleApiError } from '@/lib/api/utils';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);

    // Extract chatId from query params or body
    const url = new URL(req.url);
    let chatId = url.searchParams.get('chatId');
    
    const body = await req.json();
    const { messages, id, isRegenerate }: { messages: UIMessage[]; id?: string; isRegenerate?: boolean } = body;
    
    // If not in query, check body.id (from useChat id parameter)
    if (!chatId && id) {
      chatId = id;
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
          content: content.substring(0, 50) + '...' 
        });
        
        messageExistsById(lastMessage.id)
          .then(exists => {
            console.log('[API] Message exists check result:', { 
              messageId: lastMessage.id, 
              exists 
            });
            
            if (!exists) {
              console.log('[API] Saving new user message with ID:', lastMessage.id);
              // New message - save it with the AI SDK's ID
              return saveMessage(
                chatId,
                'user',
                content,
                lastMessage.parts,
                [],
                lastMessage.id  // Use the AI SDK's message ID
              );
            } else {
              console.log('[API] User message ID already exists in DB, skipping save (regeneration or duplicate)');
            }
          })
          .catch(error => console.error('Error checking/saving user message:', error));
      }
    }

    // Start streaming immediately
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful AI assistant. Be concise and friendly.',
      messages: convertToModelMessages(messages),
      async onFinish({ text, finishReason, usage, response }) {
        // Save assistant response after streaming completes
        if (chatId) {
          try {
            // For assistant messages, we can't get the AI SDK's temp ID from streamText
            // So we just save with auto-generated ID
            // The messageExistsById check will work because assistant messages are new each time
            await saveMessage(
              chatId,
              'assistant',
              text,
              [{ type: 'text', text }],
              []
            );
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error, 'Chat API Error');
  }
}
