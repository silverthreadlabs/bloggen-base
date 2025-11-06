'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { ChatView } from './chat-view';
import { useChatOperations } from './hooks/use-chat-operations';
import { useMessageOperations } from './hooks/use-message-operations';
import { useChats, useChat as useChatQuery, useCreateChat } from '@/lib/hooks/chat';
import { useToggleChatPin, useChatPinStatus } from '@/lib/stores/chat-pin-store';
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
  const sendMessageRef = useRef<((message: { text: string }) => void) | null>(null);
  const pendingMessageRef = useRef<{ text: string; chatId: string } | null>(null);

  // React Query hooks for data fetching
  const { data: allChats } = useChats(); // Get all chats for navigation after delete
  const { data: chatData } = useChatQuery(currentChatId); // Prefetch chat data with React Query
  
  // Custom hooks for database operations
  const chatOps = useChatOperations(currentChatId || '');
  const messageOps = useMessageOperations(currentChatId || '');
  const togglePin = useToggleChatPin();
  // Use reactive hook for pin status that subscribes to optimistic updates
  const pinned = useChatPinStatus(currentChatId);
  
  // Chat creation mutation with callback support
  const createChatMutation = useCreateChat();

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
    generateId: generateUUID,
    onFinish: async (result) => {
      // Save assistant message to database after streaming completes
      if (currentChatId && result?.message && result.message.role === 'assistant') {
        try {
          const message = result.message;
          const content = message.parts
            ?.filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('') || '';
          
          if (content.trim()) {
            // Save assistant message with the AI SDK's message ID
            await messageOps.saveMessage({
              role: 'assistant',
              content,
              parts: message.parts || [],
            }, message.id);
          }
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      }

      // Invalidate React Query cache after streaming completes to sync with DB
      if (currentChatId) {
        // Update chat title if it's still "New Chat" and we have messages
        const chatToUse = initialChat || chatData;
        if (
          chatToUse?.title === 'New Chat' &&
          messages.length >= 2 &&
          messages[0]?.role === 'user'
        ) {
          // Extract text content from message parts
          const firstUserMessage = messages[0];
          const textParts = firstUserMessage.parts
            ?.filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('') || '';
          
          if (textParts) {
            // Generate title from first user message (first 50 chars)
            const newTitle = textParts.slice(0, 50).trim();
            if (newTitle && newTitle !== 'New Chat') {
              try {
                await chatOps.updateTitle(newTitle);
              } catch (error) {
                console.error('Error updating chat title:', error);
              }
            }
          }
        }
        
        // Invalidate cache to sync with DB
        messageOps.invalidateChat();
      }
    },
  });

  // Store sendMessage in ref for use in mutation callbacks
  sendMessageRef.current = sendMessage;

  // Sync currentChatId with chatId prop when it changes
  useEffect(() => {
    if (chatId !== currentChatId) {
      setCurrentChatId(chatId);
      hasInitializedMessages.current = false;
      
      // Clear messages when switching to a different chat (not on initial mount)
      if (chatId && currentChatId && chatId !== currentChatId && messages.length > 0) {
        setMessages([]);
      }
    }
  }, [chatId, currentChatId, setMessages, messages.length]);

  // Set initial messages when React Query data is loaded (using TanStack Query data directly)
  useEffect(() => {
    const chatToUse = initialChat || chatData;
    if (
      chatToUse?.messages &&
      chatToUse.messages.length > 0 &&
      currentChatId === chatToUse.id &&
      !hasInitializedMessages.current
    ) {
      console.log('Setting initial messages from DB:', chatToUse.messages.length);
      setMessages(chatToUse.messages);
      hasInitializedMessages.current = true;
    }
    
    // Reset initialization flag when chat changes
    if (currentChatId && currentChatId !== chatToUse?.id) {
      hasInitializedMessages.current = false;
    }
  }, [initialChat, chatData, currentChatId, setMessages]);
  
  const isLoading = status === 'submitted' || status === 'streaming';

  // Send pending message when sendMessage becomes available and status is ready
  // This runs when sendMessage changes (after useChat reinitializes with new chatId)
  const trySendPendingMessage = useCallback(() => {
    if (
      pendingMessageRef.current &&
      currentChatId &&
      currentChatId === pendingMessageRef.current.chatId &&
      sendMessage &&
      !isLoading &&
      status === 'ready'
    ) {
      const message = pendingMessageRef.current;
      console.log('[ChatInterface] Sending pending message with chatId:', message.chatId);
      
      // Clear the pending message immediately
      pendingMessageRef.current = null;
      
      // Send the message
      try {
        sendMessage({ text: message.text });
      } catch (error) {
        console.error('[ChatInterface] Error sending pending message:', error);
        toast.error('Failed to send message');
        // Restore the message if sending failed
        pendingMessageRef.current = message;
      }
    }
  }, [currentChatId, isLoading, status, sendMessage]);

  // This triggers when sendMessage changes (useChat reinitializes with new chatId)
  useEffect(() => {
    trySendPendingMessage();
  }, [sendMessage, status, currentChatId, trySendPendingMessage]);

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

    // Prevent multiple submissions while creating chat or sending message
    if (isLoading || createChatMutation.isPending) {
      return;
    }

    try {
      // Step 1: Create chat if this is the first message
      if (!currentChatId) {
        console.log('[ChatInterface] Creating new chat before sending message:', message.text);
        
        // Store message to send after chat is created
        const messageText = message.text;
        
        // Create chat using TanStack Query mutation with onSuccess callback
        createChatMutation.mutate('New Chat', {
          onSuccess: (newChat) => {
            const newChatId = newChat.id;
            console.log('[ChatInterface] New chat created with ID:', newChatId);
            
            // Update state and URL - chat will display immediately due to optimistic cache
            setCurrentChatId(newChatId);
            router.replace(`/chat/${newChatId}`);
            
            // Store pending message - will be sent once useChat is ready
            // sendMessage will add the user message and start streaming immediately
            pendingMessageRef.current = { text: messageText, chatId: newChatId };
          },
          onError: (error) => {
            console.error('Error creating chat:', error);
            toast.error('Failed to create chat');
          },
        });
        
        setText('');
        return;
      }

      // Step 2: Send to AI for streaming response (chatId is already set)
      // API will handle saving both user and assistant messages
      sendMessage({ text: message.text });
      setText('');
    } catch (error) {
      console.error('Error in message flow:', error);
      toast.error('Failed to send message');
      pendingMessageRef.current = null;
    }
  }, [currentChatId, createChatMutation, router, sendMessage, isLoading, trySendPendingMessage]);

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    // Prevent multiple submissions while creating chat or sending message
    if (isLoading || createChatMutation.isPending) {
      return;
    }

    try {
      // Create chat if no chat exists yet
      if (!currentChatId) {
        console.log('[ChatInterface] Creating new chat before sending suggestion:', suggestion);
        
        // Create chat using TanStack Query mutation with onSuccess callback
        createChatMutation.mutate('New Chat', {
          onSuccess: (newChat) => {
            const newChatId = newChat.id;
            console.log('[ChatInterface] New chat created with ID:', newChatId);
            
            // Update state and URL - chat will display immediately due to optimistic cache
            setCurrentChatId(newChatId);
            router.replace(`/chat/${newChatId}`);
            
            // Store pending message - will be sent once useChat is ready
            // sendMessage will add the user message and start streaming immediately
            pendingMessageRef.current = { text: suggestion, chatId: newChatId };
          },
          onError: (error) => {
            console.error('Error creating chat:', error);
            toast.error('Failed to create chat');
          },
        });
        return;
      }

      // Send to AI - API will handle saving both messages (chatId is already set)
      sendMessage({ text: suggestion });
    } catch (error) {
      console.error('Error in suggestion flow:', error);
      toast.error('Failed to send message');
      pendingMessageRef.current = null;
    }
  }, [currentChatId, createChatMutation, router, sendMessage, isLoading, trySendPendingMessage]);

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

  const handleNewChat = useCallback(() => {
    // Navigate to /chat without creating a chat immediately
    // Chat will be created when first message is sent
    router.push('/chat');
  }, [router]);

  const handleDeleteChat = useCallback(async () => {
    if (!currentChatId) return;
    
    try {
      // Find the next chat to navigate to
      let nextChatId: string | undefined;
      if (allChats && allChats.length > 0) {
        const currentIndex = allChats.findIndex(chat => chat.id === currentChatId);
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
      
      // Navigate to next chat if available, otherwise to /chat
      if (nextChatId) {
        router.push(`/chat/${nextChatId}`);
      } else {
        router.push('/chat');
      }
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }, [currentChatId, chatOps, router, allChats]);

  const handleUpdateTitle = useCallback(async (newTitle: string) => {
    if (!currentChatId) return;
    
    try {
      await chatOps.updateTitle(newTitle);
      toast.success('Title updated');
    } catch (error) {
      toast.error('Failed to update title');
    }
  }, [currentChatId, chatOps]);

  const handlePinChat = useCallback(async (pinned: boolean) => {
    if (!currentChatId) return;
    await togglePin(currentChatId, pinned);
  }, [currentChatId, togglePin]);

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
      chatId={currentChatId}
      pinned={pinned}
      onSubmit={handleSubmit}
      onSuggestionClick={handleSuggestionClick}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onRegenerate={handleRegenerate}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      onUpdateTitle={handleUpdateTitle}
      onPinChat={handlePinChat}
      onStop={handleStop}
    />
  );
}
