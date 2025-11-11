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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
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
    refetchOnMount: false, // Don't refetch on mount (data is passed as initialChat)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0, // Always consider data stale, refetch immediately when invalidated
    // Note: Will refetch when explicitly invalidated via invalidateQueries
  });
}
