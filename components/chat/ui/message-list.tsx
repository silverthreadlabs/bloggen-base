'use client';

import type { UIMessage } from '@ai-sdk/react';
import { CheckIcon, CopyIcon, PencilIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { Action, Actions } from '@/components/ai-elements/actions';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { useChatActions } from '@/lib/hooks/chat';
import { MessageAvatar } from './message-avatar';
import { isLastAssistantMessage } from '../utils/message-utils';

type Props = {
  messages: UIMessage[];
  isLoading: boolean;
  isProcessing?: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
};

export function MessageList({
  messages,
  isLoading,
  isProcessing = false,
  onDelete,
  onEdit,
  onRegenerate,
}: Props) {
  const { copiedId, handleCopy } = useChatActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingId(messageId);
    setEditText(content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editText.trim()) {
      onEdit(messageId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <>
      {messages.map((message, index) => {
        const messageText = message.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        const isLastAssistant = isLastAssistantMessage(
          message,
          index,
          messages,
          isLoading,
        );

        const isEditing = editingId === message.id;

        return (
          <Message key={message.id} from={message.role}>
            <div>
              <MessageContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full min-h-[100px] p-2 border rounded-md bg-background text-foreground"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(message.id)}
                        disabled={isProcessing}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isProcessing}
                        className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Response>{messageText}</Response>
                )}
              </MessageContent>

              {!isEditing && (
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

                  {message.role === 'assistant' && (
                    <Action
                      tooltip="Regenerate"
                      onClick={() => onRegenerate(message.id)}
                      disabled={isLoading || isProcessing}
                    >
                      <RefreshCwIcon className="size-3" />
                    </Action>
                  )}

                  {message.role === 'user' && (
                    <>
                      <Action
                        tooltip="Edit"
                        onClick={() => handleStartEdit(message.id, messageText)}
                        disabled={isProcessing}
                      >
                        <PencilIcon className="size-3" />
                      </Action>
                      {/* <Action
                        tooltip="Delete"
                        onClick={() => onDelete(message.id)}
                      >
                        <Trash2Icon className="size-3" />
                      </Action> */}
                    </>
                  )}
                </Actions>
              )}
            </div>
            <MessageAvatar role={message.role as 'user' | 'assistant'} />
          </Message>
        );
      })}
    </>
  );
}
