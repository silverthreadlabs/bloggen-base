export async function createChat(title: string): Promise<Chat> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('Failed to create chat');
  }
  const data = await response.json();
  return {
    ...data.chat,
    createdAt: new Date(data.chat.createdAt),
    updatedAt: new Date(data.chat.updatedAt),
  };
}
