import { api } from '../../core/services/http';
import { BaseRemote } from '../base-remote';
import type { ServiceResponse } from '../types';
import type {
  PresignAttachmentsRequest,
  PresignAttachmentsResponse,
} from './types';

export interface AttachmentRemoteDataSource {
  presign(
    payload: PresignAttachmentsRequest
  ): Promise<ServiceResponse<PresignAttachmentsResponse>>;
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
}

export const attachmentRemoteDataSource: AttachmentRemoteDataSource =
  new AttachmentRemoteDataSourceImpl();

