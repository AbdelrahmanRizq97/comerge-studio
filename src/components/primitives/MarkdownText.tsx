import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import Markdown from 'react-native-markdown-display';

import { useTheme } from '../../theme';
import { useEffect, useRef, useState } from 'react';

export type MarkdownTextVariant = 'chat' | 'mergeRequest';

export type MarkdownTextProps = {
  markdown: string;
  variant?: MarkdownTextVariant;
  /**
   * Optional override for the base text color (e.g. success/error outcomes in chat).
   */
  bodyColor?: string;
  style?: ViewStyle;
};

function copyMarkdownToClipboard(markdown: string) {
  if (!markdown) {
    return;
  }

  const navigatorClipboard = globalThis?.navigator?.clipboard;
  if (navigatorClipboard?.writeText) {
    void navigatorClipboard.writeText(markdown);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoClipboard = require('expo-clipboard');
    if (expoClipboard?.setStringAsync) {
      void expoClipboard.setStringAsync(markdown);
      return;
    }
  } catch {
    // optional dependency; fall through
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rnClipboard = require('@react-native-clipboard/clipboard');
    if (rnClipboard?.setString) {
      rnClipboard.setString(markdown);
    }
  } catch {
    // optional dependency; nothing else to try
  }
}

export function MarkdownText({ markdown, variant = 'chat', bodyColor, style }: MarkdownTextProps) {
  const theme = useTheme();
  const isDark = theme.scheme === 'dark';
  const [showCopied, setShowCopied] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View>(null);

  const baseBodyColor = variant === 'mergeRequest' ? theme.colors.textMuted : theme.colors.text;
  const linkColor =
    variant === 'mergeRequest' ? (isDark ? theme.colors.primary : '#3700B3') : theme.colors.link;
  const linkWeight = variant === 'mergeRequest' ? theme.typography.fontWeight.semibold : undefined;

  const codeBgColor = isDark ? '#27272A' : '#E4E4E7';
  const codeTextColor = isDark ? '#FFFFFF' : theme.colors.text;

  const paragraphBottom = variant === 'mergeRequest' ? 8 : 6;
  const baseLineHeight = variant === 'mergeRequest' ? 22 : 20;

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleLongPress = (event: {
    nativeEvent: { locationX: number; locationY: number; pageX: number; pageY: number };
  }) => {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;

    if (containerRef.current?.measureInWindow) {
      containerRef.current.measureInWindow((x, y) => {
        setTooltipPosition({ x: pageX - x, y: pageY - y });
      });
    } else {
      setTooltipPosition({ x: locationX, y: locationY });
    }
    copyMarkdownToClipboard(markdown);
    setShowCopied(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 1200);
  };

  return (
    <Pressable style={style} onLongPress={handleLongPress}>
      <View ref={containerRef} style={{ position: 'relative' }}>
        <Markdown
          style={{
            body: { color: bodyColor ?? baseBodyColor, fontSize: 14, lineHeight: baseLineHeight },
            paragraph: { marginTop: 0, marginBottom: paragraphBottom },
            link: { color: linkColor, fontWeight: linkWeight },
            code_inline: {
              backgroundColor: codeBgColor,
              color: codeTextColor,
              paddingHorizontal: variant === 'mergeRequest' ? 6 : 4,
              paddingVertical: variant === 'mergeRequest' ? 2 : 0,
              borderRadius: variant === 'mergeRequest' ? 6 : 4,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontSize: 13,
            },
            code_block: {
              backgroundColor: codeBgColor,
              color: codeTextColor,
              padding: variant === 'mergeRequest' ? 12 : 8,
              borderRadius: variant === 'mergeRequest' ? 8 : 6,
              marginVertical: variant === 'mergeRequest' ? 8 : 0,
            },
            fence: {
              backgroundColor: codeBgColor,
              color: codeTextColor,
              padding: variant === 'mergeRequest' ? 12 : 8,
              borderRadius: variant === 'mergeRequest' ? 8 : 6,
              marginVertical: variant === 'mergeRequest' ? 8 : 0,
            },
          }}
        >
          {markdown}
        </Markdown>
        {showCopied && tooltipPosition ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: tooltipPosition.x,
              top: tooltipPosition.y - theme.spacing.lg - 32,
              backgroundColor: theme.colors.success,
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              transform: [{ translateX: tooltipWidth ? -tooltipWidth / 2 : 0 }],
            }}
            onLayout={(event) => setTooltipWidth(event.nativeEvent.layout.width)}
          >
            <Text
              style={{
                color: theme.colors.onSuccess,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Copied
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}


