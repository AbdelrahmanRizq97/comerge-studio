import * as React from 'react';
import { Keyboard, Platform } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

export function useIosKeyboardSnapFix(
  sheetRef: React.RefObject<BottomSheetModal | null>,
  options?: { getCurrentIndex?: () => number | null; targetIndex?: number }
) {
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      const target = options?.targetIndex ?? 1;
      const current = options?.getCurrentIndex?.() ?? null;
      // Only "re-snap" if we're already at the target index; otherwise we can cause a jump.
      if (current === target) {
        setTimeout(() => sheetRef.current?.snapToIndex?.(target), 10);
      }
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [options?.getCurrentIndex, options?.targetIndex, sheetRef]);

  return { keyboardVisible };
}


