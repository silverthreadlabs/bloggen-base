'use client';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { deleteTrailingMessages } from '@/lib/actions/chat-actions';
import { useSession } from '@/lib/auth/auth-client';
import {
  getLengthModifierWithMarkers,
  getToneModifierWithMarkers,
  LENGTH_MARKER_END,
  LENGTH_MARKER_START,
  TONE_MARKER_END,
  TONE_MARKER_START,
} from '@/lib/config/message-modifiers';
import {
  useChatOperations,
  useChat as useChatQuery,
  useChats,
  useMessageOperations,
  useUpdateChatTitleInCache,
} from '@/lib/hooks/chat';
import { chatKeys } from '@/lib/hooks/chat/query-keys';
import {
  useChatPinStatus,
  useToggleChatPin,
} from '@/lib/hooks/chat/use-chat-pin';
import { useFileUploads } from '@/lib/hooks/use-file-uploads';
import { useMessageModifiers } from '@/lib/hooks/use-url-state';
import { useMakeChatPublic } from '@/lib/hooks/chat/use-make-public';
import type { ChatWithMessages } from '@/lib/types/chat';
import { generateUUID } from '@/lib/utils';
import { ChatView } from './ui/chat-view';
import { useMakeChatPublic } from '@/lib/hooks/chat/use-chat-mutations';

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
  const userContextRef = useRef('');

  const { data: session } = useSession();
  const isGuestUser = !session?.user;
  const currentUserId = session?.user?.id;

  const { data: allChats } = useChats(!isGuestUser);
  const { data: presentChat } = useChatQuery(isGuestUser ? undefined : chatId);
  const chat = presentChat || initialChat;

  const isOwner = currentUserId === chat?.userId;
  const isPublic = chat?.visibility === 'public';
  const isReadOnly = !isOwner;
  const makePublic = useMakeChatPublic(chatId);
  const handleMakePublic = useCallback(async () => {
    if (isPublic || !isOwner || makePublic.isPending) return;
    try {
      await makePublic.mutateAsync();
    } catch {
      // Error already shown in hook
    }
  }, [isPublic, isOwner, makePublic]);

  // Fetch current chat data
  const { data: currentChat } = useChatQuery(isGuestUser ? undefined : chatId);
  const chat = currentChat || initialChat;

  // Ownership & visibility
  const isOwner = currentUserId === chat?.userId;
  const isPublic = chat?.visibility === 'public';
  const isReadOnly = !isOwner;

  // Make chat public
  const makePublic = useMakeChatPublic(chatId);

  const handleMakePublic = useCallback(async () => {
    if (isPublic || !isOwner || makePublic.isPending) return;
    try {
      await makePublic.mutateAsync();
    } catch {
      // Error already shown in hook
    }
  }, [isPublic, isOwner, makePublic]);

  // Context handling
  const buildFullContext = useCallback((userContext: string): string => {
    let fullContext = userContext;
    const toneModifier = getToneModifierWithMarkers(modifiersRef.current.tone);
    if (toneModifier) fullContext = fullContext ? `${fullContext}${toneModifier}` : toneModifier.trim();
    const lengthModifier = getLengthModifierWithMarkers(modifiersRef.current.length);
    if (lengthModifier) fullContext = fullContext ? `${fullContext}${lengthModifier}` : lengthModifier.trim();
    return fullContext;
  }, []);

  const extractUserContext = useCallback((fullContext: string): string => {
    let extracted = fullContext;
    let idx = extracted.indexOf(TONE_MARKER_START);
    while (idx !== -1) {
      const end = extracted.indexOf(TONE_MARKER_END, idx);
      if (end !== -1) {
        extracted = extracted.substring(0, idx) + extracted.substring(end + TONE_MARKER_END.length);
        idx = extracted.indexOf(TONE_MARKER_START);
      } else break;
    }
    idx = extracted.indexOf(LENGTH_MARKER_START);
    while (idx !== -1) {
      const end = extracted.indexOf(LENGTH_MARKER_END, idx);
      if (end !== -1) {
        extracted = extracted.substring(0, idx) + extracted.substring(end + LENGTH_MARKER_END.length);
        idx = extracted.indexOf(LENGTH_MARKER_START);
      } else break;
    }
    return extracted.trim();
  }, []);

  const handleContextChange = useCallback(
    (newContext: string) => {
      const userPart = extractUserContext(newContext);
      userContextRef.current = userPart;
      setContext(newContext);
    },
    [extractUserContext],
  );

  const handleModifiersChange = useCallback(
    (newModifiers: typeof modifiers) => {
      setModifiers(newModifiers);
      modifiersRef.current = newModifiers;
      setContext(buildFullContext(userContextRef.current));
    },
    [setModifiers, buildFullContext],
  );

  const handleToneChange = useCallback(
    (tone: typeof modifiers.tone) => {
      handleModifiersChange({ tone, length: modifiersRef.current.length });
    },
    [handleModifiersChange],
  );

  const handleLengthChange = useCallback(
    (length: typeof modifiers.length) => {
      handleModifiersChange({ tone: modifiersRef.current.tone, length });
    },
    [handleModifiersChange],
  );

  const chatOps = useChatOperations(chatId);
  const messageOps = useMessageOperations(chatId);
  const togglePin = useToggleChatPin();
  const pinned = useChatPinStatus(isGuestUser ? undefined : chatId);
  const updateChatTitleInCache = useUpdateChatTitleInCache();

  const fileUploads = useFileUploads({
    chatId,
    onUploadComplete: (fileId, file) => console.log('[Chat] File uploaded:', file.name, fileId),
    onUploadError: (error, file) => console.error('[Chat] File upload failed:', file.name, error),
  });

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
      if (isGuestUser) return;
      const assistantMessage = result.message;
      pendingSavesRef.current.add(assistantMessage.id);

      // Get metadata for title updates
      const metadata = result.message.metadata as
        | {
          chatId?: string;
          chatTitle?: string;
          isNewChat?: boolean;
        }
        | undefined;

      if (isFirstMessageRef.current) {
        window.history.replaceState({}, '', `/chat/${chatId}`);
        isFirstMessageRef.current = false;
        if (metadata?.chatTitle) updateChatTitleInCache(chatId, metadata.chatTitle);
      }

      if (!isGuestUser) {
        try {
          await messageOps.saveMessage(
            { role: 'assistant', parts: assistantMessage.parts },
            assistantMessage.id,
          );
          queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
        } catch (error) {
          console.error('Failed to save message:', error);
        } finally {
          pendingSavesRef.current.delete(assistantMessage.id);
        }
      } else {
        pendingSavesRef.current.delete(assistantMessage.id);
      }
    },
  });

  if (
    !messagesInitializedRef.current &&
    messages.length === 0 &&
    (initialChat?.messages?.length || currentChat?.messages?.length)
  ) {
    messagesInitializedRef.current = true;
    const chatData = currentChat || initialChat;
    if (chatData?.messages) {
      queueMicrotask(() => setMessages(chatData.messages));
    }
  }

  const isLoading = status === 'submitted' || status === 'streaming';
  const isProcessing = isLoading;

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (isReadOnly) {
        toast.error('You cannot send messages in a public shared chat');
        return;
      }
      if (fileUploads.isAnyUploading()) {
        toast.error('Please wait for files to finish uploading');
        return;
      }
      if (!message.text?.trim() || isProcessing) return;

      const contextWithMarkers = message.context || '';
      const cleanContext = contextWithMarkers
        .replaceAll(TONE_MARKER_START, '')
        .replaceAll(TONE_MARKER_END, '')
        .replaceAll(LENGTH_MARKER_START, '')
        .replaceAll(LENGTH_MARKER_END, '')
        .trim();

      const messageParts: any[] = [{ type: 'text', text: message.text }];
      const fileIds = fileUploads.getUploadedFileIds();
      const uploadedFiles = fileUploads.getUploadedFiles();

      for (const file of uploadedFiles) {
        if (file.type.startsWith('image/')) {
          messageParts.push({ type: 'image', image: file.url });
        } else {
          messageParts.push({ type: 'file', data: file.url, mimeType: file.type });
        }
      }

      setText('');
      setContext('');
      setImageUrl('');
      fileUploads.clearAll();

      if (message.imageUrl?.trim()) {
        messageParts.push({ type: 'image', image: message.imageUrl.trim() });
      }

      sendMessage(
        {
          parts: messageParts,
          metadata: {
            ...(cleanContext ? { context: cleanContext } : {}),
            ...(fileIds.length > 0 ? { fileIds } : {}),
          },
        } as any,
        { body: { context: cleanContext || undefined } },
      );
    },
    [sendMessage, isProcessing, fileUploads, isReadOnly],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isProcessing || isReadOnly) return;
      sendMessage({ text: suggestion });
    },
    [sendMessage, isProcessing, isReadOnly],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      if (isReadOnly) return;
      if (!isGuestUser) messageOps.deleteMessage(messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    },
    [messageOps, messages, setMessages, isGuestUser, isReadOnly],
  );

  const handleEdit = useCallback(
    async (messageId: string, newContent: string) => {
      if (isReadOnly || isGuestUser) return;
      // Your existing edit logic here (unchanged)
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;

      const newParts = [{ type: 'text' as const, text: newContent }];
      messageOps.updateMessage(messageId, newParts);
      const updatedMessages = messages.map((m) =>
        m.id === messageId
          ? {
            ...m,
            parts: newParts,
          }
          : m,
      );

      const nextAssistantIndex = updatedMessages.findIndex(
        (m, idx) => idx > messageIndex && m.role === 'assistant',
      );

      if (nextAssistantIndex !== -1) {
        const assistantId = updatedMessages[nextAssistantIndex].id;
        messageOps.regenerateMessage(assistantId, () => deleteTrailingMessages({ id: assistantId }));
        setMessages(updatedMessages.slice(0, messageIndex + 1));
        aiRegenerate({ messageId, body: { context: (messages[messageIndex].metadata as any)?.context } });
        toast.success('Regenerating response...');
      } else {
        setMessages(updatedMessages);
      }
    },
    [messageOps, messages, setMessages, aiRegenerate, isGuestUser, isReadOnly],
  );

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (isReadOnly || isGuestUser) return;
      // Your existing regenerate logic (safe to keep)
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

      const userMessage = messages.slice(0, messageIndex).reverse().find((m) => m.role === 'user');
      if (!userMessage) return;

      messageOps.regenerateMessage(messageId, () => deleteTrailingMessages({ id: messageId }));
      setMessages(messages.slice(0, messageIndex));
      aiRegenerate({
        messageId: userMessage.id,
        body: { context: (userMessage.metadata as any)?.context },
      });
      toast.success('Regenerating response...');
    },
    [messages, setMessages, messageOps, aiRegenerate, isGuestUser, isReadOnly],
  );

  const handleDeleteChat = useCallback(async () => {
    if (isReadOnly || isGuestUser) return;
    // Your existing delete logic (unchanged)
    let nextChatId: string | undefined;
    if (allChats && allChats.length > 0) {
      const idx = allChats.findIndex((c) => c.id === chatId);
      if (idx !== -1) {
        nextChatId = allChats[idx + 1]?.id || allChats[idx - 1]?.id;
      }
    }
    await chatOps.deleteChat();
    window.location.href = nextChatId ? `/chat/${nextChatId}` : '/chat';
    toast.success('Chat deleted');
  }, [chatOps, allChats, chatId, isGuestUser, isReadOnly]);

  const handleTogglePin = useCallback(() => {
    if (isReadOnly || isGuestUser) return;
    togglePin(chatId, !pinned);
  }, [chatId, pinned, togglePin, isGuestUser, isReadOnly]);

  const handleUpdateTitle = useCallback(
    async (newTitle: string) => {
      if (isReadOnly || isGuestUser) return;
      try {
        await chatOps.updateTitle(newTitle);
        toast.success('Title updated');
      } catch {
        toast.error('Failed to update title');
      }
    },
    [chatOps, isGuestUser, isReadOnly],
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
      isProcessing={isProcessing || fileUploads.isAnyUploading()}
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
      isGuestUser={isGuestUser}
      fileUploads={fileUploads}
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
      isPublic={isPublic}
      isReadOnly={isReadOnly}
      onMakePublic={handleMakePublic}
    />
  );
}