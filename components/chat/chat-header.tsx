import { Button } from '@/components/ui/button';
import { SquarePen, Share2, MoreVertical, Pin, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  title = 'AI Assistant', 
  chatId,
  pinned = false,
  onNewChatAction,
  onDeleteChat,
  onPinChat,
  onUpdateTitle 
}: ChatHeaderProps) {
  const isNewChat = !chatId || title === 'New Chat';
  
  const handleShare = () => {
    if (chatId && navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      });
    } else if (chatId) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 shrink-0 w-full">
      <div className="flex items-center gap-2 flex-1">
        {/* Empty space for logo if needed */}
      </div>

      <div className="flex items-center gap-2">
        {!isNewChat && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onPinChat && (
                  <DropdownMenuItem
                    onClick={() => onPinChat(!pinned)}
                  >
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
              className="h-8 gap-2"
            >
              <Share2 className="h-4 w-4" />
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
          >
            <SquarePen className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNewChatAction}
            className="h-8 w-8 p-0"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
