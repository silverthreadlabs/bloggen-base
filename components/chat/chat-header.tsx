import { Button } from '@/components/ui/button';
import { SparklesIcon } from 'lucide-react';

type ChatHeaderProps = {
  onNewChatAction: () => void;
};

export function ChatHeader({ onNewChatAction }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-canvas-border bg-canvas-bg px-6 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary-solid">
          <SparklesIcon className="size-5 text-primary-text-contrast" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-canvas-text-contrast">
            AI Assistant
          </h1>
          <p className="text-xs text-canvas-text">Powered by AI SDK</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNewChatAction}>
          New Chat
        </Button>
      </div>
    </div>
  );
}
