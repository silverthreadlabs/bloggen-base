'use client';

import { FileIcon, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { FileUIPart } from 'ai';
import { cn } from '@/lib/utils';

type FileAttachmentDisplayProps = {
  file: FileUIPart & { __uploading?: boolean; __file?: File };
  className?: string;
};

export function FileAttachmentDisplay({
  file,
  className,
}: FileAttachmentDisplayProps) {
  const isImage = file.mediaType?.startsWith('image/');
  const filename = file.filename || 'Attachment';
  const fileUrl = file.url || '';
  const isUploading = file.__uploading;

  // Check if it's a data URL (base64) or regular URL or blob URL
  const isDataUrl = fileUrl.startsWith('data:');
  const isBlobUrl = fileUrl.startsWith('blob:');
  const isValidUrl = fileUrl.startsWith('http') || isDataUrl || isBlobUrl;

  // Show uploading state
  if (isUploading && !isValidUrl && file.__file) {
    const fileSize = file.__file.size;
    const fileSizeKB = Math.round(fileSize / 1024);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const sizeDisplay = fileSize > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-canvas-border bg-canvas-bg p-3 opacity-70',
          className,
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          {isImage ? (
            <ImageIcon className="size-5 text-primary" />
          ) : (
            <FileIcon className="size-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{filename}</p>
          <p className="truncate text-muted-foreground text-xs">
            {sizeDisplay}
          </p>
        </div>
      </div>
    );
  }

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
    const shouldUseImgTag = isDataUrl || isBlobUrl;
    
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border border-canvas-border bg-canvas-bg',
          isUploading && 'opacity-70',
          className,
        )}
      >
        {shouldUseImgTag ? (
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
  const FileContent = (
    <>
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
    </>
  );

  if (isUploading) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-canvas-border bg-canvas-bg p-3 opacity-70',
          className,
        )}
      >
        {FileContent}
      </div>
    );
  }

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
      {FileContent}
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
