// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { ChatContainer } from './chat-container';
export { ChatInterface } from './chat-interface';
export {
  ChatHeader,
  ChatInput,
  ChatSidebar,
  ChatView,
  EmptyState,
  MessageAvatar,
  MessageList,
} from './ui';

export { LengthSelector, ToneSelector } from './selectors';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ChatStatus, HardcodedMessageType, UIMessage } from '@/lib/types/chat';

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
} from '../utils/message-utils';
