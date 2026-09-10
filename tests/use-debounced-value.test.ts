import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', async () => {
    const { result } = await renderHook(() => useDebouncedValue('a', 200));
    expect(result.current).toBe('a');
  });

  it('does not update until the delay has elapsed', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      {
        initialProps: { value: 'a' },
      },
    );

    await rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    await act(() => {
      jest.advanceTimersByTime(199);
    });
    expect(result.current).toBe('a');

    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });

  it('resets the timer on every change, only settling on the final value', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      {
        initialProps: { value: 'a' },
      },
    );

    await rerender({ value: 'ab' });
    await act(() => {
      jest.advanceTimersByTime(150);
    });
    await rerender({ value: 'abc' });
    await act(() => {
      jest.advanceTimersByTime(150);
    });
    // 300ms elapsed total, but neither intermediate value ever stayed put for 200ms.
    expect(result.current).toBe('a');

    await act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe('abc');
  });
});
