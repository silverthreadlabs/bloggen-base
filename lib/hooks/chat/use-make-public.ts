import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeChatPublic } from './api';
import { chatKeys } from './query-keys';
import { toast } from 'sonner';

export function useMakeChatPublic(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => makeChatPublic(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      toast.success('Chat is now public — anyone can view this link');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to share chat');
    },
  });
}