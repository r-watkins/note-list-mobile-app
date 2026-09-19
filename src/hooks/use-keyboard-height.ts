import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Current on-screen keyboard height (0 when hidden). With edge-to-edge enabled (see
 * android/gradle.properties) the OS no longer resizes the window for the keyboard
 * (`adjustResize` is a no-op), so screens pad their bottom by this value to keep content -
 * and whatever is being typed - above the keyboard.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
