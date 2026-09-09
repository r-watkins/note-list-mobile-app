import { Alert } from 'react-native';

export type WriteResult<T> = { ok: true; value: T } | { ok: false };

/**
 * Runs a write (a repository/service call) and surfaces a native alert instead of letting
 * a failure - e.g. a SQLite constraint violation - throw uncaught into the render tree.
 * Callers that need to know whether it's safe to proceed (navigate, close a dialog, ...)
 * check `result.ok`; callers that don't can just call it and ignore the result.
 */
export function runWrite<T>(operation: () => T): WriteResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    console.error('Write failed:', error);
    Alert.alert('Something went wrong', 'Your change could not be saved. Please try again.');
    return { ok: false };
  }
}
