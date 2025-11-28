export async function makeChatPublic(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}/share`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to make chat public');
  }
}
