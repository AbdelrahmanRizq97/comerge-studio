import * as React from 'react';
import { Keyboard, Platform } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

export function useIosKeyboardSnapFix(sheetRef: React.RefObject<BottomSheetModal | null>) {
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      setTimeout(() => sheetRef.current?.snapToIndex?.(1), 10);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [sheetRef]);

  return { keyboardVisible };
}


