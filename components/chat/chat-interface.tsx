'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { ChatView } from './chat-view';
import { useChatOperations } from './hooks/use-chat-operations';
import { useMessageOperations } from './hooks/use-message-operations';
import { useChats, useChat as useChatQuery } from '@/lib/hooks/chat';
import { useToggleChatPin, useChatPinStatus } from '@/lib/stores/chat-pin-store';
import type { ChatWithMessages } from '@/lib/hooks/chat';
import { generateUUID } from '@/lib/utils';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';

type Props = {
  chatId: string; // Now always required - generated server-side
  initialChat?: ChatWithMessages;
};

export function ChatInterface({ chatId, initialChat }: Props) {
  const [text, setText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const hasInitializedMessages = useRef(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  // React Query hooks for data fetching
  const { data: allChats } = useChats();
  const { data: chatData } = useChatQuery(chatId);
  
  // Custom hooks for database operations
  const chatOps = useChatOperations(chatId);
  const messageOps = useMessageOperations(chatId);
  const togglePin = useToggleChatPin();
  const pinned = useChatPinStatus(chatId);

  // AI SDK Chat Hook - uses id to construct API URL with chatId
  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate: aiRegenerate,
    setMessages,
  } = useChat({
    id: chatId, // Always set from server-side generation
    generateId: generateUUID,
    onFinish: async (result) => {
      // Vercel pattern: Update URL on first message completion (seamless URL update without navigation)
      if (isFirstMessage && chatId) {
        console.log('[ChatInterface] First message complete, updating URL to /chat/' + chatId);
        window.history.replaceState({}, '', `/chat/${chatId}`);
        setIsFirstMessage(false);
      }

      // Save assistant message to database after streaming completes
      if (chatId && result?.message && result.message.role === 'assistant') {
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
      if (chatId) {
        messageOps.invalidateChat();
      }
    },
  });

  // Set initial messages when React Query data is loaded
  useEffect(() => {
    const chatToUse = initialChat || chatData;
    if (
      chatToUse?.messages &&
      chatToUse.messages.length > 0 &&
      chatId === chatToUse.id &&
      !hasInitializedMessages.current
    ) {
      console.log('Setting initial messages from DB:', chatToUse.messages.length);
      setMessages(chatToUse.messages);
      hasInitializedMessages.current = true;
      setIsFirstMessage(false); // Existing chat, not first message
    }
  }, [initialChat, chatData, chatId, setMessages]);
  
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

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    try {
      // Vercel pattern: Just send message directly
      // API will auto-create chat if it doesn't exist (using server-generated chatId)
      sendMessage({ text: message.text });
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [sendMessage, isLoading]);

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    try {
      // Vercel pattern: Just send message, API handles chat creation
      sendMessage({ text: suggestion });
    } catch (error) {
      console.error('Error sending suggestion:', error);
      toast.error('Failed to send message');
    }
  }, [sendMessage, isLoading]);

  const handleDelete = useCallback((messageId: string) => {
    // Use optimistic update - mutation handles the state update
    messageOps.deleteMessage(messageId);
    
    // Update local AI SDK state
    setMessages(messages.filter((m) => m.id !== messageId));
  }, [messageOps, messages, setMessages]);

  const handleEdit = useCallback((messageId: string, newContent: string) => {
    // Use optimistic update - mutation handles the state update
    messageOps.updateMessage(messageId, newContent);
    
    // Update local AI SDK state
    setMessages(messages.map((m) => 
      m.id === messageId 
        ? { ...m, content: newContent, parts: [{ type: 'text', text: newContent }] } 
        : m
    ));
  }, [messageOps, messages, setMessages]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    // Find the message to regenerate
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
      return;
    }
    
    try {
      // Call server action to delete messages (including the one we're regenerating)
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
  }, [messages, setMessages, aiRegenerate, messageOps]);

  // ============================================================================
  // Chat Handlers
  // ============================================================================

  const handleDeleteChat = useCallback(async () => {
    try {
      await chatOps.deleteChat();
      
      // Navigate to first available chat or /chat (new chat)
      const firstChat = allChats && allChats.length > 0 ? allChats[0] : null;
      
      if (firstChat) {
        window.location.href = `/chat/${firstChat.id}`;
      } else {
        window.location.href = '/chat';
      }
      
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  }, [chatOps, allChats]);

  const handleTogglePin = useCallback(async () => {
    try {
      togglePin(chatId, !pinned);
      toast.success(pinned ? 'Chat unpinned' : 'Chat pinned');
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  }, [chatId, pinned, togglePin]);

  const handleUpdateTitle = useCallback(async (newTitle: string) => {
    try {
      await chatOps.updateTitle(newTitle);
      toast.success('Title updated');
    } catch (error) {
      toast.error('Failed to update title');
    }
  }, [chatOps]);

  const handleNewChat = useCallback(() => {
    window.location.href = '/chat';
  }, []);

  return (
    <ChatView
      chatId={chatId}
      messages={messages}
      status={status}
      isLoading={isLoading}
      text={text}
      setText={setText}
      useWebSearch={useWebSearch}
      setUseWebSearch={setUseWebSearch}
      useMicrophone={useMicrophone}
      setUseMicrophone={setUseMicrophone}
      pinned={pinned}
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
