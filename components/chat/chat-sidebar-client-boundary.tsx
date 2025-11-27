// components/chat/chat-sidebar-client-boundary.tsx
'use client';

import { ChatSidebar } from './ui/chat-sidebar/index';

type Props = {
  currentChatId?: string;
};

export function ChatSidebarClientBoundary({ currentChatId }: Props) {
  return <ChatSidebar currentChatId={currentChatId} />;
}