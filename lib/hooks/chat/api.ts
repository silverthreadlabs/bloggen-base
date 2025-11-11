import type { UIMessage } from '@ai-sdk/react';
import type { Chat, ChatWithMessages, CreateMessagePayload } from './types';

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

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete chat');
  }
}

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

export async function updateMessage(
  chatId: string,
  messageId: string,
  content: string,
  parts: any[],
): Promise<UIMessage> {
  const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parts }),
  });
  if (!response.ok) {
    throw new Error('Failed to update message');
  }
  const data = await response.json();
  return data.message;
}

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
