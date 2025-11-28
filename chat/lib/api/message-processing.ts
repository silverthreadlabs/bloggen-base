/**
 * Message Processing Utilities for Chat
 * Handles message transformation, file attachment processing, and text merging
 */

import type { UIMessage } from 'ai';
import { getFileById } from '@/lib/db/file-queries';
import { processFiles, type FileMetadata } from '../../utils/file-processing';

/**
 * Extract file metadata from message
 */
export function extractFileMetadata(message: UIMessage): {
  fileIds: string[];
  existingFileParts: any[];
} {
  const metadata = message.metadata as { fileIds?: string[] } | undefined;
  const fileIds = metadata?.fileIds || [];

  // Filter out preview file parts (ones with __uploading flag) and only keep real file parts from DB
  const existingFileParts = message.parts.filter((part: any) => {
    if (part.type === 'file') {
      // Skip preview files (they have __uploading flag or blob: URLs)
      const anyPart = part as any;
      if (anyPart.__uploading) return false;
      const url = anyPart.data || anyPart.url;
      if (url && typeof url === 'string' && url.startsWith('blob:'))
        return false;
      return true;
    }
    return false;
  });

  return { fileIds, existingFileParts };
}

/**
 * Collect files to process from metadata and existing parts
 */
export async function collectFilesToProcess(
  fileIds: string[],
  existingFileParts: any[],
): Promise<FileMetadata[]> {
  const filesToProcess: FileMetadata[] = [];

  // Add new files from metadata
  if (fileIds.length > 0) {
    const fileRecords = await Promise.all(
      fileIds.map((id) =>
        getFileById(id).catch((err) => {
          console.error('[Message Processing] Error fetching file:', id, err);
          return null;
        }),
      ),
    );
    fileRecords.forEach((file) => {
      if (file)
        filesToProcess.push({ url: file.url, type: file.type, name: file.name });
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

  return filesToProcess;
}

/**
 * Merge message parts with processed files
 */
export function mergeMessageParts(
  originalParts: any[],
  convertedParts: any[],
): any[] {
  // Filter out preview files from original parts
  const nonFileParts = originalParts.filter((part: any) => {
    if (!part) return false;
    if (part.type === 'file') {
      // Skip preview files
      if (part.__uploading) return false;
      const url = part.data || part.url;
      if (url && typeof url === 'string' && url.startsWith('blob:'))
        return false;
    }
    return part.type !== 'file';
  });

  // Separate text and non-text parts
  const textParts = convertedParts.filter(
    (part: any) => part && part.type === 'text',
  );
  const otherParts = convertedParts.filter(
    (part: any) => part && part.type !== 'text',
  );

  const updatedParts = [
    ...nonFileParts.filter((part: any) => part && part.type !== 'text'),
    ...otherParts,
  ];

  // Merge all text content
  const existingTextParts = nonFileParts.filter(
    (part: any) => part && part.type === 'text',
  );
  const fileTextContent = textParts.map((part: any) => part.text || '').join('');

  if (existingTextParts.length > 0 || fileTextContent) {
    const existingText = existingTextParts
      .map((part: any) => part.text || '')
      .join('');
    const combinedText = existingText + fileTextContent;

    if (combinedText.trim()) {
      updatedParts.unshift({
        type: 'text',
        text: combinedText,
      });
    }
  }

  return updatedParts.filter((part): part is any => !!part);
}

/**
 * Process messages and convert file attachments
 * This is optimized to handle files asynchronously without blocking
 */
export async function processMessages(
  messages: UIMessage[],
): Promise<UIMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== 'user') return message;

      const { fileIds, existingFileParts } = extractFileMetadata(message);

      // Skip if no files
      if (fileIds.length === 0 && existingFileParts.length === 0) {
        return message;
      }

      const filesToProcess = await collectFilesToProcess(
        fileIds,
        existingFileParts,
      );

      if (filesToProcess.length === 0) return message;

      console.log(
        '[Message Processing] Processing',
        filesToProcess.length,
        'files for message',
      );

      // Process all files in parallel
      const convertedParts = await processFiles(filesToProcess);

      // Merge with existing message parts
      const updatedParts = mergeMessageParts(message.parts, convertedParts);

      return {
        ...message,
        parts: updatedParts,
      };
    }),
  );
}

/**
 * Add context to the last user message
 */
export function addContextToLastMessage(
  messages: UIMessage[],
  context: string,
): UIMessage[] {
  const modifiedMessages = [...messages];
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
          part.type === 'text'
            ? { ...part, type: 'text', text: combinedContent }
            : part,
        ),
    };
  }

  return modifiedMessages;
}

/**
 * Clean up invalid file parts and filter out preview files
 */
export function cleanMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part: any) => {
      if (!part) return false;

      // Remove preview files (with __uploading flag or blob: URLs)
      if (part.type === 'file') {
        if (part.__uploading) return false;
        const url = part.data || part.url;
        if (url && typeof url === 'string' && url.startsWith('blob:'))
          return false;
        if (!part.data && !url) {
          console.warn(
            '[Message Processing] Removing invalid file part without data',
          );
          return false;
        }
      }

      return true;
    }),
  }));
}
