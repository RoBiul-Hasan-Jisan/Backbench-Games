export interface AckResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}
