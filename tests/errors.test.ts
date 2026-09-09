import { Alert } from 'react-native';

import { runWrite } from '@/lib/errors';

describe('runWrite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns ok:true with the operation result on success', () => {
    const result = runWrite(() => 42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('catches a thrown error, surfaces an alert, and returns ok:false', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const result = runWrite(() => {
      throw new Error('SQLITE_CONSTRAINT');
    });

    expect(result).toEqual({ ok: false });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('Something went wrong');
  });
});
