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
  onSubmit: (message: PromptInputMessage) => void;
  onSuggestionClick: (suggestion: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
  onNewChat: () => void;
  onDeleteChat: () => void;
  onUpdateTitle: (title: string) => void;
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
  onSubmit,
  onSuggestionClick,
  onDelete,
  onEdit,
  onRegenerate,
  onNewChat,
  onDeleteChat,
  onUpdateTitle,
  onStop,
}: Props) {
  return (
    <div className="relative flex size-full flex-col overflow-hidden">
      <ChatHeader
        title={chatTitle}
        onNewChatAction={onNewChat}
        onDeleteChat={chatTitle && chatTitle !== 'New Chat' ? onDeleteChat : undefined}
        onUpdateTitle={chatTitle && chatTitle !== 'New Chat' ? onUpdateTitle : undefined}
      />

      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <MessageList
                messages={messages}
                isLoading={isLoading}
                onDelete={onDelete}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
              />
              {status === 'submitted' && <Loader />}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 border-t pt-4 bg-canvas-bg">
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>

        <div className="w-full px-4 pb-4">
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
