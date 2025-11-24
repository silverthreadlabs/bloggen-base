'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Sidebar, SidebarContent, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { useSession } from '@/lib/auth/auth-client';
import {
    useChats,
    useCreateChat,
    useDeleteChat,
    useUpdateChatTitle,
} from '@/lib/hooks/chat';
import { useToggleChatPin } from '@/lib/hooks/chat/use-chat-pin';
import { cn } from '@/lib/utils';

import { ChatSidebarHeader } from './sidebar-header';
import { ChatSidebarFooter } from './sidebar-footer';
import { PinnedSection } from './pinned-section';
import { HistorySection } from './history-section';

type Props = {
    currentChatId?: string;
};

export function ChatSidebar({ currentChatId: initialChatId }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending: isSessionPending } = useSession();
    const isGuestUser = !session?.user;
    const { data: chats, isLoading } = useChats(!isGuestUser);
    const createChatMutation = useCreateChat();
    const deleteChatMutation = useDeleteChat();
    const updateTitleMutation = useUpdateChatTitle();
    const togglePin = useToggleChatPin();
    const { state } = useSidebar();

    const [searchQuery, setSearchQuery] = useState('');
    const [historyExpanded, setHistoryExpanded] = useState(true);
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

    const { pinnedChats, groupedChats, totalChats } = useMemo(() => {
        if (!chats)
            return {
                pinnedChats: [],
                groupedChats: {},
                totalChats: 0,
            };

        const searchTerm = deferredSearchQuery.toLowerCase().trim();

        const filtered = chats.filter((chat) => {
            if (!searchTerm) return true;
            // Search in both title and content if available
            return chat.title.toLowerCase().includes(searchTerm);
        });

        const pinned = filtered.filter((chat) => chat.pinned === true).map((chat) => ({
            ...chat,
            pinned: true,
        }));
        const unpinned = filtered.filter((chat) => chat.pinned !== true).map((chat) => ({
            ...chat,
            pinned: chat.pinned ?? false,
        }));

        // Group by time periods (Today, Yesterday, Month)
        const grouped: Record<string, typeof unpinned> = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        unpinned.forEach((chat) => {
            const chatDate = new Date(chat.createdAt);
            const chatDayStart = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
            
            let groupKey: string;
            
            if (chatDayStart.getTime() === today.getTime()) {
                groupKey = 'Today';
            } else if (chatDayStart.getTime() === yesterday.getTime()) {
                groupKey = 'Yesterday';
            } else {
                groupKey = chatDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                });
            }
            
            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }
            grouped[groupKey].push(chat);
        });

        return {
            pinnedChats: pinned,
            groupedChats: grouped,
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
        [deleteChatMutation, currentChatId, chats],
    );

    const handlePinChat = useCallback(
        async (chatId: string, pinned: boolean) => {
            await togglePin(chatId, pinned);
        },
        [togglePin],
    );

    const handleTitleUpdate = useCallback(
        (chatId: string, title: string) => {
            updateTitleMutation.mutate(
                { chatId, title },
                {
                    onSuccess: () => {
                        toast.success('Title updated');
                    },
                    onError: () => {
                        toast.error('Failed to update title');
                    },
                },
            );
        },
        [updateTitleMutation],
    );

    return (
        <Sidebar
            collapsible="icon"
            className="border-r max-w-72 h-screen flex flex-col"
        >
            <ChatSidebarHeader
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onNewChat={handleNewChat}
                isCreateChatPending={createChatMutation.isPending}
            />

            <SidebarContent className="flex-1 min-h-0">
                {/* Hide all content when collapsed */}
                <div
                    className={cn(
                        'group-data-[collapsible=icon]:hidden h-full flex flex-col',
                    )}
                >
                    <PinnedSection
                        pinnedChats={pinnedChats}
                        currentChatId={currentChatId}
                        searchQuery={deferredSearchQuery}
                        isLoading={isLoading}
                        onDeleteChat={handleDeleteChat}
                        onPinChat={handlePinChat}
                        onTitleUpdate={handleTitleUpdate}
                    />

                    <HistorySection
                        groupedChats={groupedChats}
                        currentChatId={currentChatId}
                        searchQuery={deferredSearchQuery}
                        isLoading={isLoading}
                        isSessionPending={isSessionPending}
                        isGuestUser={isGuestUser}
                        historyExpanded={historyExpanded}
                        onHistoryToggle={() => setHistoryExpanded(!historyExpanded)}
                        onDeleteChat={handleDeleteChat}
                        onPinChat={handlePinChat}
                        onTitleUpdate={handleTitleUpdate}
                        totalChats={totalChats}
                        pinnedChatsCount={pinnedChats.length}
                    />
                </div>
            </SidebarContent>

            <ChatSidebarFooter
                user={session?.user}
                isSessionPending={isSessionPending}
                isGuestUser={isGuestUser}
            />
            <SidebarRail />
        </Sidebar>
    );
}
