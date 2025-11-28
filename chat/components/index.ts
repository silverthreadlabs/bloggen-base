// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { ChatContainer } from './chat-container';
export { ChatInterface } from './chat-interface';
export { ChatLayoutClient } from './chat-layout-client';
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

export type { ChatStatus, HardcodedMessageType, UIMessage } from '@/chat/types';

// ============================================================================
// DATA EXPORTS
// ============================================================================

export { hardcodedMessages, mockResponses, suggestions } from '../utils/chat-data';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

export { useChatActions } from '@/chat/hooks';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  extractMessageText,
  isLastAssistantMessage,
} from '../utils/message-utils';
