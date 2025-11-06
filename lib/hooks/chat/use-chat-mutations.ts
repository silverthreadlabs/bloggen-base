'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatKeys } from './query-keys';
import { createChat, updateChatTitle, deleteChat, togglePinChat } from './api';
import type { Chat, ChatWithMessages } from './types';

/**
 * Create a new chat
 */
export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChat,
    onSuccess: (newChat) => {
      // Optimistically update chat list
      queryClient.setQueryData<Chat[]>(chatKeys.list(), (old) => {
        if (!old) return [newChat];
        return [newChat, ...old];
      });
      
      // Optimistically set chat detail query data with empty messages
      // This prevents "Loading chat..." from showing when navigating to the new chat
      queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(newChat.id), {
        ...newChat,
        messages: [],
      });
    },
    onError: () => {
      toast.error('Failed to create chat');
    },
  });
}

/**
 * Update chat title with optimistic updates
 */
export function useUpdateChatTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      updateChatTitle(chatId, title),
    onMutate: async ({ chatId, title }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });
      await queryClient.cancelQueries({ queryKey: chatKeys.list() });

      // Snapshot the previous values
      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId)
      );
      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.list());

      // Optimistically update chat detail
      if (previousChat) {
        queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
          ...previousChat,
          title,
        });
      }

      // Optimistically update chat list
      if (previousChats) {
        queryClient.setQueryData<Chat[]>(
          chatKeys.list(),
          previousChats.map((chat) =>
            chat.id === chatId ? { ...chat, title } : chat
          )
        );
      }

      return { previousChat, previousChats };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), context.previousChat);
      }
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.list(), context.previousChats);
      }
      toast.error('Failed to update title');
    },
    onSettled: (_data, _error, { chatId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

/**
 * Delete a chat with optimistic updates
 */
export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChat,
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.list() });

      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.list());

      // Optimistically remove chat from list
      if (previousChats) {
        queryClient.setQueryData<Chat[]>(
          chatKeys.list(),
          previousChats.filter((chat) => chat.id !== chatId)
        );
      }

      return { previousChats };
    },
    onError: (_err, _chatId, context) => {
      // Rollback on error
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.list(), context.previousChats);
      }
      toast.error('Failed to delete chat');
    },
    onSuccess: (_, chatId) => {
      // Remove the chat detail from cache
      queryClient.removeQueries({ queryKey: chatKeys.detail(chatId) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

/**
 * Toggle pin status of a chat with optimistic updates
 */
export function useTogglePinChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, pinned }: { chatId: string; pinned: boolean }) =>
      togglePinChat(chatId, pinned),
    onMutate: async ({ chatId, pinned }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.list() });
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.list());
      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId)
      );

      // Optimistically update chat list
      if (previousChats) {
        queryClient.setQueryData<Chat[]>(
          chatKeys.list(),
          previousChats.map((chat) =>
            chat.id === chatId ? { ...chat, pinned } : chat
          )
        );
      }

      // Optimistically update chat detail
      if (previousChat) {
        queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
          ...previousChat,
          pinned,
        });
      }

      return { previousChats, previousChat };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.list(), context.previousChats);
      }
      if (context?.previousChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), context.previousChat);
      }
      toast.error('Failed to toggle pin');
    },
    onSettled: (_data, _error, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}
