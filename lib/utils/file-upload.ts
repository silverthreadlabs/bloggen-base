import type { FileAttachment } from '@/components/chat/types';
import { isMimeTypeAllowed } from './file-types';

/**
 * Upload a file to the server and get back the file metadata with URL
 */
export async function uploadFile(
  file: File,
  messageId: string,
): Promise<FileAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('messageId', messageId);

  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(
  files: File[],
  messageId: string,
): Promise<FileAttachment[]> {
  const uploadPromises = files.map((file) => uploadFile(file, messageId));
  return Promise.all(uploadPromises);
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Check if a file type is an image
 */
export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('text')) return '📄';
  if (type.includes('json')) return '{ }';
  return '📎';
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxFileSize = 20 * 1024 * 1024; // 20MB
  // const allowedTypes = [
  //   // PDF Documents
  //   'application/pdf',
    
  //   // Microsoft Office Documents
  //   'application/msword', // .doc
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  //   'application/vnd.ms-powerpoint', // .ppt
  //   'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  //   'application/vnd.ms-excel', // .xls
  //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    
  //   // Text Files
  //   'text/plain', // .txt
  //   'application/rtf', // .rtf
  //   'text/markdown', // .md
    
  //   // OpenDocument Files
  //   'application/vnd.oasis.opendocument.text', // .odt
  //   'application/vnd.oasis.opendocument.spreadsheet', // .ods
  //   'application/vnd.oasis.opendocument.presentation', // .odp
    
  //   // Data Files
  //   'text/csv', // .csv
  //   'text/tab-separated-values', // .tsv
  //   'application/json', // .json
  //   'application/x-yaml', // .yaml
  //   'text/yaml', // .yaml, .yml
  //   'application/xml', // .xml
  //   'text/xml', // .xml
  //   'text/html', // .html, .htm
    
  //   // Programming Languages
  //   'text/javascript', // .js
  //   'application/javascript', // .js
  //   'text/typescript', // .ts
  //   'application/typescript', // .ts
  //   'text/jsx', // .jsx
  //   'text/tsx', // .tsx
  //   'text/x-python', // .py
  //   'text/python', // .py
  //   'text/x-java-source', // .java
  //   'text/x-c', // .c
  //   'text/x-c++src', // .cpp
  //   'text/x-chdr', // .h
  //   'text/x-c++hdr', // .hpp
  //   'text/x-csharp', // .cs
  //   'text/x-php', // .php
  //   'application/x-httpd-php', // .php
  //   'text/x-ruby', // .rb
  //   'text/x-go', // .go
  //   'text/x-rustsrc', // .rs
  //   'text/x-swift', // .swift
  //   'text/x-kotlin', // .kt
  //   'text/x-scala', // .scala
  //   'text/x-shellscript', // .sh, .bash
  //   'application/x-sh', // .sh
  //   'application/x-bash', // .bash
    
  //   // Images
  //   'image/jpeg', // .jpg, .jpeg
  //   'image/png', // .png
  //   'image/gif', // .gif
  //   'image/webp', // .webp
  //   'image/svg+xml', // .svg
  //   'image/heic', // .heic
  //   'image/heif', // .heif
  // ];

  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size exceeds 20MB limit' };
  }

  if (!isMimeTypeAllowed(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}
