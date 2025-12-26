import { Platform, View, type ViewStyle } from 'react-native';

import Markdown from 'react-native-markdown-display';

import { useTheme } from '../../theme';

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

export function MarkdownText({ markdown, variant = 'chat', bodyColor, style }: MarkdownTextProps) {
  const theme = useTheme();
  const isDark = theme.scheme === 'dark';

  const baseBodyColor = variant === 'mergeRequest' ? theme.colors.textMuted : theme.colors.text;
  const linkColor =
    variant === 'mergeRequest' ? (isDark ? theme.colors.primary : '#3700B3') : theme.colors.link;
  const linkWeight = variant === 'mergeRequest' ? theme.typography.fontWeight.semibold : undefined;

  const codeBgColor = isDark ? '#27272A' : '#E4E4E7';
  const codeTextColor = isDark ? '#FFFFFF' : theme.colors.text;

  const paragraphBottom = variant === 'mergeRequest' ? 8 : 6;
  const baseLineHeight = variant === 'mergeRequest' ? 22 : 20;

  return (
    <View style={style}>
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
    </View>
  );
}


