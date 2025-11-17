import { openai } from '@ai-sdk/openai';
import { streamText, type UIMessage } from 'ai';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
} from '@/lib/api/utils';
import { getSystemPrompt } from '@/lib/config/prompts';
import {
  createChat,
  getChatById,
  messageExistsById,
  saveMessage,
} from '@/lib/db/chat-queries';
import { linkFilesToMessage, getFileById } from '@/lib/db/file-queries';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { generateChatTitle } from '@/lib/utils/generate-chat-title';
import {
  processMessages,
  addContextToLastMessage,
  cleanMessages,
  convertMessagesToModelFormat,
} from '@/lib/utils/chat';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Check rate limit
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
            'X-RateLimit-Limit': getRateLimitConfig(rateLimitResult.role).limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset > 0
              ? Math.max(0, Math.ceil((rateLimitResult.reset - Date.now()) / 1000)).toString()
              : '0',
          },
        },
      );
    }
    
    // Authenticate user
    const user = await getAuthenticatedUserFromRequest(req);
    
    // Parse request
    const url = new URL(req.url);
    let chatId = url.searchParams.get('chatId');
    const body = await req.json();
    const {
      messages,
      id,
      context,
    }: {
      messages: UIMessage[];
      id?: string;
      context?: string;
    } = body;
    
    if (!chatId && id) {
      chatId = id;
    }
    
    // Handle chat creation/retrieval
    let chatTitle = 'New Chat';
    
    if (chatId) {
      const existingChat = await getChatById(chatId);
      if (!existingChat) {
        const firstUserMessage = messages.find((m) => m.role === 'user');
        if (firstUserMessage) {
          const textContent = firstUserMessage.parts
            ?.filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('') || '';
          if (textContent.trim()) {
            chatTitle = await generateChatTitle(textContent);
          }
        }
        await createChat(user.id, chatTitle, chatId);
      } else {
        chatTitle = existingChat.title;
      }
    }
    
    // Save user message
    if (chatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        try {
          const exists = await messageExistsById(lastMessage.id);
          if (!exists) {
            const metadata = lastMessage.metadata as { fileIds?: string[] } | undefined;
            const fileIds = metadata?.fileIds || [];
            
            // Add file references to parts only if not already present (optimistic UI adds them)
            const partsWithFiles = [...lastMessage.parts];
            
            // Check if file/image parts already exist in the message
            // Cast to any to check for custom part types (file, image) that AI SDK adds
            const hasFileParts = partsWithFiles.some((part: any) => 
              part.type === 'file' || (part.type === 'image' && part.image)
            );
            
            // Only add file parts if they don't exist (for backward compatibility or if optimistic UI didn't add them)
            if (fileIds.length > 0 && !hasFileParts) {
              for (const fileId of fileIds) {
                const fileRecord = await getFileById(fileId);
                if (fileRecord) {
                  if (fileRecord.type.startsWith('image/')) {
                    partsWithFiles.push({
                      type: 'image' as const,
                      image: fileRecord.url,
                    } as any);
                  } else {
                    partsWithFiles.push({
                      type: 'file' as const,
                      data: fileRecord.url,
                      mimeType: fileRecord.type,
                    } as any);
                  }
                }
              }
            }
            
            const savedUserMsg = await saveMessage(
              chatId,
              'user',
              partsWithFiles,
              [],
              context,
              lastMessage.id,
            );
            
            console.log('[Chat API] Saved user message:', savedUserMsg.id, 'with', fileIds.length, 'file(s)');
            
            // Link files to message
            if (fileIds.length > 0) {
              await linkFilesToMessage(fileIds, savedUserMsg.id);
              console.log('[Chat API] Linked', fileIds.length, 'files to message:', savedUserMsg.id);
            }
          }
        } catch (error) {
          console.error('[Chat API] Error saving user message:', error);
        }
      }
    }
    
    // Process messages with file attachments
    const processedMessages = await processMessages(messages);
    
    // Add context to last message if provided
    const modifiedMessages = context
      ? addContextToLastMessage(processedMessages, context)
      : processedMessages;
    
    // Clean up invalid file parts and filter out preview files
    const cleanedMessages = cleanMessages(modifiedMessages);
    
    // Convert to model messages
    const convertedMessages = convertMessagesToModelFormat(cleanedMessages);
    
    // Stream response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt('default'),
      messages: convertedMessages,
    });
    
    const response = result.toUIMessageStreamResponse({
      messageMetadata({ part }) {
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
    headers.set('X-RateLimit-Limit', getRateLimitConfig(rateLimitResult.role).limit.toString());
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