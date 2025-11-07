import { ChatContainer } from '@/components/chat/chat-container';
import { generateUUID } from '@/lib/utils';

export default async function ChatPage() {
  // Generate chatId on server - Vercel pattern for seamless new chat
  const chatId = generateUUID();

  return <ChatContainer chatId={chatId} key={chatId} isNewChat />;
}
