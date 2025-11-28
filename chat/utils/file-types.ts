/**
 * File Type Utilities
 * Helper functions for working with allowed file types
 */

import { ALLOWED_FILE_TYPES } from '@/lib/constants';

/**
 * Get all allowed MIME types
 */
export function getAllowedMimeTypes(): string[] {
  return ALLOWED_FILE_TYPES.map((ft) => ft.mimeType);
}

/**
 * Get all allowed file extensions
 */
export function getAllowedExtensions(): string[] {
  return ALLOWED_FILE_TYPES.flatMap((ft) => ft.extensions);
}

/**
 * Get HTML accept attribute for file inputs
 */
export function getFileInputAccept(): string {
  return getAllowedExtensions()
    .map((ext) => `.${ext}`)
    .join(',');
}

/**
 * Get file extensions for a specific MIME type
 */
export function getExtensionsForMimeType(mimeType: string): string[] {
  const extensions = ALLOWED_FILE_TYPES.find(
    (ft) => ft.mimeType === mimeType,
  )?.extensions;
  return extensions ? [...extensions] : [];
}

/**
 * Check if a MIME type is allowed
 */
export function isMimeTypeAllowed(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.some((ft) => ft.mimeType === mimeType);
}

/**
 * Check if a file should be sent as a file part (not converted to text)
 */
export function shouldSendAsFilePart(mimeType: string): boolean {
  return (
    ALLOWED_FILE_TYPES.find((ft) => ft.mimeType === mimeType)?.sendAsFile ||
    false
  );
}

/**
 * Get MIME types that can be sent as file parts
 */
export function getFilePartMimeTypes(): string[] {
  return ALLOWED_FILE_TYPES.filter((ft) => ft.sendAsFile).map(
    (ft) => ft.mimeType,
  );
}

/**
 * Get MIME types that must be converted to text
 */
export function getTextConversionMimeTypes(): string[] {
  return ALLOWED_FILE_TYPES.filter((ft) => !ft.sendAsFile).map(
    (ft) => ft.mimeType,
  );
}

/**
 * Get file type category
 */
export function getFileTypeCategory(
  mimeType: string,
): 'document' | 'text' | 'image' | undefined {
  return ALLOWED_FILE_TYPES.find((ft) => ft.mimeType === mimeType)?.category;
}

/**
 * Check if a file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return getFileTypeCategory(mimeType) === 'image';
}

/**
 * Check if a file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  return getFileTypeCategory(mimeType) === 'document';
}

/**
 * Check if a file is a text file
 */
export function isTextFile(mimeType: string): boolean {
  return getFileTypeCategory(mimeType) === 'text';
}


/**
 * File types supported by OpenAI Chat Completions API as file parts
 * IMPORTANT: Only PDF and images are supported as file parts
 * DOCX, XLSX, etc. must be converted to text first
 */
export const SUPPORTED_AS_FILES = {
  all: getFilePartMimeTypes(),
} as const;

/**
 * File types that must be converted to text content
 * (Not supported as file parts by OpenAI)
 */
export const CONVERT_TO_TEXT_TYPES = getTextConversionMimeTypes();

/**
 * Check if a file type is allowed based on our restricted list
 */
export function isFileTypeAllowed(mediaType: string): boolean {
  return isMimeTypeAllowed(mediaType);
}

/**
 * Check if file should be converted to text
 */
export function shouldConvertToText(mediaType: string): boolean {
  return CONVERT_TO_TEXT_TYPES.includes(mediaType);
}
