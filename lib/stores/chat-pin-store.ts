'use client';

import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { create } from 'zustand';
import { togglePinChat } from '@/lib/actions/chat-actions';
import { chatKeys } from '@/lib/hooks/chat/query-keys';
import type { Chat, ChatWithMessages } from '@/lib/hooks/chat/types';

interface PinState {
  // Optimistic pin states: chatId -> pinned status (using Record for reactivity)
  optimisticPins: Record<string, boolean>;
  // Track pending operations to prevent duplicates (using Record for reactivity)
  pendingOperations: Record<string, boolean>;
}

interface PinActions {
  // Toggle pin status with optimistic update
  togglePin: (
    chatId: string,
    pinned: boolean,
    queryClient: QueryClient,
  ) => Promise<void>;
  // Get current pin status (optimistic or from cache)
  getPinStatus: (chatId: string, queryClient: QueryClient) => boolean;
  // Clear optimistic state
  clearOptimistic: (chatId: string) => void;
}

type ChatPinStore = PinState & PinActions;

export const useChatPinStore = create<ChatPinStore>((set, get) => ({
  optimisticPins: {},
  pendingOperations: {},

  togglePin: async (
    chatId: string,
    pinned: boolean,
    queryClient: QueryClient,
  ) => {
    const state = get();

    // Prevent duplicate operations
    if (state.pendingOperations[chatId]) {
      return;
    }

    // Mark as pending
    set({
      pendingOperations: { ...state.pendingOperations, [chatId]: true },
    });

    // Optimistically update immediately
    set({
      optimisticPins: { ...state.optimisticPins, [chatId]: pinned },
    });

    // Update React Query cache optimistically
    // Update chat list
    queryClient.setQueryData<Chat[]>(chatKeys.list(), (old) => {
      if (!old) return old;
      return old.map((chat) =>
        chat.id === chatId ? { ...chat, pinned } : chat,
      );
    });

    // Update chat detail
    queryClient.setQueryData<ChatWithMessages>(
      chatKeys.detail(chatId),
      (old) => {
        if (!old) return old;
        return { ...old, pinned };
      },
    );

    try {
      // Call server action directly (no API round trip - faster!)
      await togglePinChat(chatId, pinned);

      // Remove from optimistic state after success
      const currentState = get();
      const { [chatId]: _, ...newOptimisticPins } = currentState.optimisticPins;
      const { [chatId]: __, ...newPendingOperations } =
        currentState.pendingOperations;

      set({
        optimisticPins: newOptimisticPins,
        pendingOperations: newPendingOperations,
      });

      // Invalidate to ensure consistency (but don't wait for it)
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    } catch (error) {
      // Rollback on error
      const currentState = get();
      const { [chatId]: _, ...newOptimisticPins } = currentState.optimisticPins;
      const { [chatId]: __, ...newPendingOperations } =
        currentState.pendingOperations;

      set({
        optimisticPins: newOptimisticPins,
        pendingOperations: newPendingOperations,
      });

      // Rollback React Query cache
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });

      toast.error('Failed to toggle pin');
      throw error;
    }
  },

  getPinStatus: (chatId: string, queryClient: QueryClient) => {
    const state = get();

    // First check optimistic state
    if (chatId in state.optimisticPins) {
      return state.optimisticPins[chatId];
    }

    // Fallback to React Query cache
    const chat =
      queryClient.getQueryData<ChatWithMessages>(chatKeys.detail(chatId)) ||
      queryClient
        .getQueryData<Chat[]>(chatKeys.list())
        ?.find((c) => c.id === chatId);

    return chat?.pinned ?? false;
  },

  clearOptimistic: (chatId: string) => {
    const state = get();
    const { [chatId]: _, ...newOptimisticPins } = state.optimisticPins;
    set({ optimisticPins: newOptimisticPins });
  },
}));

// Helper hook to get pin status with automatic query client
export function useChatPinStatus(chatId: string | undefined): boolean {
  const queryClient = useQueryClient();
  const getPinStatus = useChatPinStore((state) => state.getPinStatus);

  // Subscribe to optimistic pins changes for reactivity
  useChatPinStore((state) => state.optimisticPins);

  if (!chatId) return false;

  // Get current status
  return getPinStatus(chatId, queryClient);
}

// Helper hook to toggle pin
export function useToggleChatPin() {
  const queryClient = useQueryClient();
  const togglePin = useChatPinStore((state) => state.togglePin);

  return async (chatId: string, pinned: boolean) => {
    await togglePin(chatId, pinned, queryClient);
  };
}
