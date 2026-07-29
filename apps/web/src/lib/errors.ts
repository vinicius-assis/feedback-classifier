import { ApiError } from './api';

/** Best-effort human-readable message for anything thrown by the API layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed';
}
