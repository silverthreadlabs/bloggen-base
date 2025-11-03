'use client';

import { useCallback } from 'react';
import { useCreateChat, useUpdateChatTitle, useDeleteChat } from '@/lib/hooks/chat';

export function useChatOperations(chatId: string) {
  const createChatMutation = useCreateChat();
  const updateTitleMutation = useUpdateChatTitle();
  const deleteChatMutation = useDeleteChat();

  // Keep createNewChat as async since we need the result
  const createNewChat = useCallback(async () => {
    return await createChatMutation.mutateAsync('New Chat');
  }, [createChatMutation]);

  // Use mutate for update - fire and forget with optimistic updates
  const updateTitle = useCallback((title: string) => {
    updateTitleMutation.mutate({ chatId, title });
  }, [chatId, updateTitleMutation]);

  // Use mutate for delete - fire and forget with optimistic updates
  const deleteChat = useCallback(() => {
    deleteChatMutation.mutate(chatId);
  }, [chatId, deleteChatMutation]);

  return {
    createNewChat,
    updateTitle,
    deleteChat,
    isCreating: createChatMutation.isPending,
    isUpdating: updateTitleMutation.isPending,
    isDeleting: deleteChatMutation.isPending,
  };
}
