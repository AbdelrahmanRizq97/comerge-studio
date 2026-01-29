import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { EditQueueItem } from '../../data/apps/edit-queue/types';
import { useTheme } from '../../theme';
import { withAlpha } from '../utils/color';
import { Text } from '../primitives/Text';
import { IconClose } from '../icons/StudioIcons';

export type ChatQueueProps = {
  items: EditQueueItem[];
  onRemove?: (id: string) => void;
};

type ExpansionState = Record<string, boolean>;
type CollapsedState = Record<string, string>;
type RemovalState = Record<string, boolean>;

export function ChatQueue({ items, onRemove }: ChatQueueProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState<ExpansionState>({});
  const [canExpand, setCanExpand] = React.useState<ExpansionState>({});
  const [collapsedText, setCollapsedText] = React.useState<CollapsedState>({});
  const [removing, setRemoving] = React.useState<RemovalState>({});

  const buildCollapsedText = React.useCallback((lines: { text: string }[]) => {
    const line1 = lines[0]?.text ?? '';
    const line2 = lines[1]?.text ?? '';
    const moreLabel = 'more';
    const reserve = `… ${moreLabel}`.length;
    let trimmedLine2 = line2;

    if (trimmedLine2.length > reserve) {
      trimmedLine2 = trimmedLine2.slice(0, Math.max(0, trimmedLine2.length - reserve));
    } else {
      trimmedLine2 = '';
    }

    trimmedLine2 = trimmedLine2.replace(/\s+$/, '');
    return `${line1}\n${trimmedLine2}… `;
  }, []);

  React.useEffect(() => {
    if (items.length === 0) return;
    const ids = new Set(items.map((item) => item.id));
    setExpanded((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))));
    setCanExpand((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))));
    setCollapsedText((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))));
    setRemoving((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))));
  }, [items]);

  if (items.length === 0) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
        marginHorizontal: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: 'transparent',
      }}
    >
      <Text variant="caption" style={{ marginBottom: theme.spacing.sm }}>
        Queue
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        {items.map((item) => {
          const isExpanded = Boolean(expanded[item.id]);
          const showToggle = Boolean(canExpand[item.id]);
          const prompt = item.prompt ?? '';
          const moreLabel = 'more';
          const displayPrompt =
            !isExpanded && showToggle && collapsedText[item.id] ? collapsedText[item.id] : prompt;
          const isRemoving = Boolean(removing[item.id]);
          return (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radii.md,
                backgroundColor: withAlpha(theme.colors.surface, theme.scheme === 'dark' ? 0.8 : 0.9),
              }}
            >
              <View style={{ flex: 1 }}>
                {!canExpand[item.id] ? (
                  <Text
                    style={{ position: 'absolute', opacity: 0, zIndex: -1, width: '100%' }}
                    onTextLayout={(e) => {
                      const lines = e.nativeEvent?.lines;
                      if (!lines) return;
                      if (lines.length > 2) {
                        setCanExpand((prev) => ({ ...prev, [item.id]: true }));
                        setCollapsedText((prev) => ({
                          ...prev,
                          [item.id]: buildCollapsedText(lines),
                        }));
                      }
                    }}
                  >
                    {prompt}
                  </Text>
                ) : null}
                <Text
                  variant="bodyMuted"
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {displayPrompt}
                  {!isExpanded && showToggle ? (
                    <Text
                      color={theme.colors.text}
                      onPress={() => setExpanded((prev) => ({ ...prev, [item.id]: true }))}
                      suppressHighlighting
                    >
                      {moreLabel}
                    </Text>
                  ) : null}
                </Text>
                {showToggle && isExpanded ? (
                  <Pressable
                    onPress={() => setExpanded((prev) => ({ ...prev, [item.id]: false }))}
                    hitSlop={6}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    <Text variant="captionMuted" color={theme.colors.text}>
                      less
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  if (!onRemove || isRemoving) return;
                  setRemoving((prev) => ({ ...prev, [item.id]: true }));
                  Promise.resolve(onRemove(item.id)).finally(() => {
                    setRemoving((prev) => {
                      if (!prev[item.id]) return prev;
                      const { [item.id]: _removed, ...rest } = prev;
                      return rest;
                    });
                  });
                }}
                hitSlop={8}
                style={{ alignSelf: 'center' }}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color={theme.colors.text} />
                ) : (
                  <IconClose size={14} colorToken="text" />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
