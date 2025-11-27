'use client';

import { useEffect, useState } from 'react';
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
import { Drawer } from 'vaul';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = 'profile' | 'security' | 'organization';

interface ModalSidebarItemProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  isActive?: boolean;
}

function ModalSidebarItem({ label, onClick, icon, isActive }: ModalSidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200 w-full text-left',
        isActive
          ? 'bg-primary-bg text-primary-text border border-primary-border shadow-sm'
          : 'text-canvas-text hover:bg-canvas-bg-hover hover:text-canvas-text-contrast'
      )}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

// Custom useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', handler);

    return () => mediaQueryList.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const isMobile = useMediaQuery('(max-width: 767px)');

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

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0  backdrop-blur-sm z-50" />
          <Drawer.Content
            className="fixed bottom-0 left-0 bg-canvas-bg right-0 h-[75vh] bg-canvas rounded-t-[16px] flex flex-col z-50"
            aria-describedby={undefined}
          >
            {/* Drag handle (standard for bottom sheets) */}
            <Drawer.Handle className="mx-auto mt-2 h-1 w-12 rounded-full bg-gray-300" />

            {/* Mobile header with close button */}
            <div className="flex items-center justify-between border-b border-canvas-border p-4">
              <h2 className="text-lg font-semibold text-canvas-text-contrast">Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close settings"
                className="p-1"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Mobile tabs: Horizontal for easy tapping, full width */}
            <div className="flex border-b border-canvas-border bg-canvas-subtle">
              <Button
                variant="ghost"
                className={cn(
                  'flex-1 py-3 text-sm',
                  activeSection === 'profile' ? 'border-b-2 border-primary-solid text-primary-text' : 'text-canvas-text'
                )}
                onClick={() => handleSectionChange('profile')}
              >
                <User size={16} className="mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'flex-1 py-3 text-sm',
                  activeSection === 'organization' ? 'border-b-2 border-primary-solid text-primary-text' : 'text-canvas-text'
                )}
                onClick={() => handleSectionChange('organization')}
              >
                <Users size={16} className="mr-2" />
                Organization
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'flex-1 py-3 text-sm',
                  activeSection === 'security' ? 'border-b-2 border-primary-solid text-primary-text' : 'text-canvas-text'
                )}
                onClick={() => handleSectionChange('security')}
              >
                <Shield size={16} className="mr-2" />
                Security
              </Button>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderActiveSection()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Original centered modal with sidebar
  const sidebar = (
    <div className="border-r border-canvas-border bg-canvas-subtle">
      <div className="border-canvas-border border-b p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-canvas-text-contrast text-lg font-semibold">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close settings modal"
            leadingIcon={<X size={16} />}
            iconOnly
          />
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-6">
        <ModalSidebarItem
          label="Profile"
          onClick={() => handleSectionChange('profile')}
          icon={<User />}
          isActive={activeSection === 'profile'}
        />
        <ModalSidebarItem
          label="Organization"
          onClick={() => handleSectionChange('organization')}
          icon={<Users />}
          isActive={activeSection === 'organization'}
        />
        <ModalSidebarItem
          label="Security"
          onClick={() => handleSectionChange('security')}
          icon={<Shield />}
          isActive={activeSection === 'security'}
        />
      </div>
    </div>
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
        className={cn(
          '!max-w-6xl w-full h-[90vh] max-h-[800px] p-0',
          'flex flex-col overflow-hidden'
        )}
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