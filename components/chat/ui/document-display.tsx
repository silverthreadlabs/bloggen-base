'use client';

import { FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageDocument = {
  id: string;
  name: string;
  url: string;
  size: number;
  mediaType: string;
};

export type DocumentDisplayProps = {
  documents: MessageDocument[];
  className?: string;
};

export function DocumentDisplay({ documents, className }: DocumentDisplayProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mediaType: string) => {
    if (mediaType.startsWith('image/')) {
      return '🖼️';
    } else if (mediaType === 'application/pdf') {
      return '📄';
    } else if (mediaType.includes('word') || mediaType === 'application/msword') {
      return '📝';
    } else if (mediaType === 'text/csv') {
      return '📊';
    } else {
      return '📎';
    }
  };

  const handleDocumentClick = (document: MessageDocument) => {
    // Open document in a new tab
    window.open(document.url, '_blank');
  };

  return (
    <div className={cn('mb-3 space-y-2', className)}>
      <div className="text-xs font-medium text-muted-foreground">
        Documents ({documents.length}):
      </div>
      <div className="flex flex-wrap gap-2">
        {documents.map((document) => (
          <button
            key={document.id}
            onClick={() => handleDocumentClick(document)}
            className="flex items-center gap-2 p-2 bg-background/50 hover:bg-muted/50 border rounded-md transition-colors cursor-pointer max-w-xs"
          >
            <div className="shrink-0 text-lg">
              {getFileIcon(document.mediaType)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">
                {document.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(document.size)}
              </div>
            </div>
            <FileIcon className="w-3 h-3 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}