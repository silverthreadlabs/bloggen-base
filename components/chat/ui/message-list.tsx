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
import { FileAttachmentsGrid } from './file-attachment-display';
import { cn } from '@/lib/utils';
import type { FileUIPart } from 'ai';

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
        const messageText = (message.parts || [])
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');

        // Extract file attachments from message parts
        const fileAttachments = (message.parts || [])
          .filter((part) => {
            const anyPart = part as any;
            // Handle both regular file parts and data-file parts
            return (part.type === 'file' || part.type === 'data-file') && (anyPart.data || anyPart.url);
          })
          .map((part) => {
            const anyPart = part as any;
            // For data-file parts (from AI SDK conversion)
            if (part.type === 'data-file' && anyPart.data) {
              return {
                type: 'file' as const,
                url: anyPart.data.url || anyPart.data,
                mediaType: anyPart.data.mediaType || anyPart.mediaType || 'application/octet-stream',
                filename: anyPart.data.filename || anyPart.filename || 'Attachment',
              } as FileUIPart;
            }
            // For regular file parts
            return {
              type: 'file' as const,
              url: anyPart.url || anyPart.data,
              mediaType: anyPart.mediaType || 'application/octet-stream',
              filename: anyPart.filename || 'Attachment',
            } as FileUIPart;
          });

        const isLastAssistant = isLastAssistantMessage(
          message,
          index,
          messages,
          isLoading,
        );

        const isEditing = editingId === message.id;
        const messageContext = (
          message.metadata as { context?: string } | undefined
        )?.context;

        return (
          <Message key={message.id} from={message.role}>
            <div className={cn('flex flex-col', message.role === 'user' ? 'items-end' : 'items-start')} >
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
                  <>
                    {messageContext && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-md border border-border/50">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Instructions:
                        </div>
                        <div className="text-sm text-muted-foreground/90 whitespace-pre-line">
                          {messageContext
                            .replace(/\[tone-instruction\]|\[\/tone-instruction\]/g, '')
                            .replace(/\[length-instruction\]|\[\/length-instruction\]/g, '')
                            .trim()}
                        </div>
                      </div>
                    )}
                    
                    {/* Display file attachments */}
                    {fileAttachments.length > 0 && (
                      <div className="mb-3">
                        <FileAttachmentsGrid files={fileAttachments} />
                      </div>
                    )}
                    
                    {/* Display images from message parts */}
                    {(message.parts || [])
                      .filter((part) => {
                        // Support both 'image' type and 'data-image' type
                        const anyPart = part as any;
                        const imageUrl = anyPart.image || anyPart.data?.url;
                        // Validate it's a valid HTTPS URL
                        if (!imageUrl || typeof imageUrl !== 'string') return false;
                        try {
                          const url = new URL(imageUrl);
                          return url.protocol === 'https:';
                        } catch {
                          return false;
                        }
                      })
                      .map((part, idx) => {
                        const anyPart = part as any;
                        const imageUrl = anyPart.image || anyPart.data?.url;
                        return (
                          <div key={idx} className="mb-3 relative w-full max-w-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt="User provided content"
                              className="max-w-full h-auto max-h-96 rounded-lg border border-border object-contain"
                            />
                          </div>
                        );
                      })}
                    
                    <Response isStreaming={isLastAssistant && isLoading}>
                      {messageText}
                    </Response>
                  </>
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
