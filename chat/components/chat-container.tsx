'use client';

import { useChat } from '@/lib/hooks/chat';
import { ChatInterface } from './chat-interface';

type Props = {
  chatId: string; // Now required - always generated server-side
  isNewChat?: boolean; // Flag to indicate this is a new chat, don't fetch from DB
};

export function ChatContainer({ chatId, isNewChat = false }: Props) {
  // Skip fetching if this is a new chat - we know it doesn't exist in DB yet
  const {
    data: existingChat,
    isLoading,
    isError,
  } = useChat(isNewChat ? undefined : chatId);

  // For new chats, render immediately without loading state
  if (isNewChat) {
    return (
      <ChatInterface
        key={chatId}
        chatId={chatId}
        initialChat={undefined}
        isLoadingChat={false}
      />
    );
  }

  // For existing chats, wait for data to load
  if (isLoading && !isError) {
    // Return disabled chat interface while loading
    return (
      <ChatInterface
        key={`loading-${chatId}`}
        chatId={chatId}
        initialChat={undefined}
        isLoadingChat={true}
      />
    );
  }

  return (
    <ChatInterface
      key={chatId}
      chatId={chatId}
      initialChat={existingChat}
      isLoadingChat={false}
    />
  );
}
