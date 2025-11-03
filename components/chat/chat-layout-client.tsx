'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ChatSidebar } from './chat-sidebar';

export function ChatLayoutClient({ children }: { children: ReactNode }) {
  const params = useParams();
  const chatId = params?.id as string | undefined;

  return (
    <div className="bg-canvas-bg flex h-screen w-full overflow-hidden">
      <ChatSidebar currentChatId={chatId} />
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden">
        <div className="h-full w-full max-w-5xl">{children}</div>
      </div>
    </div>
  );
}
