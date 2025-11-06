'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from './chat-interface';
import { useChat } from '@/lib/hooks/chat';

type Props = {
  chatId?: string;
};

// Create a client outside component to avoid recreation on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - increased for better performance
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ChatContainerInner({ chatId }: Props) {
  // Fetch existing chat if chatId is provided
  const { data: existingChat, isLoading: isChatLoading } = useChat(chatId);

  // Only show loading state if we have a chatId, it's loading, AND we don't have cached data
  // This allows newly created chats (with optimistic data) to render immediately
  if (chatId && isChatLoading && !existingChat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <ChatInterface 
      chatId={chatId}
      initialChat={existingChat}
    />
  );
}

export function ChatContainer({ chatId }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatContainerInner chatId={chatId} />
    </QueryClientProvider>
  );
}
