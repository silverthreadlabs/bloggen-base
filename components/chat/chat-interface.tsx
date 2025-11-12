'use client';

import { useChat } from '@ai-sdk/react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';
import type { ChatWithMessages } from '@/lib/hooks/chat';
import { useChats, useUpdateChatTitleInCache } from '@/lib/hooks/chat';
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
  const [context, setContext] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);

  const [modifiers, setModifiers] = useMessageModifiers();

  const modifiersRef = useRef(modifiers);
  modifiersRef.current = modifiers;

  const isFirstMessageRef = useRef(!initialChat?.messages?.length);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  const { data: allChats } = useChats();
  
  // Fetch current chat data to get updated title
  const { data: currentChat } = useChatQuery(chatId);

  const chatOps = useChatOperations(chatId);
  const messageOps = useMessageOperations(chatId);
  const togglePin = useToggleChatPin();
  const pinned = useChatPinStatus(chatId);
  const updateChatTitleInCache = useUpdateChatTitleInCache();

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
      // Save the assistant message with the correct client-generated ID
      const assistantMessage = result.message;
      
      // Track this save as pending
      pendingSavesRef.current.add(assistantMessage.id);
      
      // Get metadata for title updates
      const metadata = result.message.metadata as {
        chatId?: string;
        chatTitle?: string;
        isNewChat?: boolean;
      } | undefined;

      // Handle URL update for first message
      if (isFirstMessageRef.current) {
        window.history.replaceState({}, '', `/chat/${chatId}`);
        isFirstMessageRef.current = false;

        if (metadata?.chatTitle) {
          // Update cache with new title instantly
          updateChatTitleInCache(chatId, metadata.chatTitle);
        }
      }

      try {
        await messageOps.saveMessage(
          {
            role: 'assistant',
            parts: assistantMessage.parts,
          },
          assistantMessage.id, // Use the client-generated ID
        );
        
        // Invalidate immediately after save to refresh messages from DB
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(chatId),
        });
      } catch (error) {
        // Error saving message
      } finally {
        // Remove from pending saves
        pendingSavesRef.current.delete(assistantMessage.id);
      }
    },
  });

  // Initialize messages from server data on mount (for existing chats)
  if (messages.length === 0 && (initialChat?.messages?.length || currentChat?.messages?.length)) {
    const chatData = currentChat || initialChat;
    if (chatData?.messages) {
      setMessages(chatData.messages);
    }
  }

  const isLoading = status === 'submitted' || status === 'streaming';
  // Buttons are disabled while loading/streaming, and message is saved before streaming ends
  const isProcessing = isLoading;

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isProcessing) return;

      if (message.files?.length) {
        toast.success('Files attached', {
          description: `${message.files.length} file(s) attached`,
        });
      }

      // Combine message and context for sending to AI
      const combinedText = message.context 
        ? `Context: ${message.context}\n\n${message.text}`
        : message.text;

      sendMessage(
        { text: combinedText },
        {
          body: {
            tone: modifiersRef.current.tone,
            length: modifiersRef.current.length,
            context: message.context, // Send context separately to backend
          },
        },
      );
      setText('');
      setContext('');
    },
    [sendMessage, isProcessing],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isProcessing) return;
      sendMessage({ text: suggestion });
    },
    [sendMessage, isProcessing],
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
      const newParts = [{ type: 'text' as const, text: newContent }];
      messageOps.updateMessage(messageId, newParts);

      // Update local messages state with properly typed parts
      const updatedMessages = messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              parts: newParts,
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
      console.log('[handleRegenerate] Called with messageId:', messageId);
      
      // Wait for any pending saves on this message
      if (pendingSavesRef.current.has(messageId)) {
        const startTime = Date.now();
        const maxWait = 5000; // 5 seconds max
        
        while (pendingSavesRef.current.has(messageId)) {
          if (Date.now() - startTime > maxWait) {
            toast.error('Please wait for the message to finish saving');
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      
      if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
        return;
      }

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
      // Find the next chat to navigate to before deleting
      let nextChatId: string | undefined;
      if (allChats && allChats.length > 0) {
        const currentIndex = allChats.findIndex((chat) => chat.id === chatId);
        if (currentIndex !== -1) {
          // Try to find next chat (after current)
          if (currentIndex < allChats.length - 1) {
            nextChatId = allChats[currentIndex + 1].id;
          }
          // Otherwise try previous chat (before current)
          else if (currentIndex > 0) {
            nextChatId = allChats[currentIndex - 1].id;
          }
        }
      }

      await chatOps.deleteChat();

      // Navigate to next available chat, otherwise to /chat
      window.location.href = nextChatId ? `/chat/${nextChatId}` : '/chat';

      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }, [chatOps, allChats, chatId]);

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
      isProcessing={isProcessing}
      text={text}
      setText={setText}
      context={context}
      setContext={setContext}
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
