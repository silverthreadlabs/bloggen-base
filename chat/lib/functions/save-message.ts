// Message API
export async function saveMessage(
  chatId: string,
  message: CreateMessagePayload,
  customId?: string,
): Promise<UIMessage> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...message,
      id: customId, // Include custom ID if provided
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save message');
  }
  const data = await response.json();
  return data.message;
}
