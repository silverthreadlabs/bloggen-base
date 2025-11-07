/**
 * NuqsAdapter Provider
 * 
 * Wraps the app with nuqs context for Next.js App Router.
 * Required for nuqs to work with Next.js 15+
 * 
 * @see https://nuqs.47ng.com/docs/adapters/next-app
 */

'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function URLStateProvider({ children }: Props) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
