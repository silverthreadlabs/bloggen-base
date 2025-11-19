'use client';

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Edit2,
  HelpCircle,
  History,
  LogOut,
  MessageSquare,
  MoreVertical,
  Pin,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoDark, LogoLight } from '@/components/logo/logo';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { signOut, useSession } from '@/lib/auth/auth-client';
import {
  useChats,
  useCreateChat,
  useDeleteChat,
  useUpdateChatTitle,
} from '@/lib/hooks/chat';
import {
  useChatPinStatus,
  useToggleChatPin,
} from '@/lib/hooks/chat/use-chat-pin';
import { cn } from '@/lib/utils';

type Props = {
  currentChatId?: string;
};

export function ChatSidebar({ currentChatId: initialChatId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isGuestUser = !session?.user;
  const { data: chats, isLoading } = useChats(!isGuestUser);
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateTitleMutation = useUpdateChatTitle();
  const togglePin = useToggleChatPin();
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();

  const [searchQuery, setSearchQuery] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = useState('');
  // Extract current chat ID from pathname, fallback to prop
  const currentChatId = useMemo(() => {
    const match = pathname?.match(/\/chat\/([^/?]+)/);
    return match ? match[1] : initialChatId;
  }, [pathname, initialChatId]);

  // Debounced search for better performance
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Immediate UI update for optimistic feel
    setDeferredSearchQuery(value);
  }, []);

  // Clear search handler
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDeferredSearchQuery('');
  }, []);

  // Group chats by month and separate pinned
  // React Query's optimistic updates automatically update the cache,
  // so we can directly use chat.pinned from the cached data
  const { pinnedChats, groupedChats, hasResults, totalChats } = useMemo(() => {
    if (!chats)
      return {
        pinnedChats: [],
        groupedChats: {},
        hasResults: false,
        totalChats: 0,
      };


    const searchTerm = deferredSearchQuery.toLowerCase().trim();
    
    const filtered = chats.filter((chat) => {
      if (!searchTerm) return true;
      // Search in both title and content if available
      return chat.title.toLowerCase().includes(searchTerm);
    });

    // Filter pinned and unpinned chats
    // React Query mutations update the cache optimistically, so chat.pinned
    // will reflect the current state including pending optimistic updates
    const pinned = filtered.filter((chat) => chat.pinned);
    const unpinned = filtered.filter((chat) => !chat.pinned);

    // Group by month
    const grouped: Record<string, typeof unpinned> = {};
    unpinned.forEach((chat) => {
      const date = new Date(chat.createdAt);
      const monthKey = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(chat);
    });

    const hasResults = pinned.length > 0 || Object.keys(grouped).length > 0;

    return {
      pinnedChats: pinned,
      groupedChats: grouped,
      hasResults,
      totalChats: filtered.length,
    };
  }, [chats, deferredSearchQuery]);

  const handleNewChat = useCallback(() => {
    // Navigate to /chat without creating a chat immediately
    // Chat will be created when first message is sent
    router.push('/chat');
    router.refresh();
  }, [router]);

  const handleDeleteChat = useCallback(
    (chatId: string) => {
      if (!confirm('Delete this chat?')) return;

      // Find the next chat to navigate to before deleting
      let nextChatId: string | undefined;
      if (chats && chats.length > 0) {
        const currentIndex = chats.findIndex((chat) => chat.id === chatId);
        if (currentIndex !== -1) {
          // Try to find next chat (after current)
          if (currentIndex < chats.length - 1) {
            nextChatId = chats[currentIndex + 1].id;
          }
          // Otherwise try previous chat (before current)
          else if (currentIndex > 0) {
            nextChatId = chats[currentIndex - 1].id;
          }
        }
      }

      deleteChatMutation.mutate(chatId, {
        onSuccess: () => {
          toast.success('Chat deleted');

          // Only navigate if we're deleting the currently active chat
          if (currentChatId === chatId) {
            window.location.href = nextChatId ? `/chat/${nextChatId}` : '/chat';
          }
        },
        onError: () => {
          toast.error('Failed to delete chat');
        },
      });
    },
    [deleteChatMutation, currentChatId, router, chats],
  );

  const handlePinChat = useCallback(
    async (chatId: string, pinned: boolean) => {
      await togglePin(chatId, pinned);
    },
    [togglePin],
  );

  const startEditing = useCallback(
    (chatId: string, title: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(chatId);
      setEditTitle(title);
    },
    [],
  );

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const saveTitle = useCallback(
    (chatId: string) => {
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
        },
      );
    },
    [editTitle, updateTitleMutation, cancelEditing],
  );

  // Keyboard shortcut for search (Ctrl+K)
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
  //       e.preventDefault();
  //       // Focus search input
  //       const searchInput = document.querySelector(
  //         '[data-sidebar="input"]',
  //       ) as HTMLInputElement;
  //       searchInput?.focus();
  //       searchInput?.select();
  //     }
  //     // ESC to clear search when search input is focused
  //     if (e.key === 'Escape' && searchQuery) {
  //       const activeElement = document.activeElement;
  //       if (activeElement?.getAttribute('data-sidebar') === 'input') {
  //         clearSearch();
  //       }
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [searchQuery, clearSearch]);

  const renderChatItem = (chat: NonNullable<typeof chats>[number]) => {
    const isActive = currentChatId === chat.id;
    const isEditing = editingId === chat.id;

    // Highlight search terms in title
    const highlightTitle = (title: string) => {
      if (!deferredSearchQuery) return title;

      const searchTerm = deferredSearchQuery.toLowerCase();
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

    return (
      <SidebarMenuItem key={chat.id}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => router.replace(`/chat/${chat.id}`)}
          className={cn(
            'group/menu-item',
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveTitle(chat.id);
                  } else if (e.key === 'Escape') {
                    cancelEditing();
                  }
                }}
                className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => saveTitle(chat.id)}
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
        </SidebarMenuButton>
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreVertical className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinChat(chat.id, !chat.pinned);
                }}
              >
                <Pin className="h-4 w-4 mr-2" />
                {chat.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => startEditing(chat.id, chat.title, e)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    );
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      className="border-r max-w-72 h-screen flex flex-col"
    >
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(
                'pl-8 pr-12 transition-colors',
                searchQuery && 'ring-1 ring-primary/20',
              )}
            />
            {/* <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="text-xs text-muted-foreground">
                Ctrl+K
              </div>
            </div> */}
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
          onClick={handleNewChat}
          disabled={createChatMutation.isPending}
          className="w-full mt-2"
          tooltip="New Chat"
        >
          <Plus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent className="flex-1 min-h-0">
        {/* Hide all content when collapsed */}
        <div
          className={cn(
            'group-data-[collapsible=icon]:hidden h-full flex flex-col',
          )}
        >
          {/* Pinned Section */}
          {!isLoading && pinnedChats.length > 0 && (
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
                <SidebarMenu>{pinnedChats.map(renderChatItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* History Section */}
          <SidebarGroup className="flex-1 min-h-0 flex flex-col">
            {isGuestUser ? (
              <>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>History</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Login to see history</p>
                    <p className="text-xs">
                      Your chats will be saved when you log in
                    </p>
                  </div>
                </SidebarGroupContent>
              </>
            ) : (
              <>
                <SidebarGroupLabel
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="cursor-pointer flex items-center justify-between shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span>History</span>
                    {searchQuery && (
                      <span className="text-xs text-muted-foreground">
                        ({totalChats - pinnedChats.length} results)
                      </span>
                    )}
                  </div>
                  {historyExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent
                  className={cn(
                    'flex-1 min-h-0 overflow-hidden transition-all duration-200 ease-in-out',
                    historyExpanded ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <div
                    className={cn(
                      'h-full transition-transform duration-200 ease-in-out overflow-y-auto',
                      historyExpanded ? 'translate-y-0' : '-translate-y-2',
                    )}
                  >
                    {isLoading ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Loading...
                      </div>
                    ) : (
                      <div className="min-h-full flex flex-col">
                        {Object.entries(groupedChats).length > 0 ? (
                          <div className="flex-1">
                            {Object.entries(groupedChats).map(
                              ([month, monthChats]) => (
                                <div key={month} className="mb-4">
                                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                                    <span>{month}</span>
                                    {searchQuery && (
                                      <span className="text-xs">
                                        {monthChats.length}{' '}
                                        {monthChats.length === 1
                                          ? 'chat'
                                          : 'chats'}
                                      </span>
                                    )}
                                  </div>
                                  <SidebarMenu>
                                    {monthChats.map(renderChatItem)}
                                  </SidebarMenu>
                                </div>
                              ),
                            )}
                          </div>
                        ) : !searchQuery && !isLoading ? (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No chats yet</p>
                              <p className="text-xs">
                                Create one to get started
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {searchQuery && !hasResults && !isLoading && (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No chats found</p>
                              {/* <p className="text-xs">
                            Try a different search term
                          </p>
                          <button
                            onClick={clearSearch}
                            className="mt-2 text-xs text-primary hover:underline"
                            type="button"
                          >
                            Clear search
                          </button> */}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-2 shrink-0">
        <div
          className={cn(
            'flex items-center gap-2 w-full justify-between',
            'group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center',
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent transiti</SidebarFooter>on-colors',
                  'group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center',
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt={session?.user?.name || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden',
                  )}
                >
                  {session?.user?.name || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isGuestUser ? (
                <DropdownMenuItem onClick={() => router.push('/sign-in')}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Login
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => router.push('/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/upgrade')}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </DropdownMenuItem> */}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={async () => {
                      await signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push('/');
                          },
                        },
                      });
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarMenuButton
            onClick={toggleSidebar}
            className={cn(
              'h-8 w-8 p-0 transition-all',
              'group-data-[collapsible=icon]:mt-2',
            )}
            tooltip={
              state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
