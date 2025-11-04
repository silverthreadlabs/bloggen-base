import { SparklesIcon } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center rounded-2xl bg-sidebar/50 backdrop-blur-sm p-8 border border-sidebar-border">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-bg-subtle">
            <SparklesIcon className="size-8 text-primary-text" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-canvas-text-contrast mb-2">
          Start a conversation
        </h2>
        <p className="text-sm text-canvas-text">
          Ask me anything and I'll do my best to help!
        </p>
      </div>
    </div>
  );
}
