'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from './chat-interface';
import { useChat } from '@/lib/hooks/chat';

type Props = {
  chatId: string; // Now required - always generated server-side
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
  // Fetch existing chat if chatId is provided - but don't block on loading
  // This allows new chats with server-generated IDs to render immediately
  const { data: existingChat } = useChat(chatId);

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
