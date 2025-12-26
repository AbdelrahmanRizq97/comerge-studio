import * as React from 'react';
import { View } from 'react-native';
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
   * Additional BottomSheet props, for advanced tuning.
   * We intentionally do not expose everything as first-class props to keep SRP.
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
  snapPoints = ['80%', '100%'],
  sheetRef,
  background,
  children,
  bottomSheetProps,
}: StudioBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const internalSheetRef = React.useRef<BottomSheet | null>(null);
  const resolvedSheetRef = sheetRef ?? internalSheetRef;

  // Gorhom BottomSheet `index` is not reliably "fully controlled" across versions.
  // Ensure the visual sheet actually opens/closes when `open` changes (e.g. via header X button).
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
      onOpenChange?.(index >= 0);
    },
    [onOpenChange]
  );

  return (
    <BottomSheet
      ref={resolvedSheetRef}
      index={open ? snapPoints.length - 1 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundComponent={(props: BottomSheetBackgroundProps) => (
        <StudioSheetBackground {...props} renderBackground={background?.renderBackground} />
      )}
      topInset={insets.top}
      bottomInset={insets.bottom}
      handleIndicatorStyle={{ backgroundColor: theme.colors.handleIndicator }}
      onChange={handleChange}
      {...bottomSheetProps}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>
    </BottomSheet>
  );
}


