export async function fetchChat(chatId: string): Promise<ChatWithMessages> {
  const response = await fetch(`/api/chats/${chatId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch chat');
  }
  const data = await response.json();
  return {
    ...data.chat,
    createdAt: new Date(data.chat.createdAt),
    updatedAt: new Date(data.chat.updatedAt),
    messages: data.messages || [], // Include messages from API response
  };
}
