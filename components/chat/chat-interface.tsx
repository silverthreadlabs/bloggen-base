'use client';

import { useChat } from '@ai-sdk/react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';
import { 
  getToneModifierWithMarkers, 
  getLengthModifierWithMarkers,
  TONE_MARKER_START,
  TONE_MARKER_END,
  LENGTH_MARKER_START,
  LENGTH_MARKER_END,
} from '@/lib/config/message-modifiers';
import type { ChatWithMessages } from '@/lib/hooks/chat';
import { useChats, useUpdateChatTitleInCache } from '@/lib/hooks/chat';
import { chatKeys } from '@/lib/hooks/chat/query-keys';
import { useMessageModifiers } from '@/lib/hooks/use-url-state';
import {
  useChatPinStatus,
  useToggleChatPin,
} from '@/lib/hooks/chat/use-chat-pin';
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
  const [imageUrl, setImageUrl] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);

  const [modifiers, setModifiers] = useMessageModifiers();

  const modifiersRef = useRef(modifiers);
  modifiersRef.current = modifiers;

  const isFirstMessageRef = useRef(!initialChat?.messages?.length);
  const pendingSavesRef = useRef<Set<string>>(new Set());
  const messagesInitializedRef = useRef(false);
  const userContextRef = useRef(''); // Store user's actual context separately

  const { data: allChats } = useChats();
  
  // Build full context from user context and current modifiers
  const buildFullContext = useCallback((userContext: string): string => {
    let fullContext = userContext;
    
    // Add tone instructions with markers
    const toneModifier = getToneModifierWithMarkers(modifiersRef.current.tone);
    if (toneModifier) {
      fullContext = fullContext ? `${fullContext}${toneModifier}` : toneModifier.trim();
    }
    
    // Add length instructions with markers
    const lengthModifier = getLengthModifierWithMarkers(modifiersRef.current.length);
    if (lengthModifier) {
      fullContext = fullContext ? `${fullContext}${lengthModifier}` : lengthModifier.trim();
    }
    
    return fullContext;
  }, []);
  
  // Extract user context by removing modifier sections using markers
  const extractUserContext = useCallback((fullContext: string): string => {
    let extracted = fullContext;
    
    // Remove tone modifier section using indexOf (more reliable than regex)
    let toneStartIdx = extracted.indexOf(TONE_MARKER_START);
    while (toneStartIdx !== -1) {
      const toneEndIdx = extracted.indexOf(TONE_MARKER_END, toneStartIdx);
      if (toneEndIdx !== -1) {
        // Remove everything from start marker to end marker (inclusive)
        extracted = extracted.substring(0, toneStartIdx) + 
                    extracted.substring(toneEndIdx + TONE_MARKER_END.length);
        toneStartIdx = extracted.indexOf(TONE_MARKER_START);
      } else {
        break;
      }
    }
    
    // Remove length modifier section using indexOf
    let lengthStartIdx = extracted.indexOf(LENGTH_MARKER_START);
    while (lengthStartIdx !== -1) {
      const lengthEndIdx = extracted.indexOf(LENGTH_MARKER_END, lengthStartIdx);
      if (lengthEndIdx !== -1) {
        // Remove everything from start marker to end marker (inclusive)
        extracted = extracted.substring(0, lengthStartIdx) + 
                    extracted.substring(lengthEndIdx + LENGTH_MARKER_END.length);
        lengthStartIdx = extracted.indexOf(LENGTH_MARKER_START);
      } else {
        break;
      }
    }
    
    return extracted.trim();
  }, []);
  
  // Wrapper for setContext that updates userContextRef
  const handleContextChange = useCallback((newContext: string) => {
    const userPart = extractUserContext(newContext);
    userContextRef.current = userPart;
    setContext(newContext);
  }, [extractUserContext]);
  
  // Wrapper for setModifiers that rebuilds context
  const handleModifiersChange = useCallback((newModifiers: typeof modifiers) => {
    setModifiers(newModifiers);
    modifiersRef.current = newModifiers;
    const fullContext = buildFullContext(userContextRef.current);
    setContext(fullContext);
  }, [setModifiers, buildFullContext]);
  
  // Individual setters for tone and length
  const handleToneChange = useCallback((tone: typeof modifiers.tone) => {
    handleModifiersChange({ tone, length: modifiersRef.current.length });
  }, [handleModifiersChange]);
  
  const handleLengthChange = useCallback((length: typeof modifiers.length) => {
    handleModifiersChange({ tone: modifiersRef.current.tone, length });
  }, [handleModifiersChange]);
  
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
  // Use queueMicrotask to defer setState and avoid the "setState during render" warning
  if (!messagesInitializedRef.current && messages.length === 0 && (initialChat?.messages?.length || currentChat?.messages?.length)) {
    messagesInitializedRef.current = true;
    const chatData = currentChat || initialChat;
    if (chatData?.messages) {
      queueMicrotask(() => setMessages(chatData.messages));
    }
  }

  const isLoading = status === 'submitted' || status === 'streaming';
  // Buttons are disabled while loading/streaming, and message is saved before streaming ends
  const isProcessing = isLoading;

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isProcessing) return;

      try {
        const contextWithMarkers = message.context || '';
        const cleanContext = contextWithMarkers
          .replaceAll(TONE_MARKER_START, '')
          .replaceAll(TONE_MARKER_END, '')
          .replaceAll(LENGTH_MARKER_START, '')
          .replaceAll(LENGTH_MARKER_END, '')
          .trim();

        const messageParts: any[] = [{ type: 'text', text: message.text }];
        const fileIds: string[] = [];

        // Process files: upload and convert to AI-compatible format
        if (message.files && message.files.length > 0) {
          toast.loading('Processing files...', { id: 'file-processing' });

          for (const fileUIPart of message.files) {
            const file = (fileUIPart as any).__file as File;
            if (!file) continue;

            // Upload file to blob storage
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/files', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            const { url: fileUrl, id: fileId } = await uploadResponse.json();
            fileIds.push(fileId);

            // The AI will receive the file content via the API
            // Just add a reference in the message text for context
            if (file.type === 'application/pdf') {
              messageParts[0].text += `\n\n[Attached PDF: ${file.name}]`;
            } else if (file.type.startsWith('image/')) {
              messageParts[0].text += `\n\n[Attached Image: ${file.name}]`;
            } else if (
              file.type === 'text/plain' ||
              file.type === 'application/json' ||
              file.type.startsWith('text/')
            ) {
              messageParts[0].text += `\n\n[Attached Document: ${file.name}]`;
            } else {
              messageParts[0].text += `\n\n[Attached File: ${file.name}]`;
            }
          }

          toast.success('Files uploaded', {
            id: 'file-processing',
            description: `${message.files.length} file(s) attached`,
          });
        }

        // Add image URL if provided
        if (message.imageUrl?.trim()) {
          messageParts.push({
            type: 'image',
            image: message.imageUrl.trim(),
          });
        }

        console.log('[ChatInterface] Sending message with', messageParts.length, 'parts');

        sendMessage(
          {
            parts: messageParts,
            metadata: {
              ...(cleanContext ? { context: cleanContext } : {}),
              ...(fileIds.length > 0 ? { fileIds } : {}),
            },
          } as any,
          {
            body: {
              context: cleanContext || undefined,
            },
          },
        );

        setText('');
        setContext('');
        setImageUrl('');
      } catch (error) {
        console.error('Error processing files:', error);
        toast.error('Failed to process files', {
          id: 'file-processing',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      }
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

          // Extract context from the original message metadata (preserve it after edit)
          const messageContext = (messages[messageIndex].metadata as { context?: string } | undefined)?.context;

          // Regenerate using the edited user message ID
          aiRegenerate({
            messageId: messageId, // This is already the user message ID
            body: {
              context: messageContext, // Pass context for regeneration
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

        // Extract context from the user message metadata
        const userContext = (userMessage.metadata as { context?: string } | undefined)?.context;

        // Regenerate using the user message ID (the message before the assistant message)
        aiRegenerate({
          messageId: userMessage.id,
          body: {
            context: userContext, // Pass context for regeneration
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
    // toast.success(pinned ? 'Chat unpinned' : 'Chat pinned');
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
      setContext={handleContextChange}
      imageUrl={imageUrl}
      setImageUrl={setImageUrl}
      useWebSearch={useWebSearch}
      setUseWebSearch={setUseWebSearch}
      useMicrophone={useMicrophone}
      setUseMicrophone={setUseMicrophone}
      tone={modifiers.tone}
      setTone={handleToneChange}
      length={modifiers.length}
      setLength={handleLengthChange}
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
