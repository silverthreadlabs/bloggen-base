'use client';

import { useState, useEffect } from 'react';
import { Shield, User, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ProfileSection from '@/components/settings/views/profile-section';
import SecuritySection from '@/components/settings/views/security-section';
import OrganizationSection from '@/components/settings/views/organization-section';
import { useSession } from '@/lib/auth/auth-client';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = 'profile' | 'security' | 'organization';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();

  // Detect mobile on client only
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's `md` = 768px
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection session={JSON.parse(JSON.stringify(session))} subscription={undefined} />;
      case 'security':
        return <SecuritySection session={JSON.parse(JSON.stringify(session))} activeSessions={[]} />;
      case 'organization':
        return <OrganizationSection session={JSON.parse(JSON.stringify(session))} activeOrganization={null} />;
      default:
        return null;
    }
  };

  // Shared sidebar item for desktop
  const SidebarItem = ({ label, icon, section }: { label: string; icon: React.ReactNode; section: SettingsSection }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all w-full text-left',
        activeSection === section
          ? 'bg-primary-bg text-primary-text border border-primary-border shadow-sm'
          : 'text-canvas-text hover:bg-canvas-bg-hover hover:text-canvas-text-contrast'
      )}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  // Mobile tab
  const MobileTab = ({ label, icon, section }: { label: string; icon: React.ReactNode; section: SettingsSection }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={cn(
        'flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-medium transition-all flex-1',
        activeSection === section
          ? 'text-primary-foreground bg-primary shadow-sm border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  // Always render only ONE of them
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-3xl p-0 border-0 bg-canvas text-canvas-text"
        >
          {/* Pull indicator */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border rounded-full" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-canvas-border bg-canvas/80 backdrop-blur-sm">
            <MobileTab label="Profile" icon={<User size={21} />} section="profile" />
            <MobileTab label="Organization" icon={<Users size={21} />} section="organization" />
            <MobileTab label="Security" icon={<Shield size={21} />} section="security" />
          </div>

          {/* Content */}
          <div className="h-full overflow-y-auto pb-12">
            <div className="px-5 pt-6">{renderSection()}</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-6xl w-full h-[90vh] max-h-[800px] p-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex h-full bg-canvas">
          {/* Sidebar */}
          <aside className="w-64 border-r border-canvas-border bg-canvas-subtle flex flex-col">
            <div className="border-b border-canvas-border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-canvas-text-contrast">Settings</h2>
              </div>
            </div>

            <nav className="flex-1 p-6 space-y-2">
              <SidebarItem label="Profile" icon={<User />} section="profile" />
              <SidebarItem label="Organization" icon={<Users />} section="organization" />
              <SidebarItem label="Security" icon={<Shield />} section="security" />
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto p-8">
            {renderSection()}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}