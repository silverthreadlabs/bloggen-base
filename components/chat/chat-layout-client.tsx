'use client';

import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ChatSidebar } from './chat-sidebar';

export function ChatLayoutClient({ children }: { children: ReactNode }) {
  const params = useParams();
  const chatId = params?.id as string | undefined;

  return (
    <SidebarProvider>
      <ChatSidebar currentChatId={chatId} />
      <SidebarInset className="flex flex-col h-screen overflow-hidden w-full">
        <div className="flex flex-1 flex-col overflow-hidden w-full">
          <div className="h-full w-full max-w-4xl mx-auto">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
