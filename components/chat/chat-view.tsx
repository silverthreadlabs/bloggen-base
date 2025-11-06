'use client';

import type { UIMessage } from '@ai-sdk/react';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { ChatHeader } from './chat-header';
import { EmptyState } from './empty-state';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { suggestions } from './chat-data';

type Props = {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  isLoading: boolean;
  text: string;
  setText: (text: string) => void;
  useWebSearch: boolean;
  setUseWebSearch: (use: boolean) => void;
  useMicrophone: boolean;
  setUseMicrophone: (use: boolean) => void;
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
  text,
  setText,
  useWebSearch,
  setUseWebSearch,
  useMicrophone,
  setUseMicrophone,
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
    <div className="relative flex size-full flex-col overflow-hidden w-full">
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
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-2xl mx-auto px-4">
                <EmptyState />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto px-4">
              <MessageList
                messages={messages}
                isLoading={isLoading}
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

      <div className="grid shrink-0 gap-4 border-t pt-4 bg-canvas-bg">
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

        <div className="w-full max-w-4xl mx-auto px-4 pb-4">
          <ChatInput
            text={text}
            onTextChange={setText}
            useWebSearch={useWebSearch}
            onWebSearchChange={setUseWebSearch}
            useMicrophone={useMicrophone}
            onMicrophoneChange={setUseMicrophone}
            status={status}
            onSubmit={onSubmit}
            onStop={onStop}
          />
        </div>
      </div>
    </div>
  );
}
