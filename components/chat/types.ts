import type { UIMessage } from '@ai-sdk/react';

// ============================================================================
// FILE ATTACHMENT TYPE
// ============================================================================

export type FileAttachment = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt?: Date;
};

// ============================================================================
// HARDCODED MESSAGE TYPE
// ============================================================================

export type HardcodedMessageType = {
  key: string;
  from: 'user' | 'assistant';
  content: string;
  avatar: string;
  name: string;
};

// ============================================================================
// CHAT STATUS TYPE
// ============================================================================

export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

// ============================================================================
// RE-EXPORTS FROM AI SDK
// ============================================================================

export type { UIMessage };
