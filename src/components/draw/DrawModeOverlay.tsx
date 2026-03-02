import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { useTheme } from '../../theme';
import { EdgeGlowFrame } from '../overlays/EdgeGlowFrame';
import { DrawSurface } from './DrawSurface';
import { DrawToolbar } from './DrawToolbar';
import type { Stroke } from './types';

export type DrawModeOverlayProps = {
  visible: boolean;
  captureTargetRef: React.RefObject<View | null>;
  onCancel: () => void;
  onCapture: (dataUrl: string) => void;
  /**
   * Custom palette (theme-first). If omitted, uses a theme-derived palette.
   */
  palette?: string[];
  strokeWidth?: number;
  style?: ViewStyle;
  /**
   * Render icons for toolbar actions.
   */
  renderUndoIcon?: () => React.ReactNode;
  renderCancelIcon?: () => React.ReactNode;
  renderDoneIcon?: () => React.ReactNode;
  renderDragHandle?: () => React.ReactNode;
};

export function DrawModeOverlay({
  visible,
  captureTargetRef,
  onCancel,
  onCapture,
  palette,
  strokeWidth = 4,
  style,
  renderUndoIcon,
  renderCancelIcon,
  renderDoneIcon,
  renderDragHandle,
}: DrawModeOverlayProps) {
  const theme = useTheme();

  const defaultPalette = React.useMemo(
    () => [
      '#EF4444', // Red
      '#EAB308', // Yellow
      '#22C55E', // Green
      '#3B82F6', // Blue
      '#FFFFFF', // White
      '#000000', // Black
    ],
    []
  );

  const colors = palette && palette.length > 0 ? palette : defaultPalette;
  const [selectedColor, setSelectedColor] = React.useState(colors[0] ?? '#EF4444');
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [capturing, setCapturing] = React.useState(false);
  const [hideUi, setHideUi] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setStrokes([]);
    setSelectedColor(colors[0] ?? '#EF4444');
    setCapturing(false);
    setHideUi(false);
  }, [colors, visible]);

  const canUndo = strokes.length > 0;

  const handleUndo = React.useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleCancel = React.useCallback(() => {
    setStrokes([]);
    onCancel();
  }, [onCancel]);

  const handleDone = React.useCallback(async () => {
    if (!captureTargetRef.current || capturing) return;
    try {
      setCapturing(true);
      setHideUi(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const base64 = await captureRef(captureTargetRef, {
        format: 'png',
        quality: 0.9,
        result: 'base64',
      });
      setCapturing(false);
      setHideUi(false);
      setStrokes([]);
      onCapture(`data:image/png;base64,${base64}`);
    } catch {
      setCapturing(false);
      setHideUi(false);
    }
  }, [captureTargetRef, capturing, onCapture]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, style]} pointerEvents="box-none">
      <EdgeGlowFrame
        visible={!hideUi}
        role="danger"
        thickness={50}
        intensity={1}
        animationDurationMs={hideUi ? 0 : 300}
      />

      <DrawSurface
        color={selectedColor}
        strokeWidth={strokeWidth}
        strokes={strokes}
        onAddStroke={(stroke) => setStrokes((prev) => [...prev, stroke])}
      />

      <DrawToolbar
        hidden={hideUi}
        capturing={capturing}
        colors={colors}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        canUndo={canUndo}
        onUndo={handleUndo}
        onCancel={handleCancel}
        onDone={() => void handleDone()}
        renderUndoIcon={renderUndoIcon}
        renderCancelIcon={renderCancelIcon}
        renderDoneIcon={renderDoneIcon}
        renderDragHandle={renderDragHandle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 9999,
  },
});


