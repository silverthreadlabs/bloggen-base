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

  if (!sessionData || sessionData?.user?.isAnonymous) {
    redirect('/sign-in');
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Chat</h1>
      {/* ChatClient is a client component that will handle realtime interactions */}
      <ChatClient session={JSON.parse(JSON.stringify(session))} />
    </div>
  );
}
