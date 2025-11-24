'use client';

import { Pin } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
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
  if (isLoading) {
    return (
      <SidebarGroup className="shrink-0">
        <SidebarGroupLabel>
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            <span>Pinned</span>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {[...Array(2)].map((_, i) => (
              <SidebarMenuItem key={i}>
                <Skeleton className="h-8 w-full mb-2" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (pinnedChats.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="shrink-0">
      <SidebarGroupLabel>
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4" />
          <span>Pinned</span>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              ({pinnedChats.length})
            </span>
          )}
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {pinnedChats.map((chat) => (
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
      </SidebarGroupContent>
    </SidebarGroup>
  );
}