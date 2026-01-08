import * as React from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

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

async function dataUrlToBlobAndroid(dataUrl: string): Promise<Blob> {
  const normalized = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`;
  const comma = normalized.indexOf(',');
  if (comma === -1) {
    throw new Error('Invalid data URL (missing comma separator)');
  }

  const header = normalized.slice(0, comma);
  const base64 = normalized.slice(comma + 1);

  const mimeMatch = header.match(/data:(.*?);base64/i);
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('expo-file-system cacheDirectory is unavailable');
  }

  const fileUri = `${cacheDir}attachment-${Date.now()}-${Math.random().toString(16).slice(2)}.bin`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    const resp = await fetch(fileUri);
    const blob = await resp.blob();
    return blob.type ? blob : new Blob([blob], { type: mimeType });
  } finally {
    void FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
  }
}

function getMimeTypeFromDataUrl(dataUrl: string): string {
  const normalized = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`;
  const comma = normalized.indexOf(',');
  const header = comma === -1 ? normalized : normalized.slice(0, comma);
  const mimeMatch = header.match(/data:(.*?);base64/i);
  return mimeMatch?.[1] ?? 'image/png';
}

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
          const blob =
            Platform.OS === 'android'
              ? await dataUrlToBlobAndroid(normalized)
              : await (await fetch(normalized)).blob();
          const mimeType = getMimeTypeFromDataUrl(normalized);
          return { blob, idx, mimeType };
        })
      );

      const files = blobs.map(({ blob, mimeType }, idx) => ({
        name: `attachment-${Date.now()}-${idx}.png`,
        size: blob.size,
        mimeType,
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


