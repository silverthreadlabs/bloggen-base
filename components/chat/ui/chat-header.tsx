import { MoreVertical, Pin, Share2, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

type ChatHeaderProps = {
  title?: string;
  chatId?: string;
  pinned?: boolean;
  onNewChatAction: () => void;
  onDeleteChat?: () => void;
  onPinChat?: (pinned: boolean) => void;
  onUpdateTitle?: (title: string) => void;
};

export function ChatHeader({
  title = 'New Chat',
  chatId,
  pinned = false,
  onNewChatAction,
  onDeleteChat,
  onPinChat,
  onUpdateTitle,
}: ChatHeaderProps) {
  const { isMobile } = useSidebar();
  // If chatId exists, it's not a new chat (regardless of title)
  // Title might be "New Chat" temporarily even after chat is created
  const isNewChat = !chatId;

  const handleShare = () => {
    if (chatId && navigator.share) {
      navigator
        .share({
          title: title,
          url: window.location.href,
        })
        .catch(() => {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(window.location.href);
        });
    } else if (chatId) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 shrink-0 w-full">
      <div className="flex items-center gap-2 flex-1">
        {isMobile && (
          <SidebarTrigger className="h-6 w-6 p-0" />
        )}
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {!isNewChat && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" iconOnly leadingIcon={<MoreVertical className="h-4 w-4" />} className="h-8 w-8 p-0" />
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
