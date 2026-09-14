import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback is UI polish, not a correctness path - a device/platform without vibration
 * hardware (or expo-haptics' web stub) must never crash the interaction it's attached to.
 */
function triggerHaptic(perform: () => Promise<void>): void {
  perform().catch(() => {});
}

/** Selective feedback on checkbox toggle (design.md Decision #10, spec's Phase 5 polish). */
export function hapticCheckboxToggle(): void {
  triggerHaptic(() => Haptics.selectionAsync());
}

/** Selective feedback when a destructive action (delete/discard) is confirmed. */
export function hapticDestructiveConfirm(): void {
  triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
