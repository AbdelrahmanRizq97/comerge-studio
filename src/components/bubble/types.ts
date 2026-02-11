import type * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type BubbleOffset = {
  /** Distance from the left edge (in px). */
  left?: number;
  /** Distance from the bottom edge (in px). */
  bottom?: number;
};

export type BubbleProps = {
  /**
   * Whether the button should be shown. When toggled, the button animates in/out.
   * The component stays mounted to preserve its last drag position.
   */
  visible?: boolean;

  /** Called after the "press → animate out" sequence completes. */
  onPress?: () => void | Promise<void>;

  disabled?: boolean;

  /** Button diameter (square hit area). */
  size?: number;

  /** Padding from screen edges while dragging. */
  edgePadding?: number;

  /**
   * Initial placement when it animates in.
   * `left` is measured from the left edge; `bottom` from the bottom edge.
   */
  offset?: BubbleOffset;

  /** Accessible label for screen readers (kept as `ariaLabel` for compatibility). */
  ariaLabel?: string;

  /** Small badge rendered in the top-right corner. */
  badgeCount?: number;

  /** When true, renders a pulsing border ring. */
  isLoading?: boolean;
  /** Visual tone for the pulsing loading ring. */
  loadingBorderTone?: 'default' | 'warning';

  variant?: 'default' | 'danger';

  /** Override button background color (takes precedence over `variant`). */
  backgroundColor?: string;

  /**
   * Increment to force the button to animate in again.
   */
  forceShowTrigger?: number;

  /** Optional custom content inside the button (icon, etc.). */
  children?: React.ReactNode;

  /** Optional style for the outer container (positioning handled internally). */
  style?: StyleProp<ViewStyle>;

  testID?: string;
};


