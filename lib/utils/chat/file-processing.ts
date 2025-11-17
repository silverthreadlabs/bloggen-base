/**
 * File Processing for Chat Messages
 * Handles conversion of file attachments to appropriate message parts
 */

import {
  isFileTypeAllowed,
  shouldSendAsFilePart,
  shouldConvertToText,
} from './file-types';
import {
  fetchFileAsBase64,
  fetchFileAsText,
  extractTextFromDocx,
  extractTextFromXlsx,
} from './file-conversion';

export type FileMetadata = {
  url: string;
  type: string;
  name: string;
};

export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'data-image'; data: { url: string } }
  | { type: 'data-file'; data: { base64: string; mediaType: string; filename: string } };

/**
 * Process a single file and convert to appropriate message part format
 * This function is optimized for async processing - it doesn't block the response
 */
export async function processFile(
  file: FileMetadata,
): Promise<MessagePart | null> {
  try {
    // Check if file type is allowed
    if (!isFileTypeAllowed(file.type)) {
      console.warn(
        `[File Processing] File type not allowed: ${file.type} for file: ${file.name}`,
      );
      return null;
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
      }
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

    // Handle DOCX files - extract text
    if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      console.log(`[File Processing] Extracting text from DOCX: ${file.name}`);
      const base64Data = await fetchFileAsBase64(file.url);
      const text = await extractTextFromDocx(base64Data);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (.docx) ---\n${text}\n--- End of ${file.name} ---\n\n`,
      };
    }

    // Handle XLSX files - extract text
    if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      console.log(`[File Processing] Extracting text from XLSX: ${file.name}`);
      const base64Data = await fetchFileAsBase64(file.url);
      const text = await extractTextFromXlsx(base64Data);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (.xlsx) ---\n${text}\n--- End of ${file.name} ---\n\n`,
      };
    }

    // Handle other text-based files
    if (shouldConvertToText(file.type)) {
      console.log(
        `[File Processing] Converting ${file.type} to text: ${file.name}`,
      );
      const textContent = await fetchFileAsText(file.url);
      return {
        type: 'text',
        text: `\n\n--- File: ${file.name} (${file.type}) ---\n${textContent}\n--- End of ${file.name} ---\n\n`,
      };
    }

    // Unsupported file type - skip silently
    console.warn(
      `[File Processing] Unsupported file type: ${file.type} for file: ${file.name}`,
    );
    return null;
  } catch (error) {
    console.error('[File Processing] Error processing file:', file.name, error);
    // Return null to skip file on error - don't block the entire request
    return null;
  }
}

/**
 * Process multiple files in parallel
 */
export async function processFiles(
  files: FileMetadata[],
): Promise<MessagePart[]> {
  const fileProcessingPromises = files.map((file) =>
    processFile(file).catch((err) => {
      console.error('[File Processing] File processing error:', file.name, err);
      return null;
    }),
  );

  const convertedParts = (await Promise.all(fileProcessingPromises)).filter(
    (part): part is MessagePart => part !== null,
  );

  console.log(
    `[File Processing] Processed ${convertedParts.length} files successfully`,
  );

  return convertedParts;
}
