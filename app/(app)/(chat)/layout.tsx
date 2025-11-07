import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChatLayoutClient } from '@/components/chat/chat-layout-client';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';
import '../../global.css';

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  const sessionData = session as unknown as BetterAuthSession;

  // if (!sessionData || sessionData?.user?.isAnonymous) {
  //     redirect('/sign-in');
  // }

  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}
