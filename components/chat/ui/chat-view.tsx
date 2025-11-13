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

import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { EmptyState } from './empty-state';
import { MessageList } from './message-list';

type Props = {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  isLoading: boolean;
  isLoadingChat?: boolean;
  isProcessing?: boolean;
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
  onSubmit: (message: PromptInputMessage) => void;
  onSuggestionClick: (suggestion: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
  onNewChat: () => void;
  onDeleteChat: () => void;
  onUpdateTitle: (title: string) => void;
  onPinChat?: (pinned: boolean) => void;
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
  const isNewChat = messages.length === 0 && !chatId;

  return (
    <div className="relative flex size-full w-full flex-col overflow-hidden">
      <ChatHeader
        title={chatTitle}
        chatId={chatId}
        pinned={pinned}
        onNewChatAction={onNewChat}
        onDeleteChat={chatTitle ? onDeleteChat : undefined}
        onUpdateTitle={chatTitle ? onUpdateTitle : undefined}
        onPinChat={onPinChat}
      />

      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent>
          {isLoadingChat ? (
            <div className="flex h-full items-center justify-center">
              <div className="mx-auto w-full max-w-2xl px-4">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader />
                  <span className="text-sm">Loading messages...</span>
                </div>
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
              />
              {status === 'submitted' && <Loader />}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="bg-canvas-bg grid shrink-0 gap-4 border-t pt-4">
        {/* Suggestions commented out for now */}
        {/* <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions> */}

        <div className="mx-auto w-full max-w-4xl px-4 pb-4">
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
            onSubmitAction={onSubmit}
            onStopAction={onStop}
            disabled={isLoadingChat}
          />
        </div>
      </div>
    </div>
  );
}
