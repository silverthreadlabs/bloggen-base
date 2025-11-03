import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';
import ChatClient from '@/components/chat/chat-client';

export default async function ChatPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  const sessionData = session as unknown as BetterAuthSession;

  // if (!sessionData || sessionData?.user?.isAnonymous) {
  //   redirect('/sign-in');
  // }

  return <ChatClient session={JSON.parse(JSON.stringify(session))} />;
}
