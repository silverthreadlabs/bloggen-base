export async function deleteMessage(
  chatId: string,
  messageId: string,
): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete message');
  }
}
