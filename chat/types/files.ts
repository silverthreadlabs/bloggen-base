// ============================================================================
// FILE ATTACHMENT TYPES
// ============================================================================

export type FileAttachment = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt?: Date;
};

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};