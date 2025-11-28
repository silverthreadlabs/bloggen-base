'use client';

import { SparklesIcon } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';

type MessageAvatarProps = {
  role: 'user' | 'assistant';
};

export function MessageAvatar({ role }: MessageAvatarProps) {
  const { data: session } = useSession();
  
  if (role === 'assistant') {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-solid">
        <SparklesIcon className="size-4 text-primary-text-contrast" />
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-bg-hover">
      <span className="text-sm font-medium text-secondary-text">
        {userInitial}
      </span>
    </div>
  );
}
