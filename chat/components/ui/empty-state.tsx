import { SparklesIcon } from 'lucide-react';
import { LogoDark } from '@/components/logo/logo';
import Image from 'next/image';

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center rounded-2xl bg-sidebar/50 backdrop-blur-sm p-8">
        <div className="mb-4 flex justify-center">
          {/* <div className="flex size-16 items-center justify-center rounded-full bg-primary-bg-subtle"> */}
         <Image src="/favicon/icon-512.png" alt="Logo" width={64} height={64} />
          {/* </div> */}
        </div>
        <h2 className="text-xl font-semibold text-canvas-text-contrast mb-2">
          Start a conversation
        </h2>
        <p className="text-sm text-canvas-text">
          Ask me anything and I'll do my best to help!
        </p>
      </div>
    </div>
  );
}
