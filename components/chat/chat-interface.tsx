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
import { useMessageModifiers } from '@/lib/hooks/use-url-state';
import {
  useChatPinStatus,
  useToggleChatPin,
} from '@/lib/stores/chat-pin-store';
import { generateUUID } from '@/lib/utils';
import { ChatView } from './ui/chat-view';
import { useChatOperations, useMessageOperations, useChat as useChatQuery } from '@/lib/hooks/chat';

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

  const [modifiers, setModifiers] = useMessageModifiers();

  const modifiersRef = useRef(modifiers);
  modifiersRef.current = modifiers;

  const isFirstMessageRef = useRef(!initialChat?.messages?.length);

  const { data: allChats } = useChats();
  
  // Fetch current chat data to get updated title
  const { data: currentChat } = useChatQuery(chatId);

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

        // Invalidate and refetch sidebar to show new chat with AI-generated title
        await queryClient.invalidateQueries({
          queryKey: chatKeys.list(),
          refetchType: 'all',
        });
      }

      // Assistant message is already saved on the server side in onFinish
      // Just invalidate the cache to refetch with the saved message
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

      sendMessage(
        { text: message.text },
        {
          body: {
            tone: modifiersRef.current.tone,
            length: modifiersRef.current.length,
          },
        },
      );
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

          // Regenerate using the edited user message ID
          aiRegenerate({
            messageId: messageId, // This is already the user message ID
            body: {
              tone: modifiersRef.current.tone,
              length: modifiersRef.current.length,
            },
          });

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
    [messageOps, messages, setMessages, sendMessage],
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

        // Find the last user message before this assistant message
        const userMessage = messages
          .slice(0, messageIndex)
          .reverse()
          .find((m) => m.role === 'user');

        if (!userMessage) {
          toast.error('No user message found to regenerate from');
          return;
        }

        // Remove the assistant message and all messages after it
        setMessages(messages.slice(0, messageIndex));

        // Regenerate using the user message ID (the message before the assistant message)
        aiRegenerate({
          messageId: userMessage.id,
          body: {
            tone: modifiersRef.current.tone,
            length: modifiersRef.current.length,
          },
        });

        toast.success('Regenerating response...');
      } catch (error) {
        console.error('Error regenerating:', error);
        toast.error('Failed to regenerate');
      }
    },
    [messages, setMessages, sendMessage, messageOps],
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
      tone={modifiers.tone}
      setTone={(tone) => setModifiers({ tone, length: modifiers.length })}
      length={modifiers.length}
      setLength={(length) => setModifiers({ tone: modifiers.tone, length })}
      pinned={pinned}
      chatTitle={currentChat?.title || initialChat?.title}
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
