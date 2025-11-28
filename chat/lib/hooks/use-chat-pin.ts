'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Chat, ChatWithMessages } from '@/lib/types/chat';
import { fetchChat, fetchChats } from './api';
import { chatKeys } from './query-keys';
import { useTogglePinChat } from './use-chat-mutations';

/**
 * Get the pin status of a chat from React Query cache
 * This hook automatically re-renders when the cache updates
 * by subscribing to both the detail and list queries
 */
export function useChatPinStatus(chatId: string | undefined): boolean {
  const queryClient = useQueryClient();

  // Get initial data from cache to avoid unnecessary fetches
  const cachedDetail = chatId
    ? queryClient.getQueryData<ChatWithMessages>(chatKeys.detail(chatId))
    : undefined;
  const cachedChats = queryClient.getQueryData<Chat[]>(chatKeys.list());

  // Subscribe to the detail query to get re-renders when it updates
  // Use initialData to avoid refetching if we already have the data
  const { data: chatDetail } = useQuery<ChatWithMessages>({
    queryKey: chatKeys.detail(chatId!),
    queryFn: () => fetchChat(chatId!),
    enabled: !!chatId,
    initialData: cachedDetail,
    staleTime: 1000 * 60 * 5, // 5 minutes - same as useChats
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to the list query to get re-renders when it updates
  // This ensures we get updates even if the detail query isn't loaded
  const { data: chats } = useQuery<Chat[]>({
    queryKey: chatKeys.list(),
    queryFn: fetchChats,
    enabled: !!chatId,
    initialData: cachedChats,
    staleTime: 1000 * 60 * 5, // 5 minutes - same as useChats
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Get pin status from detail query first, then fallback to list query
  return useMemo(() => {
    if (!chatId) return false;

    if (chatDetail) {
      return chatDetail.pinned ?? false;
    }

    const chatFromList = chats?.find((c) => c.id === chatId);
    return chatFromList?.pinned ?? false;
  }, [chatId, chatDetail, chats]);
}

/**
 * Hook to toggle chat pin status
 * Returns a function that can be called to toggle the pin
 */
export function useToggleChatPin() {
  const mutation = useTogglePinChat();

  return useCallback(
    async (chatId: string, pinned: boolean) => {
      await mutation.mutateAsync({ chatId, pinned });
    },
    [mutation],
  );
}
