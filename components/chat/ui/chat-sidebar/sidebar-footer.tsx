'use client';

import { ChevronsLeft, ChevronsRight, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarFooter, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from '@/lib/auth/auth-client';
import { cn } from '@/lib/utils';
import { SettingsModal } from '@/components/settings/settings-modal';

type User = {
  name?: string | null;
  image?: string | null;
};

type SidebarFooterProps = {
  user?: User | null;
  isSessionPending: boolean;
  isGuestUser: boolean;
};

export function ChatSidebarFooter({
  user,
  isSessionPending,
  isGuestUser,
}: SidebarFooterProps) {
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  return (
    <>
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
                  'flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent transition-colors justify-center hover:cursor-pointer',
                  'group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center',
                )}
              >
                <Avatar className="h-8 w-8">
                  {isSessionPending ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <>
                      <AvatarImage
                        src={user?.image || undefined}
                        alt={user?.name || 'User'}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <span
                  className={cn(
                    'text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden',
                  )}
                >
                  {isSessionPending ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    user?.name || 'User'
                  )}
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
                  <DropdownMenuItem onClick={handleSettingsClick}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarMenuButton
            onClick={toggleSidebar}
            className={cn(
              'h-8 w-8 p-0 transition-all',
              'group-data-[collapsible=icon]:mt-2 flex justify-center items-center hover:cursor-pointer hover:bg-canvas-bg-hover',
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
      />
    </>
  );
}