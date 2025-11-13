'use client';

import { FileIcon, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { FileUIPart } from 'ai';
import { cn } from '@/lib/utils';

type FileAttachmentDisplayProps = {
  file: FileUIPart;
  className?: string;
};

export function FileAttachmentDisplay({
  file,
  className,
}: FileAttachmentDisplayProps) {
  const isImage = file.mediaType?.startsWith('image/');
  const filename = file.filename || 'Attachment';
  const fileUrl = file.url || '';

  // Check if it's a data URL (base64) or regular URL
  const isDataUrl = fileUrl.startsWith('data:');
  const isValidUrl = fileUrl.startsWith('http') || isDataUrl;

  if (!isValidUrl) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-canvas-border bg-canvas-bg p-3',
          className,
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <FileIcon className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{filename}</p>
          <p className="truncate text-muted-foreground text-xs text-red-500">
            Invalid file URL
          </p>
        </div>
      </div>
    );
  }

  if (isImage && fileUrl) {
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border border-canvas-border bg-canvas-bg',
          className,
        )}
      >
        {isDataUrl ? (
          <div className="block">
            <div className="relative h-48 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="bg-secondary-bg-hover/80 p-2 backdrop-blur-sm">
              <p className="truncate text-xs">{filename}</p>
            </div>
          </div>
        ) : (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative h-48 w-full">
              <Image
                src={fileUrl}
                alt={filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <div className="bg-secondary-bg-hover/80 p-2 backdrop-blur-sm">
              <p className="truncate text-xs">{filename}</p>
            </div>
          </a>
        )}
      </div>
    );
  }

  // Non-image file display
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-lg border border-canvas-border bg-canvas-bg p-3 transition-colors hover:bg-secondary-bg-hover',
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <FileIcon className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{filename}</p>
        {file.mediaType && (
          <p className="truncate text-muted-foreground text-xs">
            {file.mediaType}
          </p>
        )}
      </div>
    </a>
  );
}

type FileAttachmentsGridProps = {
  files: FileUIPart[];
  className?: string;
};

export function FileAttachmentsGrid({
  files,
  className,
}: FileAttachmentsGridProps) {
  if (!files || files.length === 0) return null;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3',
        className,
      )}
    >
      {files.map((file, index) => (
        <FileAttachmentDisplay
          key={file.url || index}
          file={file}
        />
      ))}
    </div>
  );
}
