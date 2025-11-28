import { ChatComponents } from "@/chat";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;

  // Don't fetch session or chat here - let client handle it
  // Layout already verified auth, and React Query will handle data fetching
  return <ChatComponents.ChatContainer chatId={id} />;
}
