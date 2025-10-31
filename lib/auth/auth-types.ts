import type { auth } from './auth';
import type { client } from './auth-client';
// The session passed here is actually the Better Auth session, not our database Session type
export type BetterAuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    isAnonymous?: boolean;
  };
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  activeOrganizationId: string | null;
  impersonatedBy: string | null;
};
export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof client.$Infer.ActiveOrganization;
export type Invitation = typeof client.$Infer.Invitation;
