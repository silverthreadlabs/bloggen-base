'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, History, MessageSquare } from 'lucide-react';
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

  // Refs for the dynamic vertical line
  const lineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Keep the line in sync with the actual rendered content height
  useEffect(() => {
    if (!historyExpanded || !lineRef.current || !contentRef.current || !labelRef.current) {
      if (lineRef.current) lineRef.current.style.height = '0px';
      return;
    }

    const updateLine = () => {
      const labelRect = labelRef.current!.getBoundingClientRect();
      const contentRect = contentRef.current!.getBoundingClientRect();

      const height = contentRect.bottom - labelRect.bottom - 8; // small visual gap
      lineRef.current!.style.height = `${Math.max(0, height)}px`;
    };

    updateLine();

    const observer = new ResizeObserver(updateLine);
    observer.observe(contentRef.current);
    window.addEventListener('resize', updateLine);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLine);
    };
  }, [historyExpanded, groupedChats, showAllChats, searchQuery, isLoading]);

  // --------------------------------------------------------------
  // Properly typed memo that builds the (possibly limited) chat list
  // --------------------------------------------------------------
  const { limitedGroupedChats, totalChatCount, hasMoreChats } = useMemo(() => {
    const sortedEntries = Object.entries(groupedChats).sort(([periodA], [periodB]) => {
      const getPriorityAndDate = (period: string) => {
        if (period === 'Today') return { priority: 0, date: new Date() };
        if (period === 'Yesterday')
          return { priority: 1, date: new Date(Date.now() - 24 * 60 * 60 * 1000) };

        const monthDate = new Date(period + ' 1');
        return { priority: 2, date: monthDate };
      };

      const { priority: pa, date: da } = getPriorityAndDate(periodA);
      const { priority: pb, date: db } = getPriorityAndDate(periodB);

      if (pa !== pb) return pa - pb;
      return db.getTime() - da.getTime();
    });

    // Show everything when searching or when the user clicked “See all”
    if (showAllChats || searchQuery) {
      return {
        limitedGroupedChats: Object.fromEntries(sortedEntries) as Record<string, Chat[]>,
        totalChatCount: Object.values(groupedChats).flat().length,
        hasMoreChats: false,
      };
    }

    // Limit to CHAT_LIMIT items when collapsed
    let countSoFar = 0;
    const limited: Record<string, Chat[]> = {};

    for (const [period, chats] of sortedEntries) {
      if (countSoFar >= CHAT_LIMIT) break;

      const needed = CHAT_LIMIT - countSoFar;
      limited[period] = chats.slice(0, needed);
      countSoFar += limited[period].length;
    }

    const overallTotal = Object.values(groupedChats).flat().length;

    return {
      limitedGroupedChats: limited,
      totalChatCount: overallTotal,
      hasMoreChats: overallTotal > CHAT_LIMIT,
    };
  }, [groupedChats, showAllChats, searchQuery]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  if (isSessionPending) {
    return (
      <SidebarGroup className="flex-1 min-h-0 flex flex-col">
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
          className="absolute left-6 top-10 w-px bg-border z-0 pointer-events-none"
          style={{ height: 0 }} // controlled by useEffect
        />
      )}

      {/* Content area */}
      <SidebarGroupContent
        className={cn(
          'flex-1 min-h-0 overflow-hidden transition-all duration-200 ease-in-out',
          historyExpanded ? 'opacity-100' : 'opacity-0 h-0',
        )}
      >
        <div
          ref={contentRef}
          className={cn(
            'h-full overflow-y-auto ml-6 transition-opacity duration-200',
            historyExpanded ? 'opacity-100' : 'opacity-0',
          )}
        >
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
                  <div className="py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>{period}</span>
                    {searchQuery && (
                      <span className="text-xs">
                        {periodChats.length} {periodChats.length === 1 ? 'chat' : 'chats'}
                      </span>
                    )}
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

              {/* “See all” button */}
              {hasMoreChats && !searchQuery && (
                <div className="pb-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllChats((v) => !v)}
                    className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAllChats
                      ? 'Show less'
                      : `See all ${totalChatCount - CHAT_LIMIT} more`}
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