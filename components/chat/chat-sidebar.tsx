'use client';

import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  History, 
  ChevronDown, 
  ChevronRight,
  MoreVertical,
  Edit2,
  Pin,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  HelpCircle,
  Crown,
  LogOut,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChats, useCreateChat, useDeleteChat, useUpdateChatTitle } from '@/lib/hooks/chat';
import { useToggleChatPin, useChatPinStore } from '@/lib/stores/chat-pin-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, signOut } from '@/lib/auth/auth-client';

type Props = {
  currentChatId?: string;
};

export function ChatSidebar({ currentChatId }: Props) {
  const router = useRouter();
  const { data: chats, isLoading } = useChats();
  const { data: session } = useSession();
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateTitleMutation = useUpdateChatTitle();
  const togglePin = useToggleChatPin();
  const { toggleSidebar, state } = useSidebar();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Get optimistic pins and methods from Zustand store for reactivity
  // Subscribing to optimisticPins ensures re-renders when pin status changes
  const optimisticPins = useChatPinStore((state) => state.optimisticPins);
  const getPinStatus = useChatPinStore((state) => state.getPinStatus);
  const queryClient = useQueryClient();

  // Group chats by month and separate pinned
  const { pinnedChats, groupedChats } = useMemo(() => {
    if (!chats) return { pinnedChats: [], groupedChats: {} };

    const filtered = chats.filter((chat) => {
      if (!searchQuery) return true;
      return chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Use Zustand store for pin status (optimistic)
    const pinned = filtered.filter((chat) => {
      // Check optimistic state first, then fallback to chat.pinned
      if (chat.id in optimisticPins) {
        return optimisticPins[chat.id];
      }
      return chat.pinned;
    });
    const unpinned = filtered.filter((chat) => {
      // Check optimistic state first, then fallback to chat.pinned
      if (chat.id in optimisticPins) {
        return !optimisticPins[chat.id];
      }
      return !chat.pinned;
    });

    // Group by month
    const grouped: Record<string, typeof unpinned> = {};
    unpinned.forEach((chat) => {
      const date = new Date(chat.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(chat);
    });

    return { pinnedChats: pinned, groupedChats: grouped };
  }, [chats, searchQuery, optimisticPins]);

  const handleNewChat = useCallback(() => {
    // Navigate to /chat without creating a chat immediately
    // Chat will be created when first message is sent
    router.push('/chat');
  }, [router]);

  const handleDeleteChat = useCallback((chatId: string) => {
    if (!confirm('Delete this chat?')) return;

    // Find the next chat to navigate to before deleting
    let nextChatId: string | undefined;
    if (chats && chats.length > 0) {
      const currentIndex = chats.findIndex(chat => chat.id === chatId);
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
        if (currentChatId === chatId) {
          // Navigate to next chat if available, otherwise to /chat
          if (nextChatId) {
            router.replace(`/chat/${nextChatId}`);
          } else {
            router.replace('/chat');
          }
        }
        toast.success('Chat deleted');
      },
      onError: () => {
        toast.error('Failed to delete chat');
      },
    });
  }, [deleteChatMutation, currentChatId, router, chats]);

  const handlePinChat = useCallback(async (chatId: string, pinned: boolean) => {
    await togglePin(chatId, pinned);
  }, [togglePin]);

  const startEditing = useCallback((chatId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chatId);
    setEditTitle(title);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const saveTitle = useCallback((chatId: string) => {
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
  }, [editTitle, updateTitleMutation, cancelEditing]);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input
        const searchInput = document.querySelector('[data-sidebar="input"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderChatItem = (chat: NonNullable<typeof chats>[number]) => {
    const isActive = currentChatId === chat.id;
    const isEditing = editingId === chat.id;

    return (
      <SidebarMenuItem key={chat.id}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => router.replace(`/chat/${chat.id}`)}
          className="group/menu-item"
        >
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
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
            </div>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">{chat.title}</span>
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
                  const currentPinned = getPinStatus(chat.id, queryClient);
                  handlePinChat(chat.id, !currentPinned);
                }}
              >
                <Pin className="h-4 w-4 mr-2" />
                {(() => {
                  const isPinned = chat.id in optimisticPins
                    ? optimisticPins[chat.id]
                    : chat.pinned;
                  return isPinned ? 'Unpin' : 'Pin';
                })()}
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
    <Sidebar collapsible="icon" className="border-r max-w-72">
      <SidebarHeader className="p-2">
        {/* Logo/Brand - Show only icon when collapsed */}
        <div className="flex items-center justify-center mb-2">
          <div className={cn(
            "flex items-center justify-center rounded-lg bg-primary/10 transition-all px-2 py-1.5",
            "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
          )}>
            <span className={cn(
              "text-lg font-bold transition-all whitespace-nowrap",
              "group-data-[collapsible=icon]:text-base"
            )}>
              {isCollapsed ? "B" : "Bloggen Chatbot"}
            </span>
          </div>
        </div>

        {/* Search - Show icon button when collapsed, input when expanded */}
        <div className={cn(
          "group-data-[collapsible=icon]:hidden"
        )}>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-16"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Ctrl+K
            </div>
          </div>
        </div>

        {/* Search Icon Button - Show when collapsed */}
        <SidebarMenuButton
          onClick={() => {
            toggleSidebar();
            setTimeout(() => {
              const searchInput = document.querySelector('[data-sidebar="input"]') as HTMLInputElement;
              searchInput?.focus();
            }, 200);
          }}
          tooltip="Search"
          className={cn(
            "w-full hidden group-data-[collapsible=icon]:flex"
          )}
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

      <SidebarContent>
        {/* Hide all content when collapsed */}
        <div className={cn(
          "group-data-[collapsible=icon]:hidden"
        )}>
          {/* Pinned Section */}
          {!isLoading && pinnedChats.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  <span>Pinned</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedChats.map(renderChatItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* History Section */}
          <SidebarGroup>
            <SidebarGroupLabel
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>History</span>
              </div>
              {historyExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </SidebarGroupLabel>
            {historyExpanded && (
              <SidebarGroupContent>
                {isLoading ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Loading...
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedChats).length > 0 ? (
                      Object.entries(groupedChats).map(([month, monthChats]) => (
                        <div key={month} className="mb-4">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            {month}
                          </div>
                          <SidebarMenu>
                            {monthChats.map(renderChatItem)}
                          </SidebarMenu>
                        </div>
                      ))
                    ) : (
                      !searchQuery && (
                        <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No chats yet</p>
                          <p className="text-xs">Create one to get started</p>
                        </div>
                      )
                    )}
                    
                    {searchQuery && Object.keys(groupedChats).length === 0 && (
                      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                        No chats found
                      </div>
                    )}
                  </>
                )}
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        </div>

      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className={cn(
          "flex items-center gap-2 w-full justify-between",
          "group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent transition-colors",
                "group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              )}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden"
                )}>
                  {session?.user?.name || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/upgrade')}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarMenuButton
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 p-0 transition-all",
              "group-data-[collapsible=icon]:mt-2"
            )}
            tooltip={state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar'}
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
