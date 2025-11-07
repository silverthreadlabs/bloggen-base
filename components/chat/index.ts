// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as ChatClient } from './chat-client';
export { ChatHeader } from './chat-header';
export { EmptyState } from './empty-state';
export { MessageAvatar } from './message-avatar';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ChatStatus, HardcodedMessageType, UIMessage } from './types';

// ============================================================================
// DATA EXPORTS
// ============================================================================

export { hardcodedMessages, mockResponses, suggestions } from './chat-data';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

export { useChatActions } from './hooks/use-chat-actions';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  extractMessageText,
  isLastAssistantMessage,
} from './utils/message-utils';
