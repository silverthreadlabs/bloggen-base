import type { UIMessage } from '@ai-sdk/react';

export type Chat = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatWithMessages = Chat & {
  messages: UIMessage[];
};

export type CreateMessagePayload = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts: any[];
  attachments?: any[];
};
