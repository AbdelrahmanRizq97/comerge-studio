export type ServiceResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  responseObject?: T | null;
};


