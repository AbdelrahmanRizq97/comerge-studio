import * as React from 'react';
import { AppState, Keyboard, Platform, View, type AppStateStatus } from 'react-native';
import BottomSheet, { type BottomSheetBackgroundProps, type BottomSheetProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { StudioSheetBackground, type StudioSheetBackgroundProps } from './StudioSheetBackground';
import type { StudioSheetSnapPoints } from './types';

export type StudioBottomSheetProps = {
  /**
   * Controlled open state.
   */
  open: boolean;
  onOpenChange?: (open: boolean) => void;

  /**
   * Snap points for the sheet.
   */
  snapPoints?: StudioSheetSnapPoints;

  /**
   * Optional ref forwarding to control the BottomSheet imperatively.
   */
  sheetRef?: React.RefObject<BottomSheet | null>;

  /**
   * Provide a custom background renderer (e.g. BlurView).
   */
  background?: Pick<StudioSheetBackgroundProps, 'renderBackground'>;

  /**
   * Content inside the sheet.
   */
  children: React.ReactNode;

  /**
   * Additional BottomSheet props
   */
  bottomSheetProps?: Omit<
    BottomSheetProps,
    | 'ref'
    | 'index'
    | 'snapPoints'
    | 'enablePanDownToClose'
    | 'backgroundComponent'
    | 'topInset'
    | 'bottomInset'
    | 'handleIndicatorStyle'
    | 'onChange'
    | 'children'
  >;
};

export function StudioBottomSheet({
  open,
  onOpenChange,
  snapPoints = ['100%'],
  sheetRef,
  background,
  children,
  bottomSheetProps,
}: StudioBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const internalSheetRef = React.useRef<BottomSheet | null>(null);
  const resolvedSheetRef = sheetRef ?? internalSheetRef;
  const currentIndexRef = React.useRef<number>(open ? snapPoints.length - 1 : -1);
  const lastAppStateRef = React.useRef<AppStateStatus>(AppState.currentState);

  // Workaround: @gorhom/bottom-sheet can occasionally render empty content after app resume.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const prev = lastAppStateRef.current;
      lastAppStateRef.current = state;

      if (state === 'background' || state === 'inactive') {
        Keyboard.dismiss();
        return;
      }

      if (state !== 'active') return;
      const sheet = resolvedSheetRef.current;
      if (!sheet) return;
      const idx = currentIndexRef.current;
      if (open && idx >= 0) {
        Keyboard.dismiss();
        requestAnimationFrame(() => sheet.snapToIndex(idx));
        setTimeout(() => sheet.snapToIndex(idx), 120);
      }
    });
    return () => sub.remove();
  }, [open, resolvedSheetRef]);

  React.useEffect(() => {
    const sheet = resolvedSheetRef.current;
    if (!sheet) return;

    if (open) {
      // Open to the highest snap point by default.
      sheet.snapToIndex(snapPoints.length - 1);
    } else {
      sheet.close();
    }
  }, [open, resolvedSheetRef, snapPoints.length]);

  const handleChange = React.useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      onOpenChange?.(index >= 0);
    },
    [onOpenChange]
  );

  return (
    <BottomSheet
      ref={resolvedSheetRef}
      index={open ? snapPoints.length - 1 : -1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      android_keyboardInputMode="adjustResize"
      backgroundComponent={(props: BottomSheetBackgroundProps) => (
        <StudioSheetBackground {...props} renderBackground={background?.renderBackground} />
      )}
      topInset={insets.top}
      bottomInset={0}
      handleIndicatorStyle={{ backgroundColor: theme.colors.handleIndicator }}
      onChange={handleChange}
      {...bottomSheetProps}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>
    </BottomSheet>
  );
}


