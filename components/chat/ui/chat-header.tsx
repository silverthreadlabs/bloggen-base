import { MoreVertical, Pin, Share2, SquarePen, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type ChatHeaderProps = {
  title?: string;
  chatId?: string;
  pinned?: boolean;
  isNewChat?: boolean;
  isGuestUser?: boolean;
  isSessionPending?: boolean;
  isLoadingChat?: boolean;
  onNewChatAction: () => void;
  onDeleteChat?: () => void;
  onPinChat?: (pinned: boolean) => void;
  onUpdateTitle?: (title: string) => void;
  isPublic?: boolean;
  isReadOnly?: boolean;
  onMakePublic?: () => Promise<void>;
};

export function ChatHeader({
  title = 'New Chat',
  chatId,
  pinned = false,
  isNewChat = true,
  isGuestUser = false,
  isSessionPending = false,
  isLoadingChat = false,
  onNewChatAction,
  onDeleteChat,
  onPinChat,
  onUpdateTitle,
  isPublic = false,
  isReadOnly = false,
  onMakePublic,
}: ChatHeaderProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleShare = async () => {
    if (!chatId) return;
    if (!isPublic && onMakePublic) {
      await onMakePublic();
    }
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };


  return (
    <div className="flex items-center justify-between md:px-4 py-3 shrink-0 w-full gap-2">
      <div className="flex items-center gap-2 flex-1">
        {isMobile && <SidebarTrigger className="h-6 w-6" />}
        {isSessionPending || isLoadingChat ? (
          <Skeleton className="h-6 w-32 rounded" />
        ) : (
          <h1 className="text-lg font-bold line-clamp-2">{title}</h1>
        )}
        {isSessionPending || isLoadingChat ? (
          <Skeleton className="h-5 w-16 rounded" />
        ) : (
          isGuestUser && (
            <Badge variant="secondary" className="text-xs">
              Guest Chat
            </Badge>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSessionPending || isLoadingChat ? (
          <Skeleton className="h-8 w-20 rounded" />
        ) : (
          isGuestUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/sign-in')}
            >
              Login
            </Button>
          )
        )}

        {!isNewChat && !isGuestUser && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  leadingIcon={<MoreVertical className="h-4 w-4" />}
                  className="h-8 w-8 p-0"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onPinChat && (
                  <DropdownMenuItem onClick={() => onPinChat(!pinned)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {onDeleteChat && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onDeleteChat}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              leadingIcon={<Share2 className="h-4 w-4" />}
            >
              <span>Share</span>
            </Button>
          </>
        )}

        {isNewChat ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChatAction}
            className="h-8 gap-2"
            leadingIcon={<SquarePen className="h-4 w-4" />}
          >
            <span>New Chat</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChatAction}
            className="h-8 w-8 p-0"
            iconOnly
            leadingIcon={<SquarePen className="h-4 w-4" />}
          />
        )}
      </div>
    </div>
  );
}