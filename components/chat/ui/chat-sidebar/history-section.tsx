'use client';

import { useState, useMemo } from 'react';
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

  // Calculate limited chats and total count
  const { limitedGroupedChats, totalChatCount, hasMoreChats } = useMemo(() => {
    const sortedEntries = Object.entries(groupedChats)
      .sort(([periodA], [periodB]) => {
        // Sort order: Today -> Yesterday -> Months (newest first)
        const getPriorityAndDate = (period: string) => {
          if (period === 'Today') return { priority: 0, date: new Date() };
          if (period === 'Yesterday') return { priority: 1, date: new Date(Date.now() - 24 * 60 * 60 * 1000) };
          
          // For months, parse the date and give it lower priority
          const monthDate = new Date(period + ' 1'); // Add day to make it parseable
          return { priority: 2, date: monthDate };
        };
        
        const { priority: priorityA, date: dateA } = getPriorityAndDate(periodA);
        const { priority: priorityB, date: dateB } = getPriorityAndDate(periodB);
        
        // First sort by priority (Today, Yesterday, then months)
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority (both months), sort by date descending (newest first)
        return dateB.getTime() - dateA.getTime();
      });

    if (showAllChats || searchQuery) {
      // Show all chats when expanded or searching
      const limited = Object.fromEntries(sortedEntries);
      const total = Object.values(groupedChats).flat().length;
      return { limitedGroupedChats: limited, totalChatCount: total, hasMoreChats: false };
    }

    // Limit chats when collapsed
    let currentCount = 0;
    const limited: Record<string, Chat[]> = {};
    let totalCount = 0;

    for (const [period, chats] of sortedEntries) {
      totalCount += chats.length;
      
      if (currentCount >= CHAT_LIMIT) {
        break;
      }

      const remainingSlots = CHAT_LIMIT - currentCount;
      if (chats.length <= remainingSlots) {
        // Include all chats from this period
        limited[period] = chats;
        currentCount += chats.length;
      } else {
        // Include only some chats from this period
        limited[period] = chats.slice(0, remainingSlots);
        currentCount = CHAT_LIMIT;
      }
    }

    return {
      limitedGroupedChats: limited,
      totalChatCount: totalCount,
      hasMoreChats: totalCount > CHAT_LIMIT
    };
  }, [groupedChats, showAllChats, searchQuery]);
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
      <SidebarGroupLabel
        onClick={onHistoryToggle}
        className="cursor-pointer flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-2 relative">
          <History className="h-4 w-4 relative z-10" />
          <span>History</span>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              ({totalChats - pinnedChatsCount} results)
            </span>
          )}
        </div>
        {historyExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </SidebarGroupLabel>
      
      {/* Vertical line below history icon */}
      {historyExpanded && (
        <div className="absolute left-2 top-8 bottom-0 w-px bg-canvas-line z-0" />
      )}
      
      <SidebarGroupContent
        className={cn(
          'flex-1 min-h-0 overflow-hidden transition-all duration-200 ease-in-out relative',
          historyExpanded ? 'opacity-100' : 'opacity-0',
        )}
      >

        <div
          className={cn(
            'h-full transition-transform duration-200 ease-in-out overflow-y-auto ml-6',
            historyExpanded ? 'translate-y-0' : '-translate-y-2',
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
          ) : Object.entries(limitedGroupedChats).length === 0 ? (
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
                        {periodChats.length}{' '}
                        {periodChats.length === 1 ? 'chat' : 'chats'}
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
              
              {hasMoreChats && !searchQuery && (
                <div className="pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    color="neutral"
                    onClick={() => setShowAllChats(!showAllChats)}
                    fullWidth
                    // className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAllChats ? 'Show less' : `See all`}
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