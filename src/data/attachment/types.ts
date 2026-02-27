export type AttachmentMeta = {
  id: string;
  name: string;
  bucket: string;
  path: string;
  mimeType: string;
  size: number;
  checksum?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  uploadStatus?: 'pending' | 'uploaded';
  downloadUrl?: string;
};

export type PresignFile = {
  name: string;
  size: number;
  mimeType: string;
  checksum?: string;
};

export type PresignAttachmentsRequest = {
  threadId: string;
  files: PresignFile[];
  appId?: string;
};

export type StagePresignAttachmentsRequest = {
  files: PresignFile[];
};

export type PresignedUpload = {
  uploadUrl: string;
  headers: Record<string, string>;
  token: string | null;
  attachment: AttachmentMeta;
};

export type PresignAttachmentsResponse = {
  appId: string;
  threadId: string;
  expiresIn: number;
  uploads: PresignedUpload[];
};

export type StagedPresignedUpload = {
  uploadUrl: string;
  headers: Record<string, string>;
  token: string | null;
  attachmentToken: string;
  fileName: string;
  mimeType: string;
  size: number;
  checksum?: string;
};

export type StagePresignAttachmentsResponse = {
  expiresIn: number;
  uploads: StagedPresignedUpload[];
};

