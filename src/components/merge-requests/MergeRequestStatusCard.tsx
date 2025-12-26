import * as React from 'react';
import { Animated, Pressable, View, type ViewStyle } from 'react-native';
import { Ban, Check, CheckCheck, ChevronDown } from 'lucide-react-native';

import type { MergeRequestSummary } from '../models/types';
import { useTheme } from '../../theme';
import { withAlpha } from '../utils/color';
import { Card } from '../primitives/Card';
import { MarkdownText } from '../primitives/MarkdownText';
import { Text } from '../primitives/Text';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { getMergeRequestStatusDisplay } from './mergeRequestStatusDisplay';
import { toIsoString } from './toIsoString';
import { useControlledExpansion } from './useControlledExpansion';

export type MergeRequestStatusCardProps = {
  mergeRequest: MergeRequestSummary;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  headerRight?: React.ReactNode;
  style?: ViewStyle;
};

export function MergeRequestStatusCard({
  mergeRequest,
  expanded: expandedProp,
  onExpandedChange,
  headerRight,
  style,
}: MergeRequestStatusCardProps) {
  const theme = useTheme();
  const { expanded, setExpanded } = useControlledExpansion({ expanded: expandedProp, onExpandedChange });
  const isDark = theme.scheme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? '#A1A1AA' : '#71717A';
  const status = React.useMemo(() => getMergeRequestStatusDisplay(String(mergeRequest.status)), [mergeRequest.status]);

  const { StatusIcon, iconColor, bgColor, statusText } = React.useMemo(() => {
    switch (mergeRequest.status) {
      case 'approved':
      case 'merged':
        return {
          StatusIcon: CheckCheck,
          iconColor: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          statusText: 'Edit approved by developer',
        };
      case 'rejected':
        return {
          StatusIcon: Ban,
          iconColor: '#F43F5E',
          bgColor: 'rgba(244, 63, 94, 0.1)',
          statusText: 'Edit rejected by developer',
        };
      case 'open':
      default:
        return {
          StatusIcon: Check,
          iconColor: '#FACC15',
          bgColor: 'rgba(250, 204, 21, 0.1)',
          statusText: 'Edit submitted to developer',
        };
    }
  }, [mergeRequest.status]);

  const updatedIso = toIsoString(mergeRequest.updatedAt ?? null) ?? toIsoString(mergeRequest.createdAt ?? null);
  const createdIso = toIsoString(mergeRequest.createdAt ?? null);
  const headerTimeAgo = updatedIso ? formatTimeAgo(updatedIso) : '';
  const createdTimeAgo = createdIso ? formatTimeAgo(createdIso) : '';

  const rotate = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(rotate, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotate]);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
      <Card
        padded={false}
        border={false}
        style={[
          {
            padding: theme.spacing.lg,
            backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
          } as any,
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
          <View style={{ width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor }}>
            <StatusIcon size={20} color={iconColor} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 16,
                  lineHeight: 20,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {statusText}
              </Text>
              {headerTimeAgo ? (
                <Text style={{ fontSize: 10, lineHeight: 14, marginLeft: theme.spacing.sm, color: withAlpha(theme.colors.textMuted, 0.6) }}>
                  {headerTimeAgo}
                </Text>
              ) : null}
            </View>

            <Text style={{ fontSize: 12, lineHeight: 16, color: theme.colors.textMuted }} numberOfLines={1}>
              {mergeRequest.title ?? 'Untitled merge request'}
            </Text>
          </View>

          {headerRight ? (
            <View>{headerRight}</View>
          ) : (
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
                  },
                ],
              }}
            >
              <ChevronDown size={20} color={withAlpha(theme.colors.textMuted, 0.4)} />
            </Animated.View>
          )}
        </View>

        {expanded ? (
          <View style={{ marginTop: 16, marginLeft: 56 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: status.color,
                marginBottom: 2,
              }}
            >
              {status.text}
            </Text>
            {createdTimeAgo ? (
              <Text
                style={{
                  fontSize: 11,
                  color: subTextColor,
                  marginBottom: 8,
                }}
              >
                {createdTimeAgo}
              </Text>
            ) : null}

            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 8 }}>
              {mergeRequest.title ?? 'Untitled merge request'}
            </Text>

            {mergeRequest.description ? <MarkdownText markdown={mergeRequest.description} variant="mergeRequest" /> : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}


