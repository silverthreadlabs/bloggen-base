import type { ReactNode } from 'react';

import '@/app/global.css';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { productSource } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="product-page mx-auto max-w-7xl ">
      <DocsLayout
        tree={productSource.pageTree}
        sidebar={{ enabled: false }}
        searchToggle={{ enabled: false }}
        nav={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
