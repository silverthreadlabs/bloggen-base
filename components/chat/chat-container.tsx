'use client';

import { ChatInterface } from './chat-interface';
import { useChat } from '@/lib/hooks/chat';

type Props = {
  chatId: string; // Now required - always generated server-side
};

export function ChatContainer({ chatId }: Props) {
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
