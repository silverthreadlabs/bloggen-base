/**
 * File validation utilities for user file uploads
 */

import {
  isMimeTypeAllowed,
  getAllowedExtensions,
  getFileInputAccept,
} from './file-types';

/**
 * Convert allowed MIME types to HTML accept attribute
 * @example
 * // Returns: ".pdf,.doc,.docx,.png,.jpg"
 * getAcceptAttribute()
 */
export function getAcceptAttribute(): string {
  return getFileInputAccept();
}

/**
 * Check if a file type is allowed
 */
export function isFileTypeAllowed(mimeType: string): boolean {
  return isMimeTypeAllowed(mimeType);
}

/**
 * Validate a file before upload
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!isFileTypeAllowed(file.type)) {
    const allowedExtensions = getAllowedExtensions()
      .map((ext) => `.${ext}`)
      .join(', ');
    return {
      valid: false,
      error: `File type not supported. Allowed: ${allowedExtensions}`,
    };
  }

  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: 20MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: validation.error || 'Invalid file' });
    }
  }

  return { valid, invalid };
}
