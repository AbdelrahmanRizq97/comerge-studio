import type { AttachmentRemoteDataSource } from './remote';
import { attachmentRemoteDataSource } from './remote';
import type {
  PresignAttachmentsRequest,
  PresignAttachmentsResponse,
  StagePresignAttachmentsRequest,
  StagePresignAttachmentsResponse,
  PresignedUpload,
  StagedPresignedUpload,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface AttachmentRepository {
  presign(payload: PresignAttachmentsRequest): Promise<PresignAttachmentsResponse>;
  stagePresign(payload: StagePresignAttachmentsRequest): Promise<StagePresignAttachmentsResponse>;
  upload(upload: PresignedUpload, file: Blob | File): Promise<void>;
  uploadStaged(upload: StagedPresignedUpload, file: Blob | File): Promise<void>;
}

class AttachmentRepositoryImpl extends BaseRepository implements AttachmentRepository {
  constructor(private readonly remote: AttachmentRemoteDataSource) {
    super();
  }

  async presign(payload: PresignAttachmentsRequest): Promise<PresignAttachmentsResponse> {
    const res = await this.remote.presign(payload);
    return this.unwrapOrThrow(res);
  }

  async stagePresign(payload: StagePresignAttachmentsRequest): Promise<StagePresignAttachmentsResponse> {
    const res = await this.remote.stagePresign(payload);
    return this.unwrapOrThrow(res);
  }

  async upload(upload: PresignedUpload, file: Blob | File): Promise<void> {
    const resp = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: upload.headers,
      body: file,
    });
    if (!resp.ok) {
      throw new Error(`upload failed: ${resp.status}`);
    }
  }

  async uploadStaged(upload: StagedPresignedUpload, file: Blob | File): Promise<void> {
    const resp = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: upload.headers,
      body: file,
    });
    if (!resp.ok) {
      throw new Error(`staged upload failed: ${resp.status}`);
    }
  }
}

export const attachmentRepository: AttachmentRepository = new AttachmentRepositoryImpl(
  attachmentRemoteDataSource
);

