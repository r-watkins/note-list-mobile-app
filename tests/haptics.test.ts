import * as Haptics from 'expo-haptics';

import { hapticCheckboxToggle, hapticDestructiveConfirm } from '@/lib/haptics';

describe('haptics', () => {
  it('hapticCheckboxToggle triggers a selection haptic', () => {
    const spy = jest.spyOn(Haptics, 'selectionAsync');
    hapticCheckboxToggle();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('hapticDestructiveConfirm triggers a warning notification haptic', () => {
    const spy = jest.spyOn(Haptics, 'notificationAsync');
    hapticDestructiveConfirm();
    expect(spy).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
  });

  it('never throws or rejects the caller when the underlying call fails', async () => {
    jest.spyOn(Haptics, 'selectionAsync').mockRejectedValueOnce(new Error('no vibration motor'));
    expect(() => hapticCheckboxToggle()).not.toThrow();
    // Let the swallowed rejection's microtask settle before the test ends.
    await new Promise((resolve) => setImmediate(resolve));
  });
});
