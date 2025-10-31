import { CreditCard, Settings, Shield, User, Users } from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/settings/components/sidebar';
import SidebarItem from '@/components/settings/components/sidebar-items';
import DashboardLayout from '@/components/settings/layout';
import ProfileSection from '@/components/settings/views/profile-section';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';

export default async function DashboardPage() {
  const [session, subscriptions] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.listActiveSubscriptions({
      headers: await headers(),
    }),
  ]).catch((e) => {
    console.log(e);
    throw redirect('/sign-in');
  });

  const sessionData = session as unknown as BetterAuthSession;

  if (sessionData?.user?.isAnonymous) {
    redirect('/sign-in');
  }

  const sidebar = (
    <Sidebar>
      <SidebarItem label="Profile" href="/settings" icon={<User />} />
      <SidebarItem
        label="Organization"
        href="/settings/organization"
        icon={<Users />}
      />
      <SidebarItem
        label="Security"
        href="/settings/security"
        icon={<Shield />}
      />
      {/* <SidebarItem label="Billing" href="/settings/billing" icon={<CreditCard />} />
            <SidebarItem label="Settings" href="/settings/settingss" icon={<Settings />} /> */}
    </Sidebar>
  );

  return (
    <DashboardLayout sidebar={sidebar}>
      <ProfileSection
        session={JSON.parse(JSON.stringify(session))}
        subscription={subscriptions.find(
          (sub) => sub.status === 'active' || sub.status === 'trialing',
        )}
      />
    </DashboardLayout>
  );
}
