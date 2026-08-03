export type Result<T, E = Error> = 
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: E; value?: undefined };

export const success = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const failure = <E>(error: E): Result<never, E> => ({ ok: false, error });
