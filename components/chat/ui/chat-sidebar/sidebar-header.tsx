'use client';

import { Plus, Search } from 'lucide-react';
import Image from 'next/image';
import { LogoDark } from '@/components/logo/logo';
import { SidebarHeader, SidebarInput, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type SidebarHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  isCreateChatPending: boolean;
};

export function ChatSidebarHeader({
  searchQuery,
  onSearchChange,
  onNewChat,
  isCreateChatPending,
}: SidebarHeaderProps) {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarHeader className="p-2 shrink-0">
      {/* Logo/Brand - Show only icon when collapsed */}
      <div className="flex items-center justify-center mb-2">
        <div
          className={cn(
            'flex items-center justify-center rounded-lg bg-primary/10 transition-all px-2 py-1.5',
            'group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0',
          )}
        >
          <span
            className={cn(
              'text-lg font-bold transition-all whitespace-nowrap',
              'group-data-[collapsible=icon]:text-base',
            )}
          >
            {isCollapsed ? (
              <Image
                src="/favicon/icon-512.png"
                alt="Bloggen Logo"
                width={32}
                height={32}
              />
            ) : (
              <LogoDark className="" />
            )}
          </span>
        </div>
      </div>

      {/* Search - Show icon button when collapsed, input when expanded */}
      <div className={cn('group-data-[collapsible=icon]:hidden')}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <SidebarInput
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'pl-8 pr-12 transition-colors',
              searchQuery && 'ring-1 ring-primary/20',
            )}
          />
        </div>
      </div>

      {/* Search Icon Button - Show when collapsed */}
      <SidebarMenuButton
        onClick={() => {
          toggleSidebar();
          setTimeout(() => {
            const searchInput = document.querySelector(
              '[data-sidebar="input"]',
            ) as HTMLInputElement;
            searchInput?.focus();
          }, 200);
        }}
        tooltip="Search"
        className={cn('w-full hidden group-data-[collapsible=icon]:flex')}
      >
        <Search className="h-4 w-4" />
      </SidebarMenuButton>

      {/* New Chat Button */}
      <SidebarMenuButton
        onClick={onNewChat}
        disabled={isCreateChatPending}
        className="w-full mt-2 hover:bg-canvas-bg-hover hover:cursor-pointer"
        tooltip="New Chat"
      >
        <Plus className="h-4 w-4" />
        <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
      </SidebarMenuButton>
    </SidebarHeader>
  );
}