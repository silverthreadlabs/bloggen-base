'use client';

import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useChats, useCreateChat, useDeleteChat, useUpdateChatTitle } from '@/lib/hooks/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Props = {
  currentChatId?: string;
};

export function ChatSidebar({ currentChatId }: Props) {
  const router = useRouter();
  const { data: chats, isLoading } = useChats();
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateTitleMutation = useUpdateChatTitle();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = () => {
    createChatMutation.mutate('New Chat', {
      onSuccess: (newChat) => {
        // Use replace instead of push for smoother navigation
        router.replace(`/chat/${newChat.id}`);
        toast.success('New chat created');
      },
      onError: () => {
        toast.error('Failed to create chat');
      },
    });
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this chat?')) return;

    deleteChatMutation.mutate(chatId, {
      onSuccess: () => {
        if (currentChatId === chatId) {
          router.replace('/chat');
        }
        toast.success('Chat deleted');
      },
      onError: () => {
        toast.error('Failed to delete chat');
      },
    });
  };

  const startEditing = (chatId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chatId);
    setEditTitle(title);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const saveTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      cancelEditing();
      return;
    }

    updateTitleMutation.mutate(
      { chatId, title: editTitle.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success('Title updated');
        },
        onError: () => {
          toast.error('Failed to update title');
        },
      }
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <Button
          onClick={handleNewChat}
          disabled={createChatMutation.isPending}
          className="w-full"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading chats...
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No chats yet</p>
            <p className="text-xs text-muted-foreground">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                  currentChatId === chat.id && 'bg-accent'
                )}
              >
                {editingId === chat.id ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveTitle(chat.id, e as any);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="flex-1 bg-transparent border-b border-primary outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => saveTitle(chat.id, e)}
                      className="p-1 hover:bg-primary/10 rounded"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => router.replace(`/chat/${chat.id}`)}
                      className="flex-1 truncate text-left hover:underline"
                    >
                      {chat.title}
                    </button>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => startEditing(chat.id, chat.title, e)}
                        className="p-1 hover:bg-primary/10 rounded"
                        title="Edit title"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="p-1 hover:bg-destructive/10 rounded"
                        title="Delete chat"
                        disabled={deleteChatMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
