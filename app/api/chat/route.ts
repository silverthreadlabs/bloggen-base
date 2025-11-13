import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Fetches a file from a URL and converts it to base64
 */
async function fetchFileAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

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
      context,
    }: {
      messages: UIMessage[];
      id?: string;
      isRegenerate?: boolean;
      context?: string;
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
        try {
          const exists = await messageExistsById(lastMessage.id);
          if (!exists) {
            // Extract fileIds from metadata if present
            const metadata = lastMessage.metadata as { fileIds?: string[] } | undefined;
            const fileIds = metadata?.fileIds || [];
            
            // Fetch file info and add to parts for storage
            const partsWithFiles = [...lastMessage.parts];
            if (fileIds.length > 0) {
              for (const fileId of fileIds) {
                const fileRecord = await getFileById(fileId);
                if (fileRecord) {
                  // Add file reference to parts so it's stored in the message
                  partsWithFiles.push({
                    type: 'file' as const,
                    data: fileRecord.url,
                    mimeType: fileRecord.type,
                    filename: fileRecord.name,
                  } as any);
                }
              }
            }
            
            const savedUserMsg = await saveMessage(
              chatId,
              'user',
              partsWithFiles, // Save with file references
              [],
              context, // Save context separately
              lastMessage.id,
            );
            console.log('[Chat API] Saved user message:', savedUserMsg.id, 'with', fileIds.length, 'file(s)');
            
            // Link uploaded files to this message
            if (fileIds.length > 0) {
              await linkFilesToMessage(fileIds, savedUserMsg.id);
              console.log('[Chat API] Linked', fileIds.length, 'files to message:', savedUserMsg.id);
            }
          } else {
            console.log('[Chat API] User message already exists:', lastMessage.id);
          }
        } catch (error) {
          console.error('[Chat API] Error checking/saving user message:', error);
        }
      }
    }

    // OPTIMIZED: Process file attachments efficiently
    // Only converts files to base64 when present, processes in parallel for speed
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.role !== 'user') return message;

        // Check for fileIds in metadata (new uploads) OR file parts in message (from DB)
        const metadata = message.metadata as { fileIds?: string[] } | undefined;
        const fileIds = metadata?.fileIds || [];
        const existingFileParts = message.parts.filter((part: any) => part.type === 'file');
        
        // Skip if no files - optimization for faster responses
        if (fileIds.length === 0 && existingFileParts.length === 0) return message;

        // Collect all files to process (from metadata and existing parts)
        const filesToProcess: Array<{url: string; type: string; name: string}> = [];
        
        // Add new files from metadata
        if (fileIds.length > 0) {
          const fileRecords = await Promise.all(fileIds.map(id => getFileById(id)));
          fileRecords.forEach(file => {
            if (file) filesToProcess.push({ url: file.url, type: file.type, name: file.name });
          });
        }
        
        // Add existing files from message parts
        existingFileParts.forEach((part: any) => {
          const url = part.data || part.url;
          if (url) {
            filesToProcess.push({
              url,
              type: part.mimeType || part.mediaType || 'application/octet-stream',
              name: part.filename || 'document',
            });
          }
        });
        
        if (filesToProcess.length === 0) return message;

        // Convert all files to base64 in parallel (OPTIMIZED for speed)
        const convertedParts = (await Promise.all(
          filesToProcess.map(async (file) => {
            try {
              const base64Data = await fetchFileAsBase64(file.url);
              const isImage = file.type.startsWith('image/');
              
              return isImage
                ? {
                    type: 'data-image',
                    data: { url: `data:${file.type};base64,${base64Data}` },
                  } as any
                : {
                    type: 'data-file',
                    data: {
                      base64: base64Data,
                      mediaType: file.type,
                      filename: file.name,
                    },
                  } as any;
            } catch (error) {
              console.error('[Chat API] Error converting file:', file.name, error);
              return null;
            }
          })
        )).filter(Boolean);

        // Keep non-file parts and add converted file parts
        const nonFileParts = message.parts.filter((part: any) => part.type !== 'file');
        
        return {
          ...message,
          parts: [...nonFileParts, ...convertedParts],
        };
      })
    );

    const modifiedMessages = [...processedMessages];
    
    // Then, combine context with the last user message if context exists
    if (context) {
      const lastMessageIndex = modifiedMessages.length - 1;
      const lastMessage = modifiedMessages[lastMessageIndex];

      if (lastMessage?.role === 'user') {
        const originalContent = lastMessage.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        const combinedContent = `<instructions>
${context}
</instructions>

${originalContent}`;

        // Update text parts with context, preserve other parts (like images and files)
        modifiedMessages[lastMessageIndex] = {
          ...lastMessage,
          parts: lastMessage.parts.map((part) =>
            part.type === 'text' ? { ...part, text: combinedContent } : part,
          ),
        };
      }
    }

    // Filter out invalid file parts from messages BEFORE conversion
    const cleanedMessages = modifiedMessages.map(message => ({
      ...message,
      parts: message.parts.filter((part: any) => {
        // Remove file parts that don't have data (these shouldn't exist now)
        if (part.type === 'file' && !part.data) {
          console.log('[Chat API] Removing invalid file part without data');
          return false;
        }
        // Keep all other parts including images
        return true;
      }),
    }));

    // Always use convertToModelMessages to ensure proper conversion
    const convertedMessages = convertToModelMessages(cleanedMessages, {
      convertDataPart: (part: any) => {
        // Convert data-image parts to file parts for the model
        if (part.type === 'data-image' && part.data?.url) {
          return {
            type: 'file',
            data: part.data.url,
            mediaType: 'image/jpeg',
          };
        }
        // Convert data-file parts (PDFs, docs) to file parts for the model
        if (part.type === 'data-file' && part.data?.base64) {
          return {
            type: 'file',
            data: part.data.base64,
            mediaType: part.data.mediaType || 'application/octet-stream',
          };
        }
        // Convert file parts to file parts for the model
        if (part.type === 'file' && part.data) {
          return {
            type: 'file',
            data: part.data,
            mediaType: part.mediaType || part.mimeType || 'application/octet-stream',
          };
        }
        return undefined;
      },
    });
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt('default'),
      messages: convertedMessages,
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
