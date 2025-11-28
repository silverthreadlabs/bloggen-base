'use client';

import { type ComponentProps, memo, useState, useRef } from 'react';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';

type ResponseProps = ComponentProps<typeof Streamdown> & {
  isStreaming?: boolean;
};

export const Response = memo(
  ({ className, isStreaming, children, ...props }: ResponseProps) => {
    const fullText = String(children);
    const [displayedText, setDisplayedText] = useState('');
    const bufferRef = useRef('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // When new content arrives, add to buffer
    if (fullText !== displayedText + bufferRef.current) {
      const newContent = fullText.slice(displayedText.length);
      bufferRef.current = newContent;

      // Start displaying word by word if not already running
      if (!intervalRef.current && isStreaming) {
        intervalRef.current = setInterval(() => {
          if (bufferRef.current.length === 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }

          // Display word by word (split by spaces)
          const words = bufferRef.current.split(' ');
          if (words.length > 0) {
            const nextWord = words[0] + (words.length > 1 ? ' ' : '');
            setDisplayedText(prev => prev + nextWord);
            bufferRef.current = bufferRef.current.slice(nextWord.length);
          }
        }, 30); // 30ms per word = fast but smooth
      }
    }

    // When streaming stops, show everything immediately
    if (!isStreaming && bufferRef.current.length > 0) {
      setDisplayedText(fullText);
      bufferRef.current = '';
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    const content = displayedText + (isStreaming ? ' ▊' : '');

    return (
      <Streamdown
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className,
        )}
        {...props}
      >
        {content}
      </Streamdown>
    );
  }
);

Response.displayName = 'Response';
