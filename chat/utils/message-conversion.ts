/**
 * Message Conversion Utilities for AI SDK
 * Handles conversion between UI messages and model messages
 */

import { convertToModelMessages } from 'ai';

/**
 * Convert data parts to model-compatible format
 * This callback is used by convertToModelMessages to handle custom data parts
 */
export function convertDataPart(part: any) {
  // Convert data-image to file part
  if (part.type === 'data-image' && part.data?.url) {
    return {
      type: 'file' as const,
      data: part.data.url,
      mediaType: 'image/jpeg' as const,
    };
  }

  // Convert data-file (PDF only) to file part
  if (part.type === 'data-file' && part.data?.base64) {
    return {
      type: 'file' as const,
      data: part.data.base64,
      mediaType: 'application/pdf' as const, // Only PDF is supported as file part
    };
  }

  return undefined;
}

/**
 * Convert UI messages to model messages with custom data part handling
 */
export function convertMessagesToModelFormat(messages: any[]) {
  return convertToModelMessages(messages, {
    convertDataPart,
  });
}
