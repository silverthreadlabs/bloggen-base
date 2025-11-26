'use client';

import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { ChevronDown, ChevronRight, History, MessageSquare, MoreHorizontal } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatItem } from './chat-item';

type Chat = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: Date;
};

type HistorySectionProps = {
  groupedChats: Record<string, Chat[]>;
  currentChatId?: string;
  searchQuery: string;
  isLoading: boolean;
  isSessionPending: boolean;
  isGuestUser: boolean;
  historyExpanded: boolean;
  onHistoryToggle: () => void;
  onDeleteChat: (chatId: string) => void;
  onPinChat: (chatId: string, pinned: boolean) => void;
  onTitleUpdate: (chatId: string, title: string) => void;
  totalChats: number;
  pinnedChatsCount: number;
};

export function HistorySection({
  groupedChats,
  currentChatId,
  searchQuery,
  isLoading,
  isSessionPending,
  isGuestUser,
  historyExpanded,
  onHistoryToggle,
  onDeleteChat,
  onPinChat,
  onTitleUpdate,
  totalChats,
  pinnedChatsCount,
}: HistorySectionProps) {
  const [showAllChats, setShowAllChats] = useState(false);
  const CHAT_LIMIT = 10;

  // Refs
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const listWrapperRef = useRef<HTMLDivElement>(null);

  // Calculate limited chats and total count
  const {
    limitedGroupedChats,
    totalChatCount,
    hasMoreChats,
  } = useMemo(() => {
    const sorted = Object.entries(groupedChats).sort(([a], [b]) => {
      const order = ['Today', 'Yesterday'];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b.localeCompare(a);
    });

    if (showAllChats || searchQuery) {
      return {
        limitedGroupedChats: Object.fromEntries(sorted) as Record<string, Chat[]>,
        totalChatCount: Object.values(groupedChats).flat().length,
        hasMoreChats: false,
      };
    }

    let count = 0;
    const limited: Record<string, Chat[]> = {};

    for (const [period, chats] of sorted) {
      if (count >= CHAT_LIMIT) break;
      const take = Math.min(chats.length, CHAT_LIMIT - count);
      limited[period] = chats.slice(0, take);
      count += take;
    }

    const total = Object.values(groupedChats).flat().length;

    return {
      limitedGroupedChats: limited,
      totalChatCount: total,
      hasMoreChats: total > CHAT_LIMIT,
    };
  }, [groupedChats, showAllChats, searchQuery]);

  // Dynamic vertical line — perfectly matches the *rendered* list
  useLayoutEffect(() => {
    if (
      !historyExpanded ||
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
    observer.observe(listWrapperRef.current);
    window.addEventListener('resize', updateLine);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLine);
    };
  }, [
    historyExpanded,
    limitedGroupedChats,
    showAllChats,
    searchQuery,
    isLoading,
  ]);

  // Render
  if (isSessionPending) {
    return (
      <SidebarGroup className="flex-1 min-h-0 flex flex-col w-[286px]">
        <SidebarGroupLabel className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>History</span>
        </SidebarGroupLabel>
        <SidebarGroupContent className="relative">
          <div className="ml-6">
            <SidebarMenu>
              {[...Array(4)].map((_, i) => (
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

  if (isGuestUser) {
    return (
      <SidebarGroup className="flex-1 min-h-0 flex flex-col">
        <SidebarGroupLabel className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>History</span>
        </SidebarGroupLabel>
        <SidebarGroupContent className="relative">
          <div className="ml-6">
            <div className="py-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Login to see history</p>
              <p className="text-xs">Your chats will be saved when you log in</p>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="flex-1 min-h-0 flex flex-col relative">
      {/* Header */}
      <SidebarGroupLabel
        ref={labelRef}
        onClick={onHistoryToggle}
        className="cursor-pointer flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>History</span>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              ({totalChats - pinnedChatsCount} results)
            </span>
          )}
        </div>
        {historyExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </SidebarGroupLabel>

      {/* Dynamic vertical line */}
      {historyExpanded && (
        <div
          ref={lineRef}
          className="absolute left-6 top-10 w-px bg-canvas-border z-0 pointer-events-none"
          style={{ height: 0 }}
        />
      )}

      <SidebarGroupContent
        className={cn(
          'flex-1 min-h-0 overflow-hidden transition-all duration-200',
          historyExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        {/* This div contains ONLY the actual list (no flex-fill) */}
        <div ref={listWrapperRef} className="ml-6 overflow-y-auto">
          {isLoading ? (
            <SidebarMenu>
              {[...Array(4)].map((_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-8 w-full mb-2" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : Object.keys(limitedGroupedChats).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-xs">Create one to get started</p>
            </div>
          ) : (
            <>
              {Object.entries(limitedGroupedChats).map(([period, periodChats]) => (
                <div key={period} className="mb-4">
                  <div className="py-1 text-xs font-medium text-muted-foreground">
                    {period}
                    {searchQuery && ` · ${periodChats.length}`}
                  </div>

                  <SidebarMenu>
                    {periodChats.map((chat) => (
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
              ))}

              {/* Show more button */}
              {hasMoreChats && !searchQuery && (
                <div className="pt-2 pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllChats(v => !v)}
                    className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAllChats
                      ? 'Show less'
                      : `Show all ${totalChatCount - CHAT_LIMIT} more`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}