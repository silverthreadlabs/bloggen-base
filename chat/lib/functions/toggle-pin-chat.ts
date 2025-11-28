export async function togglePinChat(
  chatId: string,
  pinned: boolean,
): Promise<Chat> {
  const response = await fetch(`/api/chats/${chatId}/pin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned }),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle pin');
  }
  const data = await response.json();
  return {
    ...data.chat,
    createdAt: new Date(data.chat.createdAt),
    updatedAt: new Date(data.chat.updatedAt),
  };
}
