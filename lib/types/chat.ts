import type { UIMessage } from '@ai-sdk/react';

// ============================================================================
// CHAT TYPES
// ============================================================================

export type Chat = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
};

export type ChatWithMessages = Chat & {
  messages: UIMessage[];
  visibility?: 'public' | 'private';
};

export type CreateMessagePayload = {
  role: 'user' | 'assistant' | 'system';
  parts: any[];
  attachments?: any[];
  context?: string;
};

// ============================================================================
// CHAT STATUS
// ============================================================================

export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

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
// RE-EXPORTS FROM AI SDK
// ============================================================================

export type { UIMessage };