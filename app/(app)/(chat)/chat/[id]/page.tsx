import { ChatContainer } from '@/components/chat/chat-container';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;

  // Don't fetch session or chat here - let client handle it
  // Layout already verified auth, and React Query will handle data fetching
  return (
    <ChatContainer 
      chatId={id}
    />
  );
}
