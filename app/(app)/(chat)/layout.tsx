import type { ReactNode } from 'react';

import '../../global.css';

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className='bg-canvas-bg flex h-screen w-full flex-col justify-center items-center overflow-hidden'>
            <div className='w-full max-w-5xl h-full'>{children}</div>
        </div>
    );
}
