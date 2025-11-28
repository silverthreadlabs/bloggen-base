export async function updateChatTitle(
  chatId: string,
  title: string,
): Promise<Chat> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('Failed to update chat');
  }
  const data = await response.json();
  return {
    ...data.chat,
    createdAt: new Date(data.chat.createdAt),
    updatedAt: new Date(data.chat.updatedAt),
  };
}
