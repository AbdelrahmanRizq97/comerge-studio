import * as React from 'react';
import { AppState, Keyboard, View, type AppStateStatus } from 'react-native';
import {
  BottomSheetModal,
  type BottomSheetBackgroundProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
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
   * Optional ref forwarding to control the BottomSheetModal imperatively.
   */
  sheetRef?: React.RefObject<BottomSheetModal | null>;

  /**
   * Provide a custom background renderer (e.g. BlurView).
   */
  background?: Pick<StudioSheetBackgroundProps, 'renderBackground'>;

  /**
   * Content inside the sheet.
   */
  children: React.ReactNode;

  /**
   * Additional BottomSheetModal props
   */
  bottomSheetProps?: Omit<
    BottomSheetModalProps,
    | 'ref'
    | 'index'
    | 'snapPoints'
    | 'enablePanDownToClose'
    | 'backgroundComponent'
    | 'topInset'
    | 'bottomInset'
    | 'handleIndicatorStyle'
    | 'onChange'
    | 'onDismiss'
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
  const internalSheetRef = React.useRef<BottomSheetModal | null>(null);
  const resolvedSheetRef = sheetRef ?? internalSheetRef;
  const resolvedSnapPoints = React.useMemo<(string | number)[]>(() => [...snapPoints], [snapPoints]);
  const currentIndexRef = React.useRef<number>(open ? resolvedSnapPoints.length - 1 : -1);
  const lastAppStateRef = React.useRef<AppStateStatus>(AppState.currentState);

  // Workaround: @gorhom/bottom-sheet can occasionally render empty content after app resume if the keyboard is open.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      lastAppStateRef.current = state;

      if (state === 'background' || state === 'inactive') {
        Keyboard.dismiss();
        return;
      }
    });
    return () => sub.remove();
  }, [open, resolvedSheetRef]);

  React.useEffect(() => {
    const sheet = resolvedSheetRef.current;
    if (!sheet) return;

    if (open) {
      sheet.present();
    } else {
      sheet.dismiss();
    }
  }, [open, resolvedSheetRef, resolvedSnapPoints.length]);

  const handleChange = React.useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      onOpenChange?.(index >= 0);
    },
    [onOpenChange]
  );

  return (
    <BottomSheetModal
      ref={resolvedSheetRef}
      index={resolvedSnapPoints.length - 1}
      snapPoints={resolvedSnapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundComponent={(props: BottomSheetBackgroundProps) => (
        <StudioSheetBackground {...props} renderBackground={background?.renderBackground} />
      )}
      topInset={insets.top}
      bottomInset={0}
      handleIndicatorStyle={{ backgroundColor: theme.colors.handleIndicator }}
      {...bottomSheetProps}
      onChange={handleChange}
      onDismiss={() => onOpenChange?.(false)}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>
    </BottomSheetModal>
  );
}


