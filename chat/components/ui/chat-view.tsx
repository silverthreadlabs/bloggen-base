'use client';

import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from '@/chat/components/ai-elements/conversation';
import { Loader } from '@/chat/components/ai-elements/loader';
import type { PromptInputMessage } from '@/chat/components/ai-elements/prompt-input';
import type { useFileUploads } from '@/chat/hooks/use-file-uploads';
import { LengthOption, ToneOption } from '@/chat/utils/message-modifiers';
import { Skeleton } from '@/components/ui/skeleton';
import type { UIMessage } from '@ai-sdk/react';

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
    isGuestUser = false,
    fileUploads,
    onSubmit,
    onSuggestionClick,
    onDelete,
    onEdit,
    onRegenerate,
    onNewChat,
    onDeleteChat,
    onUpdateTitle,
    onPinChat,
    onStop
}: Props) {
    const isNewChat = messages.length === 0;

    return (
        <div className='relative flex size-full w-full flex-col items-center overflow-hidden pb-4'>
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
            />

            <Conversation className='w-full max-w-4xl flex-1 overflow-y-auto'>
                <ConversationContent>
                    {isLoadingChat ? (
                        <div className='mx-auto w-full px-4 py-8'>
                            <div className='flex flex-col gap-6'>
                                {[...Array(4)].map((_, i) => {
                                    const isUser = i % 2 === 0;
                                    return (
                                        <div
                                            key={i}
                                            className={
                                                isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
                                            }>
                                            <div className='flex w-full max-w-lg items-start gap-3'>
                                                <div
                                                    className={
                                                        isUser
                                                            ? 'flex flex-1 flex-col items-end gap-2'
                                                            : 'flex flex-1 flex-col gap-2'
                                                    }>
                                                    <Skeleton className='h-8 w-1/2' />
                                                </div>
                                            </div>
                                            <div
                                                className={
                                                    isUser
                                                        ? 'mt-2 flex justify-end gap-2'
                                                        : 'mt-2 flex justify-start gap-2'
                                                }>
                                                <Skeleton className='h-6 w-10 rounded-md' />
                                                <Skeleton className='h-6 w-10 rounded-md' />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className='flex h-full items-center justify-center'>
                            <div className='mx-auto w-full max-w-2xl px-4'>
                                <EmptyState />
                            </div>
                        </div>
                    ) : (
                        <div className='mx-auto w-full max-w-4xl px-4'>
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

            <div className='bg-canvas-bg grid w-full max-w-4xl shrink-0 gap-4 rounded-lg border-t pt-4'>
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

                <div className='mx-auto w-full max-w-4xl px-4 pb-4'>
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
            </div>
        </div>
    );
}
