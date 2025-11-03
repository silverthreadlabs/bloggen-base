'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { ChatView } from './chat-view';
import { useChatOperations } from './hooks/use-chat-operations';
import { useMessageOperations } from './hooks/use-message-operations';
import type { ChatWithMessages } from '@/lib/hooks/chat';
import { generateUUID } from '@/lib/utils';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';

type Props = {
  chatId?: string;
  initialChat?: ChatWithMessages;
};

export function ChatInterface({ chatId, initialChat }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const hasInitializedMessages = useRef(false);

  // Custom hooks for database operations (use currentChatId which may be undefined initially)
  const chatOps = useChatOperations(currentChatId || '');
  const messageOps = useMessageOperations(currentChatId || '');

  // AI SDK Chat Hook - uses id to construct API URL with chatId
  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate: aiRegenerate,
    setMessages,
  } = useChat({
    id: currentChatId,
    generateId: generateUUID, // Use consistent UUID generation
    onFinish: () => {
      // Invalidate React Query cache after streaming completes to sync with DB
      if (currentChatId) {
        console.log('Streaming complete, invalidating cache to sync with DB');
        setTimeout(() => {
          messageOps.invalidateChat();
        }, 500);
      }
    },
  });

  // Set initial messages when initialChat is loaded (only once per chat)
  if (
    initialChat?.messages &&
    initialChat.messages.length > 0 &&
    currentChatId === initialChat.id &&
    messages.length === 0 &&
    !hasInitializedMessages.current
  ) {
    console.log('Setting initial messages from DB:', initialChat.messages.length);
    setMessages(initialChat.messages);
    hasInitializedMessages.current = true;
  }

  // Reset initialization flag when chat changes
  if (currentChatId !== initialChat?.id) {
    hasInitializedMessages.current = false;
  }
  
  // useChatSync removed - API now handles all message saving
  
  const isLoading = status === 'submitted' || status === 'streaming';

  // ============================================================================
  // Message Handlers
  // ============================================================================
  
  const handleSubmit = useCallback(async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (message.files?.length) {
      toast.success('Files attached', {
        description: `${message.files.length} file(s) attached to message`,
      });
    }

    if (!message.text?.trim()) {
      return;
    }

    try {
      let activeChatId = currentChatId;

      // Step 1: Create chat if this is the first message
      if (!activeChatId) {
        const newChat = await chatOps.createNewChat();
        activeChatId = newChat.id;
        setCurrentChatId(activeChatId);
        // Update URL without page refresh
        router.replace(`/chat/${activeChatId}`);
      }

      // Step 2: Send to AI for streaming response
      // API will handle saving both user and assistant messages
      sendMessage({ text: message.text });

      setText('');
    } catch (error) {
      console.error('Error in message flow:', error);
      toast.error('Failed to send message');
    }
  }, [currentChatId, chatOps, router, sendMessage]);

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    try {
      let activeChatId = currentChatId;

      // Create chat if no chat exists yet
      if (!activeChatId) {
        const newChat = await chatOps.createNewChat();
        activeChatId = newChat.id;
        setCurrentChatId(activeChatId);
        // Update URL without page refresh
        router.replace(`/chat/${activeChatId}`);
      }

      // Send to AI - API will handle saving both messages
      sendMessage({ text: suggestion });
    } catch (error) {
      console.error('Error in suggestion flow:', error);
      toast.error('Failed to send message');
    }
  }, [currentChatId, chatOps, router, sendMessage]);

  const handleDelete = useCallback((messageId: string) => {
    if (!currentChatId) return;
    
    // Use optimistic update - mutation handles the state update
    messageOps.deleteMessage(messageId);
    
    // Update local AI SDK state
    setMessages(messages.filter((m) => m.id !== messageId));
  }, [currentChatId, messageOps, messages, setMessages]);

  const handleEdit = useCallback((messageId: string, newContent: string) => {
    if (!currentChatId) return;
    
    // Use optimistic update - mutation handles the state update
    messageOps.updateMessage(messageId, newContent);
    
    // Update local AI SDK state
    setMessages(messages.map((m) => 
      m.id === messageId 
        ? { ...m, content: newContent, parts: [{ type: 'text', text: newContent }] } 
        : m
    ));
  }, [currentChatId, messageOps, messages, setMessages]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (!currentChatId) return;
    
    // Find the message to regenerate
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
      return;
    }

    // Find the user message before this assistant message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') {
      toast.error('Cannot regenerate without a user message');
      return;
    }

    try {
      // Use optimistic update mutation with server action
      messageOps.regenerateMessage(messageId, () => 
        deleteTrailingMessages({ id: messageId })
      );

      // Update local state: keep messages up to and including the user message
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);
      
      // Use AI SDK's built-in regenerate - this reuses the existing message IDs
      // instead of creating new ones like sendMessage() does
      aiRegenerate();
      
      toast.success('Regenerating response...');
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.error('Failed to regenerate response');
    }
  }, [currentChatId, messages, setMessages, aiRegenerate, messageOps]);

  // ============================================================================
  // Chat Handlers
  // ============================================================================

  const handleNewChat = useCallback(async () => {
    try {
      const newChat = await chatOps.createNewChat();
      router.push(`/chat/${newChat.id}`);
      toast.success('New chat created');
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  }, [chatOps, router]);

  const handleDeleteChat = useCallback(async () => {
    if (!currentChatId) return;
    
    try {
      await chatOps.deleteChat();
      router.push('/chat');
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }, [currentChatId, chatOps, router]);

  const handleUpdateTitle = useCallback(async (newTitle: string) => {
    if (!currentChatId) return;
    
    try {
      await chatOps.updateTitle(newTitle);
      toast.success('Title updated');
    } catch (error) {
      toast.error('Failed to update title');
    }
  }, [currentChatId, chatOps]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <ChatView
      messages={messages}
      status={status}
      isLoading={isLoading}
      text={text}
      setText={setText}
      useWebSearch={useWebSearch}
      setUseWebSearch={setUseWebSearch}
      useMicrophone={useMicrophone}
      setUseMicrophone={setUseMicrophone}
      chatTitle={initialChat?.title || (currentChatId ? undefined : 'New Chat')}
      onSubmit={handleSubmit}
      onSuggestionClick={handleSuggestionClick}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onRegenerate={handleRegenerate}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      onUpdateTitle={handleUpdateTitle}
      onStop={handleStop}
    />
  );
}
