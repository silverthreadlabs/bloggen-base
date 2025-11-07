'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { chatKeys } from './query-keys';
import { fetchChats, fetchChat } from './api';
import type { ChatWithMessages } from './types';

/**
 * Fetch all chats for the current user
 */
export function useChats() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: fetchChats,
  });
}

/**
 * Fetch a single chat with all its messages
 */
type UseChatOptions = Omit<
  UseQueryOptions<ChatWithMessages>,
  'queryKey' | 'queryFn'
>;

export function useChat(chatId: string, options?: UseChatOptions) {
  return useQuery<ChatWithMessages>({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => fetchChat(chatId),
    ...options,
  });
}
