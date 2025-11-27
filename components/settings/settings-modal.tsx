'use client';

import { useState } from 'react';
import { Shield, User, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const { data: session } = useSession();

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ProfileSection
            session={JSON.parse(JSON.stringify(session))}
            subscription={undefined}
          />
        );
      case 'security':
        return (
          <SecuritySection
            session={JSON.parse(JSON.stringify(session))}
            activeSessions={[]}
          />
        );
      case 'organization':
        return (
          <OrganizationSection
            session={JSON.parse(JSON.stringify(session))}
            activeOrganization={null}
          />
        );
      default:
        return null;
    }
  };

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
            // className="h-6 w-6 p-0"
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
        <div className="flex h-full min-h-0 bg-canvas">
          {sidebar}
          <main className="flex-1 md:ml-0 p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
            <div className="">{renderActiveSection()}</div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}