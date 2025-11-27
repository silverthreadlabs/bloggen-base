'use client';

import { useState, useMemo } from 'react';
import { Pin, ChevronDown, ChevronRight } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChatItem } from './chat-item';

type Chat = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: Date;
};

type PinnedSectionProps = {
  pinnedChats: Chat[];
  currentChatId?: string;
  searchQuery: string;
  isLoading: boolean;
  onDeleteChat: (chatId: string) => void;
  onPinChat: (chatId: string, pinned: boolean) => void;
  onTitleUpdate: (chatId: string, title: string) => void;
};

export function PinnedSection({
  pinnedChats,
  currentChatId,
  searchQuery,
  isLoading,
  onDeleteChat,
  onPinChat,
  onTitleUpdate,
}: PinnedSectionProps) {
  const [pinnedExpanded, setPinnedExpanded] = useState(true);

  // Filter pinned chats based on search query
  const filteredPinnedChats = useMemo(() => {
    if (!searchQuery) return pinnedChats;
    return pinnedChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pinnedChats, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <SidebarGroup className="shrink-0">
        <SidebarGroupLabel ref={labelRef}>
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            <span>Pinned</span>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="ml-6">
            <SidebarMenu>
              {[...Array(2)].map((_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-8 w-full mb-2" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (filteredPinnedChats.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="shrink-0">
      <SidebarGroupLabel
        onClick={() => setPinnedExpanded((v) => !v)}
        className="cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4" />
          <span>Pinned</span>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              ({filteredPinnedChats.length})
            </span>
          )}
        </div>
        {pinnedExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </SidebarGroupLabel>

      {/* Vertical line below history icon */}
      {pinnedExpanded && (
        <div className="absolute left-6 top-9 bottom-0 w-px bg-canvas-line z-0" />
      )}

      <SidebarGroupContent
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          pinnedExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        <div className="ml-6">
          <SidebarMenu>
            {filteredPinnedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={currentChatId === chat.id}
                searchQuery={searchQuery}
                onDelete={onDeleteChat}
                onPin={onPinChat}
                onTitleUpdate={onTitleUpdate}
              />
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}