'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useSaveMessage, 
  useUpdateMessage, 
  useDeleteMessage,
  useRegenerateMessage,
} from '@/lib/hooks/chat';
import { chatKeys } from '@/lib/hooks/chat/query-keys';

export function useMessageOperations(chatId: string) {
  const queryClient = useQueryClient();
  const saveMessageMutation = useSaveMessage();
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();
  const regenerateMessageMutation = useRegenerateMessage();

  // Use mutateAsync for save since we might need to wait for the result
  const saveMessage = useCallback(async (
    message: { role: 'user' | 'assistant' | 'system'; content: string; parts: any[] },
    customId?: string
  ) => {
    return await saveMessageMutation.mutateAsync({
      chatId,
      message,
      customId,
    });
  }, [chatId, saveMessageMutation]);

  // Use mutate for update - fire and forget with optimistic updates
  const updateMessage = useCallback((
    messageId: string,
    content: string
  ) => {
    updateMessageMutation.mutate({
      chatId,
      messageId,
      content,
      parts: [{ type: 'text', text: content }],
    });
  }, [chatId, updateMessageMutation]);

  // Use mutate for delete - fire and forget with optimistic updates
  const deleteMessage = useCallback((messageId: string) => {
    deleteMessageMutation.mutate({ chatId, messageId });
  }, [chatId, deleteMessageMutation]);

  // Use mutate for regenerate with optimistic updates
  const regenerateMessage = useCallback((
    messageId: string,
    deleteAction: () => Promise<any>
  ) => {
    regenerateMessageMutation.mutate({ chatId, messageId, deleteAction });
  }, [chatId, regenerateMessageMutation]);

  // Invalidate cache to sync with DB after API saves messages
  const invalidateChat = useCallback(() => {
    if (chatId) {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
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
