// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as ChatClient } from './chat-client';
export { LengthSelector, ToneSelector } from './selectors';
export {
  ChatHeader,
  ChatInput,
  ChatSidebar,
  ChatView,
  EmptyState,
  MessageAvatar,
  MessageList,
} from './ui';

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

export { useChatActions } from '@/lib/hooks/chat';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  extractMessageText,
  isLastAssistantMessage,
} from './utils/message-utils';
