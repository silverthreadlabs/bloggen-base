// Chat API
export async function fetchChats(): Promise<Chat[]> {
  const response = await fetch('/api/chats');
  if (!response.ok) {
    throw new Error('Failed to fetch chats');
  }
  const data = await response.json();
  return data.chats.map((chat: any) => ({
    ...chat,
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
  }));
}
