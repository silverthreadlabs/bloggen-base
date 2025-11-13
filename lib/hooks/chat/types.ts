import type { UIMessage } from '@ai-sdk/react';

export type Chat = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
};

export type ChatWithMessages = Chat & {
  messages: UIMessage[];
};

export type CreateMessagePayload = {
  role: 'user' | 'assistant' | 'system';
  parts: any[];
  attachments?: any[];
  context?: string;
};
