import type { UIMessage } from '@ai-sdk/react';

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
