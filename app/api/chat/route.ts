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
import { allowedTypes } from '@/lib/constants';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ============================================================================
// FILE TYPE CONFIGURATION
// ============================================================================

/**
 * Check if a file type is allowed based on our restricted list
 */
function isFileTypeAllowed(mediaType: string): boolean {
  return allowedTypes.includes(mediaType);
}

/**
 * File types supported by OpenAI Chat Completions API
 * IMPORTANT: Only PDF and images are supported as file parts
 * DOCX, XLSX, etc. must be converted to text first
 */
const SUPPORTED_AS_FILES = {
  pdf: ['application/pdf'],
  images: [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
  ],
};

/**
 * File types that must be converted to text content
 * (Not supported as file parts by OpenAI)
 */
const CONVERT_TO_TEXT_TYPES = [
  // Office documents - NOT supported as file parts
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  
  // Text-based formats
  'text/plain',
  'text/markdown',
];

// ============================================================================
// FILE PROCESSING UTILITIES
// ============================================================================

/**
 * Check if file should be sent as a file part (PDF or image)
 */
function shouldSendAsFilePart(mediaType: string): boolean {
  return (
    SUPPORTED_AS_FILES.pdf.includes(mediaType) ||
    SUPPORTED_AS_FILES.images.includes(mediaType)
  );
}

/**
 * Check if file should be converted to text
 */
function shouldConvertToText(mediaType: string): boolean {
  return CONVERT_TO_TEXT_TYPES.includes(mediaType);
}

/**
 * Fetch file from URL and convert to base64
 */
async function fetchFileAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Fetch text file from URL
 */
async function fetchFileAsText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Extract text from DOCX file
 * Note: You'll need to install mammoth: npm install mammoth
 */
async function extractTextFromDocx(base64Data: string): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('[Chat API] Error extracting DOCX text:', error);
    return '[Error: Could not extract text from DOCX file]';
  }
}

/**
 * Extract text from XLSX file
 * Note: You'll need to install xlsx: npm install xlsx
 */
async function extractTextFromXlsx(base64Data: string): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let allText = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      allText += `\n--- Sheet: ${sheetName} ---\n${csvText}\n`;
    });
    
    return allText;
  } catch (error) {
    console.error('[Chat API] Error extracting XLSX text:', error);
    return '[Error: Could not extract text from XLSX file]';
  }
}

/**
 * Process a single file and convert to appropriate format
 * This function is optimized for async processing - it doesn't block the response
 */
async function processFile(file: { url: string; type: string; name: string }) {
  try {
    // Check if file type is allowed
    if (!isFileTypeAllowed(file.type)) {
      console.warn(`[Chat API] File type not allowed: ${file.type} for file: ${file.name}`);
      return null; // Skip unsupported files silently in background
    }
    
    // Handle PDF and images - send as file parts
    if (shouldSendAsFilePart(file.type)) {
      const isImage = file.type.startsWith('image/');
      const base64Data = await fetchFileAsBase64(file.url);
      
      if (isImage) {
        return {
          type: 'data-image',
          data: { url: `data:${file.type};base64,${base64Data}` },
        };
      } else {
        // PDF
        return {
          type: 'data-file',
          data: {
            base64: base64Data,
            mediaType: 'application/pdf',
            filename: file.name,
          },
        };
      }
    }
    
    // Handle DOCX files - extract text
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log(`[Chat API] Extracting text from DOCX: ${file.name}`);
      const base64Data = await fetchFileAsBase64(file.url);
      const text = await extractTextFromDocx(base64Data);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (.docx) ---\n${text}\n--- End of ${file.name} ---\n\n`,
      };
    }
    
    // Handle XLSX files - extract text
    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log(`[Chat API] Extracting text from XLSX: ${file.name}`);
      const base64Data = await fetchFileAsBase64(file.url);
      const text = await extractTextFromXlsx(base64Data);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (.xlsx) ---\n${text}\n--- End of ${file.name} ---\n\n`,
      };
    }
    
    // Handle other text-based files
    if (shouldConvertToText(file.type)) {
      console.log(`[Chat API] Converting ${file.type} to text: ${file.name}`);
      const textContent = await fetchFileAsText(file.url);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (${file.type}) ---\n${textContent}\n--- End of ${file.name} ---\n\n`,
      };
    }
    
    // Unsupported file type - skip silently
    console.warn(`[Chat API] Unsupported file type: ${file.type} for file: ${file.name}`);
    return null;
  } catch (error) {
    console.error('[Chat API] Error processing file:', file.name, error);
    // Return null to skip file on error - don't block the entire request
    return null;
  }
}

/**
 * Process messages and convert file attachments
 * This is optimized to handle files asynchronously without blocking
 */
async function processMessages(messages: UIMessage[]) {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== 'user') return message;
      
      // Get files from metadata (new uploads) and existing parts (from DB)
      const metadata = message.metadata as { fileIds?: string[] } | undefined;
      const fileIds = metadata?.fileIds || [];
      
      // Filter out preview file parts (ones with __uploading flag) and only keep real file parts from DB
      const existingFileParts = message.parts.filter((part: any) => {
        if (part.type === 'file') {
          // Skip preview files (they have __uploading flag or blob: URLs)
          const anyPart = part as any;
          if (anyPart.__uploading) return false;
          const url = anyPart.data || anyPart.url;
          if (url && typeof url === 'string' && url.startsWith('blob:')) return false;
          return true;
        }
        return false;
      });
      
      // Skip if no files
      if (fileIds.length === 0 && existingFileParts.length === 0) {
        return message;
      }
      
      // Collect all files to process
      const filesToProcess: Array<{ url: string; type: string; name: string }> = [];
      
      // Add new files from metadata
      if (fileIds.length > 0) {
        const fileRecords = await Promise.all(
          fileIds.map(id => getFileById(id).catch(err => {
            console.error('[Chat API] Error fetching file:', id, err);
            return null;
          }))
        );
        fileRecords.forEach(file => {
          if (file) filesToProcess.push({ url: file.url, type: file.type, name: file.name });
        });
      }
      
      // Add existing files from message parts (from DB)
      existingFileParts.forEach((part: any) => {
        const url = part.data || part.url;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          filesToProcess.push({
            url,
            type: part.mimeType || part.mediaType || 'application/octet-stream',
            name: part.filename || 'document',
          });
        }
      });
      
      if (filesToProcess.length === 0) return message;
      
      console.log('[Chat API] Processing', filesToProcess.length, 'files for message');
      
      // Process all files in parallel with timeout protection
      const fileProcessingPromises = filesToProcess.map(file => 
        processFile(file).catch(err => {
          console.error('[Chat API] File processing error:', file.name, err);
          return null;
        })
      );
      
      const convertedParts = (await Promise.all(fileProcessingPromises)).filter(Boolean);
      
      console.log('[Chat API] Processed', convertedParts.length, 'files successfully');
      
      // Separate text and non-text parts (filter out preview files)
      const nonFileParts = message.parts.filter((part: any) => {
        if (!part) return false;
        if (part.type === 'file') {
          // Skip preview files
          if (part.__uploading) return false;
          const url = part.data || part.url;
          if (url && typeof url === 'string' && url.startsWith('blob:')) return false;
        }
        return part.type !== 'file';
      });
      
      const textParts = convertedParts.filter((part: any) => part && part.type === 'text');
      const otherParts = convertedParts.filter((part: any) => part && part.type !== 'text');
      
      // Combine text content
      const existingTextParts = nonFileParts.filter((part: any) => part && part.type === 'text');
      const fileTextContent = textParts.map((part: any) => part.text || '').join('');
      
      let updatedParts = [
        ...nonFileParts.filter((part: any) => part && part.type !== 'text'),
        ...otherParts
      ];
      
      // Merge all text content
      if (existingTextParts.length > 0 || fileTextContent) {
        const existingText = existingTextParts.map((part: any) => part.text || '').join('');
        const combinedText = existingText + fileTextContent;
        
        if (combinedText.trim()) {
          updatedParts.unshift({
            type: 'text',
            text: combinedText,
          });
        }
      }
      
      return {
        ...message,
        parts: updatedParts.filter((part): part is any => !!part),
      };
    })
  );
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

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
            
            // Add file references to parts
            const partsWithFiles = [...lastMessage.parts];
            if (fileIds.length > 0) {
              for (const fileId of fileIds) {
                const fileRecord = await getFileById(fileId);
                if (fileRecord) {
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
    const modifiedMessages = [...processedMessages];
    if (context) {
      const lastMessageIndex = modifiedMessages.length - 1;
      const lastMessage = modifiedMessages[lastMessageIndex];
      if (lastMessage?.role === 'user' && lastMessage.parts) {
        const originalContent = lastMessage.parts
          .filter((part): part is any => !!part && part.type === 'text')
          .map((part) => part.text || '')
          .join('');
        const combinedContent = `<instructions>\n${context}\n</instructions>\n${originalContent}`;
        
        modifiedMessages[lastMessageIndex] = {
          ...lastMessage,
          parts: lastMessage.parts
            .filter((part): part is any => !!part)
            .map((part) =>
              part.type === 'text' ? { ...part, type: 'text', text: combinedContent } : part
            ),
        };
      }
    }
    
    // Clean up invalid file parts and filter out preview files
    const cleanedMessages = modifiedMessages.map(message => ({
      ...message,
      parts: message.parts.filter((part: any) => {
        if (!part) return false;
        
        // Remove preview files (with __uploading flag or blob: URLs)
        if (part.type === 'file') {
          if (part.__uploading) return false;
          const url = part.data || part.url;
          if (url && typeof url === 'string' && url.startsWith('blob:')) return false;
          if (!part.data && !url) {
            console.warn('[Chat API] Removing invalid file part without data');
            return false;
          }
        }
        
        return true;
      }),
    }));
    
    // Convert to model messages
    const convertedMessages = convertToModelMessages(cleanedMessages, {
      convertDataPart: (part: any) => {
        // Convert data-image to file part
        if (part.type === 'data-image' && part.data?.url) {
          return {
            type: 'file',
            data: part.data.url,
            mediaType: 'image/jpeg',
          };
        }
        
        // Convert data-file (PDF only) to file part
        if (part.type === 'data-file' && part.data?.base64) {
          return {
            type: 'file',
            data: part.data.base64,
            mediaType: 'application/pdf', // Only PDF is supported as file part
          };
        }
        
        return undefined;
      },
    });
    
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