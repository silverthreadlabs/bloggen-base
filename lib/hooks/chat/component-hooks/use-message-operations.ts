'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  useDeleteMessage,
  useRegenerateMessage,
  useSaveMessage,
  useUpdateMessage,
} from '@/lib/hooks/chat';
import { chatKeys } from '@/lib/hooks/chat/query-keys';

export function useMessageOperations(chatId: string) {
  const queryClient = useQueryClient();
  const saveMessageMutation = useSaveMessage();
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();
  const regenerateMessageMutation = useRegenerateMessage();

  // Use mutateAsync for save since we might need to wait for the result
  const saveMessage = useCallback(
    async (
      message: {
        role: 'user' | 'assistant' | 'system';
        parts: any[];
      },
      customId?: string,
    ) => {
      return await saveMessageMutation.mutateAsync({
        chatId,
        message,
        customId,
      });
    },
    [chatId, saveMessageMutation],
  );

  // Use mutate for update - fire and forget with optimistic updates
  const updateMessage = useCallback(
    (messageId: string, parts: any[]) => {
      updateMessageMutation.mutate({
        chatId,
        messageId,
        parts,
      });
    },
    [chatId, updateMessageMutation],
  );

  // Use mutate for delete - fire and forget with optimistic updates
  const deleteMessage = useCallback(
    (messageId: string) => {
      deleteMessageMutation.mutate({ chatId, messageId });
    },
    [chatId, deleteMessageMutation],
  );

  // Regenerate message: delete from DB then trigger optimistic update
  const regenerateMessage = useCallback(
    async (messageId: string, deleteAction: () => Promise<any>) => {
      try {
        // Delete trailing messages from database
        await deleteAction();
        // Trigger optimistic cache update
        regenerateMessageMutation.mutate({ chatId, messageId });
      } catch (error) {
        console.error('Failed to delete trailing messages:', error);
        throw error;
      }
    },
    [chatId, regenerateMessageMutation],
  );

  // Invalidate cache to sync with DB after API saves messages
  const invalidateChat = useCallback(() => {
    if (chatId) {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      // Don't invalidate list here - it's only needed when creating a new chat
      // which is handled explicitly in chat-interface.tsx
    }
  }, [chatId, queryClient]);

  return {
    saveMessage,
    updateMessage,
    deleteMessage,
    regenerateMessage,
    invalidateChat,
    isSaving: saveMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isRegenerating: regenerateMessageMutation.isPending,
  };
}
