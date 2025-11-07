'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  MicIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Action, Actions } from '@/components/ai-elements/actions';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Response } from '@/components/ai-elements/response';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { hardcodedMessages, mockResponses, suggestions } from './chat-data';
import { ChatHeader } from './chat-header';
import { EmptyState } from './empty-state';
import { useChatActions } from './hooks/use-chat-actions';
import { MessageAvatar } from './message-avatar';
import type { HardcodedMessageType } from './types';
import { isLastAssistantMessage } from './utils/message-utils';

// ============================================================================
// TOGGLE BETWEEN HARDCODED AND REAL MESSAGES
// ============================================================================
const USE_HARDCODED_MESSAGES = false; // Set to false to use real AI messages

type Props = {
  session?: any;
};

export default function ChatClient({ session }: Props) {
  // ============================================================================
  // REAL AI STATE
  // ============================================================================
  const {
    messages: realMessages,
    sendMessage,
    status: realStatus,
    stop,
    regenerate,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // ============================================================================
  // HARDCODED STATE
  // ============================================================================
  const [hardMessages, setHardMessages] =
    useState<HardcodedMessageType[]>(hardcodedMessages);
  const [hardStatus, setHardStatus] = useState<
    'submitted' | 'streaming' | 'ready' | 'error'
  >('ready');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [streamingAbortController, setStreamingAbortController] =
    useState<AbortController | null>(null);

  // ============================================================================
  // SHARED STATE
  // ============================================================================
  const [text, setText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const { copiedId, handleCopy } = useChatActions();

  // ============================================================================
  // HARDCODED STREAMING
  // ============================================================================
  const streamResponse = useCallback(
    async (messageId: string, content: string) => {
      setHardStatus('streaming');
      setStreamingMessageId(messageId);

      const abortController = new AbortController();
      setStreamingAbortController(abortController);

      const words = content.split(' ');
      let currentContent = '';

      try {
        for (let i = 0; i < words.length; i++) {
          if (abortController.signal.aborted) {
            break;
          }

          currentContent += (i > 0 ? ' ' : '') + words[i];

          setHardMessages((prev) =>
            prev.map((msg) =>
              msg.key === messageId ? { ...msg, content: currentContent } : msg,
            ),
          );

          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100 + 50),
          );
        }
      } catch (error) {
        // Handle abort
      } finally {
        setHardStatus('ready');
        setStreamingMessageId(null);
        setStreamingAbortController(null);
      }
    },
    [],
  );

  const addHardcodedMessage = useCallback(
    (content: string) => {
      const userMessage: HardcodedMessageType = {
        key: nanoid(),
        from: 'user',
        content,
        avatar: session?.user?.image || 'https://github.com/haydenbleasel.png',
        name: session?.user?.name || 'User',
      };

      setHardMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const assistantMessageId = nanoid();
        const randomResponse =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];

        const assistantMessage: HardcodedMessageType = {
          key: assistantMessageId,
          from: 'assistant',
          content: '',
          avatar: 'https://github.com/openai.png',
          name: 'AI Assistant',
        };

        setHardMessages((prev) => [...prev, assistantMessage]);
        streamResponse(assistantMessageId, randomResponse);
      }, 500);
    },
    [streamResponse, session],
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleStop = () => {
    if (USE_HARDCODED_MESSAGES) {
      streamingAbortController?.abort();
      setHardStatus('ready');
      setStreamingMessageId(null);
      setStreamingAbortController(null);
    } else {
      stop();
    }
  };

  const handleSubmit = (message: PromptInputMessage) => {
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

    if (USE_HARDCODED_MESSAGES) {
      setHardStatus('submitted');
      addHardcodedMessage(message.text || 'Sent with attachments');
    } else {
      if (message.text?.trim()) {
        sendMessage({ text: message.text });
      }
    }

    setText('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (USE_HARDCODED_MESSAGES) {
      setHardStatus('submitted');
      addHardcodedMessage(suggestion);
    } else {
      sendMessage({ text: suggestion });
    }
  };

  const handleDelete = (messageId: string) => {
    if (USE_HARDCODED_MESSAGES) {
      setHardMessages((prev) => prev.filter((m) => m.key !== messageId));
    } else {
      setMessages(realMessages.filter((m) => m.id !== messageId));
    }
  };

  const handleNewChat = () => {
    if (USE_HARDCODED_MESSAGES) {
      setHardMessages([]);
      setHardStatus('ready');
    } else {
      setMessages([]);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const messages = USE_HARDCODED_MESSAGES ? hardMessages : realMessages;
  const status = USE_HARDCODED_MESSAGES ? hardStatus : realStatus;
  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="relative flex size-full flex-col overflow-hidden">
      <ChatHeader onNewChatAction={handleNewChat} />

      <Conversation className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <ConversationContent>
            {USE_HARDCODED_MESSAGES
              ? // HARDCODED MESSAGES RENDER
                hardMessages.map((message, index) => {
                  const isLastAssistant =
                    message.from === 'assistant' &&
                    index === hardMessages.length - 1 &&
                    !isLoading;

                  return (
                    <Message key={message.key} from={message.from}>
                      <div>
                        <MessageContent>
                          <Response>{message.content}</Response>
                        </MessageContent>
                        <Actions className="mt-2">
                          <Action
                            tooltip="Copy"
                            onClick={() =>
                              handleCopy(message.key, message.content)
                            }
                          >
                            {copiedId === message.key ? (
                              <CheckIcon className="size-3" />
                            ) : (
                              <CopyIcon className="size-3" />
                            )}
                          </Action>

                          {message.from === 'assistant' && isLastAssistant && (
                            <Action
                              tooltip="Regenerate"
                              onClick={() =>
                                streamResponse(
                                  message.key,
                                  mockResponses[
                                    Math.floor(
                                      Math.random() * mockResponses.length,
                                    )
                                  ],
                                )
                              }
                            >
                              <RefreshCwIcon className="size-3" />
                            </Action>
                          )}

                          {message.from === 'user' && (
                            <Action
                              tooltip="Delete"
                              onClick={() => handleDelete(message.key)}
                            >
                              <Trash2Icon className="size-3" />
                            </Action>
                          )}
                        </Actions>
                      </div>
                      <MessageAvatar
                        role={message.from}
                        userName={message.name}
                      />
                    </Message>
                  );
                })
              : // REAL MESSAGES RENDER
                realMessages.map((message, index) => {
                  const messageText = message.parts
                    .filter((part) => part.type === 'text')
                    .map((part) => (part.type === 'text' ? part.text : ''))
                    .join('');

                  const isLastAssistant = isLastAssistantMessage(
                    message,
                    index,
                    realMessages,
                    isLoading,
                  );

                  return (
                    <Message key={message.id} from={message.role}>
                      <div>
                        <MessageContent>
                          <Response>{messageText}</Response>
                        </MessageContent>
                        <Actions className="mt-2">
                          <Action
                            tooltip="Copy"
                            onClick={() => handleCopy(message.id, messageText)}
                          >
                            {copiedId === message.id ? (
                              <CheckIcon className="size-3" />
                            ) : (
                              <CopyIcon className="size-3" />
                            )}
                          </Action>

                          {message.role === 'assistant' && isLastAssistant && (
                            <Action
                              tooltip="Regenerate"
                              onClick={() => regenerate()}
                            >
                              <RefreshCwIcon className="size-3" />
                            </Action>
                          )}

                          {message.role === 'user' && (
                            <Action
                              tooltip="Delete"
                              onClick={() => handleDelete(message.id)}
                            >
                              <Trash2Icon className="size-3" />
                            </Action>
                          )}
                        </Actions>
                      </div>
                      <MessageAvatar
                        role={message.role as 'user' | 'assistant'}
                        userName={session?.user?.name ?? undefined}
                      />
                    </Message>
                  );
                })}

            {status === 'submitted' && <Loader />}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 border-t pt-4 bg-canvas-bg">
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>

        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) => setText(event.target.value)}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  onClick={() => setUseMicrophone(!useMicrophone)}
                  variant={useMicrophone ? 'solid' : 'ghost'}
                >
                  <MicIcon size={16} />
                  <span className="sr-only">Microphone</span>
                </PromptInputButton>
                <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? 'solid' : 'ghost'}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!(text.trim() || status)}
                status={status}
                onClick={(e) => {
                  if (status === 'streaming') {
                    e.preventDefault();
                    handleStop();
                  }
                }}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
