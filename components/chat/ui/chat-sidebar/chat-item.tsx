'use client';

import {
  Check,
  Edit2,
  MessageSquare,
  MoreVertical,
  Pin,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type Chat = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: Date;
};

type ChatItemProps = {
  chat: Chat;
  isActive: boolean;
  searchQuery: string;
  onDelete: (chatId: string) => void;
  onPin: (chatId: string, pinned: boolean) => void;
  onTitleUpdate: (chatId: string, title: string) => void;
};

export function ChatItem({
  chat,
  isActive,
  searchQuery,
  onDelete,
  onPin,
  onTitleUpdate,
}: ChatItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);

  const highlightTitle = (title: string) => {
    if (!searchQuery) return title;

    const searchTerm = searchQuery.toLowerCase();
    const index = title.toLowerCase().indexOf(searchTerm);

    if (index === -1) return title;

    return (
      <>
        {title.substring(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">
          {title.substring(index, index + searchTerm.length)}
        </mark>
        {title.substring(index + searchTerm.length)}
      </>
    );
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(chat.title);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle(chat.title);
  };

  const saveTitle = () => {
    if (!editTitle.trim()) {
      cancelEditing();
      return;
    }

    onTitleUpdate(chat.id, editTitle.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => router.replace(`/chat/${chat.id}`)}
        className={cn(
          'group/menu-item hover:bg-canvas-bg-hover hover:cursor-pointer',
          isActive &&
            'bg-canvas-bg-active font-medium border-l-2 border-primary-solid',
        )}
      >
        {isEditing ? (
          <div
            className="flex items-center gap-2 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={saveTitle}
              className="p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
              title="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">
              {highlightTitle(chat.title)}
            </span>
          </>
        )}
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="hover:bg-canvas-bg hover:cursor-pointer"
              asChild
            >
              <SidebarMenuAction showOnHover>
                <MoreVertical className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(chat.id, !chat.pinned);
                }}
              >
                <Pin className="h-4 w-4 mr-2" />
                {chat.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startEditing}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}