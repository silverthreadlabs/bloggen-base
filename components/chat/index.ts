// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as ChatClient } from './chat-client';
export { ChatHeader } from './chat-header';
export { MessageAvatar } from './message-avatar';
export { EmptyState } from './empty-state';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { HardcodedMessageType, ChatStatus, UIMessage } from './types';

// ============================================================================
// DATA EXPORTS
// ============================================================================

export { hardcodedMessages, suggestions, mockResponses } from './chat-data';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

export { useChatActions } from './hooks/use-chat-actions';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { extractMessageText, isLastAssistantMessage } from './utils/message-utils';
