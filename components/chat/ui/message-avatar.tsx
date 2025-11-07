import { SparklesIcon } from 'lucide-react';

type MessageAvatarProps = {
  role: 'user' | 'assistant';
  userName?: string;
};

export function MessageAvatar({ role, userName }: MessageAvatarProps) {
  if (role === 'assistant') {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-solid">
        <SparklesIcon className="size-4 text-primary-text-contrast" />
      </div>
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-bg-hover">
      <span className="text-sm font-medium text-secondary-text">
        {userName?.[0]?.toUpperCase() || 'U'}
      </span>
    </div>
  );
}
