/**
 * File Type Configuration for Chat
 * This module re-exports file type utilities for backward compatibility
 * All file type utilities are now in @/lib/utils/file-types
 */

import {
  isMimeTypeAllowed,
  shouldSendAsFilePart as shouldSendAsFilePartBase,
  getFilePartMimeTypes,
  getTextConversionMimeTypes,
} from '../file-types';

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
 * Check if file should be sent as a file part (PDF or image)
 */
export function shouldSendAsFilePart(mediaType: string): boolean {
  return shouldSendAsFilePartBase(mediaType);
}

/**
 * Check if file should be converted to text
 */
export function shouldConvertToText(mediaType: string): boolean {
  return CONVERT_TO_TEXT_TYPES.includes(mediaType);
}
