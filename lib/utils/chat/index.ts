/**
 * Chat Utilities - Main Export
 * Central export point for all chat utility functions
 */

// File type utilities
export {
  SUPPORTED_AS_FILES,
  CONVERT_TO_TEXT_TYPES,
  isFileTypeAllowed,
  shouldSendAsFilePart,
  shouldConvertToText,
} from './file-types';

// File conversion utilities
export {
  fetchFileAsBase64,
  fetchFileAsText,
  extractTextFromDocx,
  extractTextFromXlsx,
} from './file-conversion';

// File processing utilities
export {
  processFile,
  processFiles,
  type FileMetadata,
  type MessagePart,
} from './file-processing';

// Message processing utilities
export {
  extractFileMetadata,
  collectFilesToProcess,
  mergeMessageParts,
  processMessages,
  addContextToLastMessage,
  cleanMessages,
} from './message-processing';

// Message conversion utilities
export {
  convertDataPart,
  convertMessagesToModelFormat,
} from './message-conversion';
