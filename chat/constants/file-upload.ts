export const ALLOWED_FILE_TYPES = [
  // PDF Documents
  {
    mimeType: 'application/pdf',
    extensions: ['pdf'],
    category: 'document',
    sendAsFile: true, // Can be sent directly to OpenAI as file part
  },

  // Microsoft Office Documents (must be converted to text)
  {
    mimeType: 'application/msword',
    extensions: ['doc'],
    category: 'document',
    sendAsFile: false,
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    category: 'document',
    sendAsFile: false,
  },
  {
    mimeType: 'application/vnd.ms-powerpoint',
    extensions: ['ppt'],
    category: 'document',
    sendAsFile: false,
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    category: 'document',
    sendAsFile: false,
  },
  {
    mimeType: 'application/vnd.ms-excel',
    extensions: ['xls'],
    category: 'document',
    sendAsFile: false,
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    category: 'document',
    sendAsFile: false,
  },

  // Text Files (must be converted to text)
  {
    mimeType: 'text/plain',
    extensions: ['txt'],
    category: 'text',
    sendAsFile: false,
  },
  {
    mimeType: 'text/markdown',
    extensions: ['md'],
    category: 'text',
    sendAsFile: false,
  },

  // Images (can be sent directly to OpenAI)
  {
    mimeType: 'image/jpeg',
    extensions: ['jpg', 'jpeg'],
    category: 'image',
    sendAsFile: true,
  },
  {
    mimeType: 'image/png',
    extensions: ['png'],
    category: 'image',
    sendAsFile: true,
  },
  {
    mimeType: 'image/svg+xml',
    extensions: ['svg'],
    category: 'image',
    sendAsFile: true,
  },
] as const;