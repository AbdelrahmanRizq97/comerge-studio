import type { ServiceResponse } from './types';

export abstract class BaseRepository {
  protected unwrapOrThrow<T>(res: ServiceResponse<T>): T {
    if (res.success && res.responseObject) return res.responseObject;
    const msg = res.message || 'Request failed';
    throw new Error(msg);
  }
}


