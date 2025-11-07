'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchChat, fetchChats } from './api';
import { chatKeys } from './query-keys';

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
export function useChat(chatId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(chatId!),
    queryFn: () => fetchChat(chatId!),
    enabled: !!chatId,
    retry: 0,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
