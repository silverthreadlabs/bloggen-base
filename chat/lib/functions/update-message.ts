export async function updateMessage(
  chatId: string,
  messageId: string,
  parts: any[],
): Promise<UIMessage> {
  const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts }),
  });
  if (!response.ok) {
    throw new Error('Failed to update message');
  }
  const data = await response.json();
  return data.message;
}
