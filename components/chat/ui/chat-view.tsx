'use client';

import type { UIMessage } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import type { LengthOption, ToneOption } from '@/lib/config/message-modifiers';
import type { useFileUploads } from '@/lib/hooks/use-file-uploads';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { EmptyState } from './empty-state';
import { MessageList } from './message-list';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  isLoading: boolean;
  isLoadingChat?: boolean;
  isProcessing?: boolean;
  fileUploads: ReturnType<typeof useFileUploads>;
  text: string;
  setText: (text: string) => void;
  context: string;
  setContext: (context: string) => void;
  imageUrl: string;
  setImageUrl: (imageUrl: string) => void;
  useWebSearch: boolean;
  setUseWebSearch: (use: boolean) => void;
  useMicrophone: boolean;
  setUseMicrophone: (use: boolean) => void;
  tone: ToneOption;
  setTone: (tone: ToneOption) => void;
  length: LengthOption;
  setLength: (length: LengthOption) => void;
  chatTitle?: string;
  chatId?: string;
  pinned?: boolean;
  isGuestUser?: boolean;

  // NEW: Sharing props
  isPublic?: boolean;
  isReadOnly?: boolean;
  onMakePublic?: () => Promise<void>;

  onSubmit: (message: PromptInputMessage) => void;
  onSuggestionClick: (suggestion: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
  onNewChat: () => void;
  onDeleteChat: () => void;
  onUpdateTitle: (title: string) => void;
  onPinChat?: () => void;
  onStop: () => void;
};

export function ChatView({
  messages,
  status,
  isLoading,
  isLoadingChat = false,
  isProcessing = false,
  text,
  setText,
  context,
  setContext,
  imageUrl,
  setImageUrl,
  useWebSearch,
  setUseWebSearch,
  useMicrophone,
  setUseMicrophone,
  tone,
  setTone,
  length,
  setLength,
  chatTitle,
  chatId,
  pinned = false,
  isGuestUser = false,
  fileUploads,
  isPublic = false,
  isReadOnly = false,
  onMakePublic,
  onSubmit,
  onSuggestionClick,
  onDelete,
  onEdit,
  onRegenerate,
  onNewChat,
  onDeleteChat,
  onUpdateTitle,
  onPinChat,
  onStop,
}: Props) {
  const isNewChat = messages.length === 0;

  return (
    <div className="relative flex size-full pb-4 w-full items-center flex-col overflow-hidden">
      <ChatHeader
        title={chatTitle}
        chatId={chatId}
        pinned={pinned}
        isNewChat={isNewChat}
        isGuestUser={isGuestUser}
        isSessionPending={isLoading}
        isLoadingChat={isLoadingChat}
        onNewChatAction={onNewChat}
        onDeleteChat={chatTitle ? onDeleteChat : undefined}
        onUpdateTitle={chatTitle ? onUpdateTitle : undefined}
        onPinChat={onPinChat}
        isPublic={isPublic}
        isReadOnly={isReadOnly}
        onMakePublic={onMakePublic}
      />

      <Conversation className="flex-1 overflow-y-auto max-w-4xl w-full">
        <ConversationContent>
          {isLoadingChat ? (
            <div className="mx-auto w-full px-4 py-8">
              <div className="flex flex-col gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={i % 2 === 0 ? 'flex flex-col items-end' : 'flex flex-col items-start'}
                  >
                    <div className="flex gap-3 items-start w-full max-w-lg">
                      <div className={i % 2 === 0 ? 'flex-1 flex flex-col gap-2 items-end' : 'flex-1 flex flex-col gap-2'}>
                        <Skeleton className="h-8 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="mx-auto w-full max-w-2xl px-4">
                <EmptyState />
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl px-4">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                isProcessing={isProcessing}
                onDelete={onDelete}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
                isReadOnly={isReadOnly}
              />
              {status === 'submitted' && <Loader />}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {isReadOnly ? (
        <div className="border-t bg-muted/50 p-6 text-center text-sm text-muted-foreground">
          <Globe className="inline-block w-4 h-4 mr-2" />
          This is a public shared chat read-only
        </div>
      ) : (
        <div className="bg-canvas-bg grid shrink-0 gap-4 border-t lg:mx-auto mx-2 lg:w-full lg:max-w-4xl px-4 rounded-lg">
          <ChatInput
            text={text}
            context={context}
            onTextChangeAction={setText}
            onContextChangeAction={setContext}
            imageUrl={imageUrl}
            onImageUrlChangeAction={setImageUrl}
            useWebSearch={useWebSearch}
            onWebSearchChangeAction={setUseWebSearch}
            useMicrophone={useMicrophone}
            onMicrophoneChangeAction={setUseMicrophone}
            tone={tone}
            onToneChangeAction={setTone}
            length={length}
            onLengthChangeAction={setLength}
            status={status}
            fileUploads={fileUploads}
            onSubmitAction={onSubmit}
            onStopAction={onStop}
            disabled={isLoadingChat}
          />
        </div>
      )}
    </div>
  );
}