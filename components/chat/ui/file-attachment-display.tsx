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
          'inline-flex items-center gap-2 rounded-md border border-canvas-border bg-canvas-bg px-2.5 py-1.5 opacity-70 max-w-fit',
          className,
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
          {isImage ? (
            <ImageIcon className="size-3.5 text-primary" />
          ) : (
            <FileIcon className="size-3.5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-xs">{filename}</p>
          <p className="truncate text-muted-foreground text-[10px]">
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
          'inline-flex items-center gap-2 rounded-md border border-canvas-border bg-canvas-bg px-2.5 py-1.5 max-w-fit',
          className,
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
          <FileIcon className="size-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-xs">{filename}</p>
          <p className="truncate text-muted-foreground text-[10px] text-red-500">
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
          'group relative overflow-hidden rounded-lg border border-canvas-border bg-canvas-bg w-full',
          isUploading && 'opacity-70',
          className,
        )}
      >
        {shouldUseImgTag ? (
          <div className="block">
            <div className="relative aspect-square w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="bg-secondary-bg-hover/80 px-2 py-1 backdrop-blur-sm">
              <p className="truncate text-[10px]">{filename}</p>
            </div>
          </div>
        ) : (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative aspect-square w-full">
              <Image
                src={fileUrl}
                alt={filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <div className="bg-secondary-bg-hover/80 px-2 py-1 backdrop-blur-sm">
              <p className="truncate text-[10px]">{filename}</p>
            </div>
          </a>
        )}
      </div>
    );
  }

  // Non-image file display
  const FileContent = (
    <>
      <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
        <FileIcon className="size-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-xs">{filename}</p>
        {file.mediaType && (
          <p className="truncate text-muted-foreground text-[10px]">
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
          'inline-flex items-center gap-2 rounded-md border border-canvas-border bg-canvas-bg px-2.5 py-1.5 opacity-70 max-w-fit',
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
        'inline-flex items-center gap-2 rounded-md border border-canvas-border bg-canvas-bg px-2.5 py-1.5 transition-colors hover:bg-secondary-bg-hover max-w-fit',
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

  // Separate images from other files
  const images = files.filter(f => f.mediaType?.startsWith('image/'));
  const nonImages = files.filter(f => !f.mediaType?.startsWith('image/'));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Display images in a grid (max 3 per row) */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
          {images.map((file, index) => (
            <FileAttachmentDisplay
              key={file.url || `img-${index}`}
              file={file}
            />
          ))}
        </div>
      )}
      
      {/* Display non-image files in a column */}
      {nonImages.length > 0 && (
        <div className="flex flex-col gap-2">
          {nonImages.map((file, index) => (
            <FileAttachmentDisplay
              key={file.url || `file-${index}`}
              file={file}
            />
          ))}
        </div>
      )}
    </div>
  );
}
