import * as React from 'react';

import { attachmentRepository } from '../../data/attachment/repository';
import type { AttachmentMeta } from '../../data/attachment/types';

export type UploadBase64AttachmentsParams = {
  threadId: string;
  appId: string;
  dataUrls: string[];
};

export type UseAttachmentUploadResult = {
  uploadBase64Images: (params: UploadBase64AttachmentsParams) => Promise<AttachmentMeta[]>;
  uploading: boolean;
  error: Error | null;
};

export function useAttachmentUpload(): UseAttachmentUploadResult {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const uploadBase64Images = React.useCallback(async ({ threadId, appId, dataUrls }: UploadBase64AttachmentsParams) => {
    if (!threadId || !appId) return [];
    if (!dataUrls || dataUrls.length === 0) return [];

    setUploading(true);
    setError(null);
    try {
      const blobs = await Promise.all(
        dataUrls.map(async (dataUrl, idx) => {
          const normalized = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`;
          const resp = await fetch(normalized);
          const blob = await resp.blob();
          return { blob, idx };
        })
      );

      const files = blobs.map(({ blob }, idx) => ({
        name: `attachment-${Date.now()}-${idx}.png`,
        size: blob.size,
        mimeType: blob.type || 'image/png',
      }));

      const presign = await attachmentRepository.presign({ threadId, appId, files });
      await Promise.all(presign.uploads.map((u, index) => attachmentRepository.upload(u, blobs[index].blob)));
      return presign.uploads.map((u) => u.attachment);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadBase64Images, uploading, error };
}


