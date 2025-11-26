'use client';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { Pin, ChevronDown, ChevronRight } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  const [pinnedExpanded, setPinnedExpanded] = useState(true); // default open like History

  // Refs for dynamic line
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const listWrapperRef = useRef<HTMLDivElement>(null);

  // Filter pinned chats based on search (optional, but consistent with History)
  const filteredPinnedChats = useMemo(() => {
    if (!searchQuery) return pinnedChats;
    return pinnedChats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pinnedChats, searchQuery]);

  // Dynamic vertical line — exactly like HistorySection
  useLayoutEffect(() => {
    if (
      !pinnedExpanded ||
      !lineRef.current ||
      !labelRef.current ||
      !listWrapperRef.current
    ) {
      if (lineRef.current) lineRef.current.style.height = '0px';
      return;
    }

    const updateLine = () => {
      const labelBottom = labelRef.current!.getBoundingClientRect().bottom;
      const listBottom = listWrapperRef.current!.getBoundingClientRect().bottom;
      const height = listBottom - labelBottom - 12;
      lineRef.current!.style.height = `${Math.max(0, height)}px`;
    };

    updateLine();
    const observer = new ResizeObserver(updateLine);
    observer.observe(listWrapperRef.current!);
    window.addEventListener('resize', updateLine);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLine);
    };
  }, [pinnedExpanded, filteredPinnedChats, searchQuery]);

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
    <SidebarGroup className="flex flex-col relative">
      {/* Collapsible Header */}
      <SidebarGroupLabel
        ref={labelRef}
        onClick={() => setPinnedExpanded(v => !v)}
        className="cursor-pointer flex items-center justify-between shrink-0"
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

      {/* Dynamic vertical line */}
      {pinnedExpanded && filteredPinnedChats.length > 0 && (
        <div
          ref={lineRef}
          className="absolute left-6 top-10 w-px bg-canvas-border z-0 pointer-events-none"
          style={{ height: 0 }}
        />
      )}

      {/* Content with smooth collapse */}
      <SidebarGroupContent
        className={cn(
          'overflow-hidden transition-all duration-200',
          pinnedExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        <div ref={listWrapperRef} className="ml-6">
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