// NOTE: Maybe we should rename?
export type OperationResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export type Override<T, U extends Partial<Record<keyof T, unknown>>> = Omit<T, keyof U> & U;
