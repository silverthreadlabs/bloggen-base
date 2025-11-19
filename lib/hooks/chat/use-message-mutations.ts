'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteMessage, saveMessage, updateMessage } from './api';
import { chatKeys } from './query-keys';
import type { ChatWithMessages, CreateMessagePayload } from '@/lib/types/chat';

/**
 * Save a new message to a chat
 */
export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      message,
      customId,
    }: {
      chatId: string;
      message: CreateMessagePayload;
      customId?: string;
    }) => saveMessage(chatId, message, customId),
    onSuccess: (_, { chatId }) => {
      // Invalidate both chat detail and list to update message counts and timestamps
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

/**
 * Update an existing message with optimistic updates
 */
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      messageId,
      parts,
    }: {
      chatId: string;
      messageId: string;
      parts: any[];
    }) => updateMessage(chatId, messageId, parts),
    onMutate: async ({ chatId, messageId, parts }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId),
      );

      // Optimistically update message
      if (previousChat) {
        queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
          ...previousChat,
          messages: previousChat.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, parts, isEdited: true }
              : msg,
          ),
        });
      }

      return { previousChat };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), context.previousChat);
      }
      toast.error('Failed to update message');
    },
    onSettled: (_data, _error, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
    },
  });
}

/**
 * Delete a message with optimistic updates
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      messageId,
    }: {
      chatId: string;
      messageId: string;
    }) => deleteMessage(chatId, messageId),
    onMutate: async ({ chatId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId),
      );

      // Optimistically remove message
      if (previousChat) {
        queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
          ...previousChat,
          messages: previousChat.messages.filter((msg) => msg.id !== messageId),
        });
      }

      return { previousChat };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), context.previousChat);
      }
      toast.error('Failed to delete message');
    },
    onSettled: (_data, _error, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

/**
 * Regenerate a message (optimistically remove it and all after)
 * Note: The actual deletion should be called before triggering this mutation
 * Invalidation happens in onFinish after new message is generated
 */
export function useRegenerateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      messageId,
    }: {
      chatId: string;
      messageId: string;
    }) => {
      // Just return success - deletion already happened
      return { success: true };
    },
    onMutate: async ({ chatId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId),
      );

      // Optimistically remove message and all after it from cache
      if (previousChat) {
        const messageIndex = previousChat.messages.findIndex(
          (m) => m.id === messageId,
        );

        if (messageIndex !== -1) {
          queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
            ...previousChat,
            messages: previousChat.messages.slice(0, messageIndex),
          });
        }
      }

      return { previousChat };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(chatKeys.detail(chatId), context.previousChat);
      }
      toast.error('Failed to regenerate message');
    },
    // Don't invalidate here - let onFinish handle it after streaming completes
  });
}
