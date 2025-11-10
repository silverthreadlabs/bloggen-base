// Types

// API Functions (for advanced use cases)
export {
  createChat,
  deleteChat,
  deleteMessage,
  fetchChat,
  fetchChats,
  saveMessage,
  updateChatTitle,
  updateMessage,
} from './api';
// Query Keys
export { chatKeys } from './query-keys';
export type { Chat, ChatWithMessages, CreateMessagePayload } from './types';
// Chat Mutation Hooks
export {
  useCreateChat,
  useDeleteChat,
  useTogglePinChat,
  useUpdateChatTitle,
} from './use-chat-mutations';
// Query Hooks
export { useChat, useChats } from './use-chat-queries';
// Message Mutation Hooks
export {
  useDeleteMessage,
  useRegenerateMessage,
  useSaveMessage,
  useUpdateMessage,
} from './use-message-mutations';

// Component Hooks (for chat UI components)
export {
  useChatActions,
  useChatOperations,
  useChatSync,
  useMessageOperations,
} from './component-hooks';
