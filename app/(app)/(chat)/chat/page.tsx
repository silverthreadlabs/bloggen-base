import { ChatComponents } from '@/chat';
import { generateUUID } from '@/chat/utils';

export default async function ChatPage() {
    // Generate chatId on server - Vercel pattern for seamless new chat
    const chatId = generateUUID();

    return <ChatComponents.ChatContainer chatId={chatId} key={chatId} isNewChat />;
}
