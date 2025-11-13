import type { FileAttachment } from '@/components/chat/types';

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
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size exceeds 20MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}
