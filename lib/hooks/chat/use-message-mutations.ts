'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatKeys } from './query-keys';
import { saveMessage, updateMessage, deleteMessage } from './api';
import type { ChatWithMessages, CreateMessagePayload } from './types';

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
      content,
      parts,
    }: {
      chatId: string;
      messageId: string;
      content: string;
      parts: any[];
    }) => updateMessage(chatId, messageId, content, parts),
    onMutate: async ({ chatId, messageId, content, parts }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId)
      );

      // Optimistically update message
      if (previousChat) {
        queryClient.setQueryData<ChatWithMessages>(chatKeys.detail(chatId), {
          ...previousChat,
          messages: previousChat.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content, parts, isEdited: true } : msg
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
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      deleteMessage(chatId, messageId),
    onMutate: async ({ chatId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId)
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
 * Regenerate a message (delete it and all after with optimistic updates)
 * Used in combination with server actions for the actual deletion
 */
export function useRegenerateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      messageId, 
      deleteAction 
    }: { 
      chatId: string; 
      messageId: string;
      deleteAction: () => Promise<any>;
    }) => {
      return await deleteAction();
    },
    onMutate: async ({ chatId, messageId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.detail(chatId) });

      const previousChat = queryClient.getQueryData<ChatWithMessages>(
        chatKeys.detail(chatId)
      );

      // Optimistically remove message and all after it
      if (previousChat) {
        const messageIndex = previousChat.messages.findIndex(m => m.id === messageId);
        
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
    onSettled: (_data, _error, { chatId }) => {
      // Invalidate after regeneration completes
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}
