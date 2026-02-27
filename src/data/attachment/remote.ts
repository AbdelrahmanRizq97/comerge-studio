import { api } from '../../core/services/http';
import { BaseRemote } from '../base-remote';
import type { ServiceResponse } from '../types';
import type {
  PresignAttachmentsRequest,
  PresignAttachmentsResponse,
  StagePresignAttachmentsRequest,
  StagePresignAttachmentsResponse,
} from './types';

export interface AttachmentRemoteDataSource {
  presign(
    payload: PresignAttachmentsRequest
  ): Promise<ServiceResponse<PresignAttachmentsResponse>>;
  stagePresign(
    payload: StagePresignAttachmentsRequest
  ): Promise<ServiceResponse<StagePresignAttachmentsResponse>>;
}

class AttachmentRemoteDataSourceImpl
  extends BaseRemote
  implements AttachmentRemoteDataSource
{
  async presign(
    payload: PresignAttachmentsRequest
  ): Promise<ServiceResponse<PresignAttachmentsResponse>> {
    const { data } = await api.post<ServiceResponse<PresignAttachmentsResponse>>(
      '/v1/attachments/presign',
      payload
    );
    return data;
  }

  async stagePresign(
    payload: StagePresignAttachmentsRequest
  ): Promise<ServiceResponse<StagePresignAttachmentsResponse>> {
    const { data } = await api.post<ServiceResponse<StagePresignAttachmentsResponse>>(
      '/v1/attachments/stage/presign',
      payload
    );
    return data;
  }
}

export const attachmentRemoteDataSource: AttachmentRemoteDataSource =
  new AttachmentRemoteDataSourceImpl();

