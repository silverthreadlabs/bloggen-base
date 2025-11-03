import { Button } from '@/components/ui/button';
import { SparklesIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

type ChatHeaderProps = {
  title?: string;
  onNewChatAction: () => void;
  onDeleteChat?: () => void;
  onUpdateTitle?: (title: string) => void;
};

export function ChatHeader({ 
  title = 'AI Assistant', 
  onNewChatAction,
  onDeleteChat,
  onUpdateTitle 
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && onUpdateTitle) {
      onUpdateTitle(editedTitle.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-canvas-border bg-canvas-bg px-6 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary-solid">
          <SparklesIcon className="size-5 text-primary-text-contrast" />
        </div>
        <div>
          {isEditing && onUpdateTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditedTitle(title);
                }
              }}
              className="text-base font-semibold bg-transparent border-b border-primary focus:outline-none text-canvas-text-contrast"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-base font-semibold text-canvas-text-contrast cursor-pointer hover:text-primary text-left"
              onClick={() => onUpdateTitle && setIsEditing(true)}
              disabled={!onUpdateTitle}
            >
              {title}
            </button>
          )}
          <p className="text-xs text-canvas-text">Powered by AI SDK</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onDeleteChat && (
          <Button variant="ghost" size="sm" onClick={onDeleteChat}>
            <Trash2Icon className="size-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onNewChatAction}>
          New Chat
        </Button>
      </div>
    </div>
  );
}
