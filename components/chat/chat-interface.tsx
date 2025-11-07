'use client';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';
import type { ChatWithMessages } from '@/lib/hooks/chat';
import { useChats } from '@/lib/hooks/chat';
import { chatKeys } from '@/lib/hooks/chat/query-keys';
import {
  useChatPinStatus,
  useToggleChatPin,
} from '@/lib/stores/chat-pin-store';
import { generateUUID } from '@/lib/utils';
import { ChatView } from './chat-view';
import { useChatOperations } from './hooks/use-chat-operations';
import { useMessageOperations } from './hooks/use-message-operations';

type Props = {
  chatId: string;
  initialChat?: ChatWithMessages;
  isLoadingChat?: boolean;
};

export function ChatInterface({
  chatId,
  initialChat,
  isLoadingChat = false,
}: Props) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const isFirstMessageRef = useRef(
    initialChat?.messages?.length ? false : true,
  );

  const { data: allChats } = useChats();

  const chatOps = useChatOperations(chatId);
  const messageOps = useMessageOperations(chatId);
  const togglePin = useToggleChatPin();
  const pinned = useChatPinStatus(chatId);

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate: aiRegenerate,
    setMessages,
  } = useChat({
    id: chatId,
    generateId: generateUUID,
    onFinish: async (result) => {
      if (isFirstMessageRef.current) {
        window.history.replaceState({}, '', `/chat/${chatId}`);
        isFirstMessageRef.current = false;

        // Invalidate and refetch sidebar to show new chat
        await queryClient.invalidateQueries({
          queryKey: chatKeys.list(),
          refetchType: 'all',
        });
      }

      if (result?.message?.role === 'assistant') {
        const content =
          result.message.parts
            ?.filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('') || '';

        if (content.trim()) {
          await messageOps.saveMessage(
            {
              role: 'assistant',
              content,
              parts: result.message.parts || [],
            },
            result.message.id,
          );
        }
      }

      messageOps.invalidateChat();
    },
  });

  // Initialize messages from initialChat on mount
  if (initialChat?.messages?.length && messages.length === 0) {
    setMessages(initialChat.messages);
  }

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isLoading) return;

      if (message.files?.length) {
        toast.success('Files attached', {
          description: `${message.files.length} file(s) attached`,
        });
      }

      sendMessage({ text: message.text });
      setText('');
    },
    [sendMessage, isLoading],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isLoading) return;
      sendMessage({ text: suggestion });
    },
    [sendMessage, isLoading],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      messageOps.deleteMessage(messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    },
    [messageOps, messages, setMessages],
  );

  const handleEdit = useCallback(
    async (messageId: string, newContent: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const editedMessage = messages[messageIndex];
      if (editedMessage.role !== 'user') return;

      // Update the message in the database
      messageOps.updateMessage(messageId, newContent);

      // Update local messages state with properly typed parts
      const updatedMessages = messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: newContent,
              parts: [{ type: 'text' as const, text: newContent }],
            }
          : m,
      );

      // Find the next assistant message after the edited user message
      const nextAssistantIndex = updatedMessages.findIndex(
        (m, idx) => idx > messageIndex && m.role === 'assistant',
      );

      // If there's an assistant message after the edited user message, regenerate it
      if (nextAssistantIndex !== -1) {
        const assistantMessageId = updatedMessages[nextAssistantIndex].id;

        try {
          // Delete trailing messages (the assistant message and any after it)
          messageOps.regenerateMessage(assistantMessageId, () =>
            deleteTrailingMessages({ id: assistantMessageId }),
          );

          // Create the messages array up to and including the edited message
          const messagesUpToEdit = [
            ...messages.slice(0, messageIndex),
            {
              ...messages[messageIndex],
              content: newContent,
              parts: [{ type: 'text' as const, text: newContent }],
            },
          ];

          // Remove the assistant message and all messages after it from local state
          setMessages(messagesUpToEdit);

          // Regenerate the response with the updated user message
          aiRegenerate();
          toast.success('Regenerating response with edited message...');
        } catch (error) {
          console.error('Error regenerating after edit:', error);
          toast.error('Failed to regenerate response');
          // Still update the messages even if regeneration fails
          setMessages(updatedMessages);
        }
      } else {
        // No assistant message to regenerate, just update the message
        setMessages(updatedMessages);
      }
    },
    [messageOps, messages, setMessages, aiRegenerate],
  );

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1 || messages[messageIndex].role !== 'assistant')
        return;

      try {
        messageOps.regenerateMessage(messageId, () =>
          deleteTrailingMessages({ id: messageId }),
        );

        setMessages(messages.slice(0, messageIndex));
        aiRegenerate();
        toast.success('Regenerating response...');
      } catch (error) {
        console.error('Error regenerating:', error);
        toast.error('Failed to regenerate');
      }
    },
    [messages, setMessages, aiRegenerate, messageOps],
  );

  const handleDeleteChat = useCallback(async () => {
    try {
      await chatOps.deleteChat();

      const firstChat = allChats?.[0];
      window.location.href = firstChat ? `/chat/${firstChat.id}` : '/chat';

      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }, [chatOps, allChats]);

  const handleTogglePin = useCallback(() => {
    togglePin(chatId, !pinned);
    toast.success(pinned ? 'Chat unpinned' : 'Chat pinned');
  }, [chatId, pinned, togglePin]);

  const handleUpdateTitle = useCallback(
    async (newTitle: string) => {
      try {
        await chatOps.updateTitle(newTitle);
        toast.success('Title updated');
      } catch (error) {
        toast.error('Failed to update title');
      }
    },
    [chatOps],
  );

  const handleNewChat = useCallback(() => {
    window.location.href = '/chat';
  }, []);

  return (
    <ChatView
      chatId={chatId}
      messages={messages}
      status={status}
      isLoading={isLoading}
      isLoadingChat={isLoadingChat}
      text={text}
      setText={setText}
      useWebSearch={useWebSearch}
      setUseWebSearch={setUseWebSearch}
      useMicrophone={useMicrophone}
      setUseMicrophone={setUseMicrophone}
      pinned={pinned}
      chatTitle={initialChat?.title}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onRegenerate={handleRegenerate}
      onDeleteChat={handleDeleteChat}
      onPinChat={handleTogglePin}
      onSuggestionClick={handleSuggestionClick}
      onNewChat={handleNewChat}
      onUpdateTitle={handleUpdateTitle}
      onStop={stop}
    />
  );
}
