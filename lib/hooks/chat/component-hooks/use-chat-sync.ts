'use client';

import type { UIMessage } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { useSaveMessage } from '@/lib/hooks/chat';

type Props = {
  chatId: string;
  messages: UIMessage[];
  enabled: boolean;
};

/**
 * Syncs only assistant messages with the database after streaming completes
 * User messages are saved immediately before streaming starts
 */
export function useChatSync({ chatId, messages, enabled }: Props) {
  const saveMessageMutation = useSaveMessage();
  const syncedMessageIdsRef = useRef<Set<string>>(new Set());
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (!enabled || !chatId) return;

    const syncAssistantMessages = async () => {
      // Only process if we have new messages
      if (messages.length <= lastMessageCountRef.current) {
        return;
      }

      lastMessageCountRef.current = messages.length;

      // Find unsaved assistant messages
      const unsavedAssistantMessages = messages.filter(
        (msg) =>
          msg.role === 'assistant' && !syncedMessageIdsRef.current.has(msg.id),
      );

      if (unsavedAssistantMessages.length === 0) return;

      // Save each assistant message
      for (const message of unsavedAssistantMessages) {
        try {
          const content = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('');

          // Skip messages with no content
          if (!content.trim()) {
            continue;
          }
         //Revisit code
          await saveMessageMutation.mutateAsync({
            chatId,
            message: {
              role: 'assistant',
              context: content,
              parts: message.parts,
            },
          });

          // Mark this message as synced
          syncedMessageIdsRef.current.add(message.id);
        } catch (error) {
          console.error('Failed to sync assistant message:', message.id);
        }
      }
    };

    syncAssistantMessages();
  }, [chatId, messages, enabled, saveMessageMutation]);
}
