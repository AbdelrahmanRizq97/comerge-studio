import * as React from 'react';
import { ActivityIndicator, Animated, Pressable, View } from 'react-native';
import { Check, ChevronDown, Play, X } from 'lucide-react-native';

import type { MergeRequest } from '../../data/merge-requests/types';
import type { UserStats } from '../../data/users/types';
import { useTheme } from '../../theme';
import { Avatar } from '../primitives/Avatar';
import { Card } from '../primitives/Card';
import { MarkdownText } from '../primitives/MarkdownText';
import { Text } from '../primitives/Text';
import { withAlpha } from '../utils/color';
import { getMergeRequestStatusDisplay } from './mergeRequestStatusDisplay';
import { ReviewMergeRequestActionButton } from './ReviewMergeRequestActionButton';

export type ReviewMergeRequestCardProps = {
  mr: MergeRequest;
  index: number;
  total: number;
  creator?: UserStats;
  isExpanded: boolean;
  isProcessing: boolean;
  isAnyProcessing: boolean;
  isBuilding: boolean;
  isTestingThis: boolean;
  onToggle: () => void;
  onReject: () => void;
  onApprove: () => void;
  onTest: () => void;
};

export function ReviewMergeRequestCard({
  mr,
  index,
  total,
  creator,
  isExpanded,
  isProcessing,
  isAnyProcessing,
  isBuilding,
  isTestingThis,
  onToggle,
  onReject,
  onApprove,
  onTest,
}: ReviewMergeRequestCardProps) {
  const theme = useTheme();
  const status = React.useMemo(() => getMergeRequestStatusDisplay(mr.status), [mr.status]);
  const canAct = mr.status === 'open';

  const rotate = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(rotate, { toValue: isExpanded ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [isExpanded, rotate]);

  const position = total > 1 ? `${index + 1}/${total}` : 'Merge request';

  return (
    <Pressable onPress={onToggle} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
      <Card
        padded={false}
        style={[
          {
            padding: 16,
            backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
            borderWidth: 1,
            borderColor: withAlpha('#007A75', 0.2),
          } as any,
        ]}
      >
        {/* Collapsed header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} uri={creator?.avatar ?? null} name={creator?.name ?? undefined} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text, fontSize: 16, lineHeight: 20 }}
              numberOfLines={isExpanded ? undefined : 1}
            >
              {mr.title ?? 'Untitled merge request'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16 }} numberOfLines={1}>
              {creator?.name ?? 'Loading...'} · {position}
            </Text>
          </View>
          <Animated.View
            style={{
              transform: [{ rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
            }}
          >
            <ChevronDown size={20} color={withAlpha(theme.colors.textMuted, 0.4)} />
          </Animated.View>
        </View>

        {/* Expanded content */}
        {isExpanded ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: status.color,
                marginBottom: 8,
              }}
            >
              {status.text}
            </Text>

            <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginBottom: 12 }}>
              {creator
                ? `${creator.approvedOrMergedMergeRequests} approved merge${creator.approvedOrMergedMergeRequests !== 1 ? 's' : ''}`
                : 'Loading stats...'}
            </Text>

            {mr.description ? <MarkdownText markdown={mr.description} variant="mergeRequest" /> : null}
          </View>
        ) : null}

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: withAlpha(theme.colors.borderStrong, 0.5), marginTop: 12, marginBottom: 12 }} />

        {/* Action buttons - always visible */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ReviewMergeRequestActionButton
              accessibilityLabel="Reject"
              backgroundColor={theme.colors.danger}
              disabled={!canAct || isAnyProcessing}
              onPress={onReject}
              iconOnly={!isExpanded}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: isExpanded ? 4 : 0 }}>
                <X size={18} color="#FFFFFF" />
                {isExpanded ? (
                  <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: theme.typography.fontWeight.semibold }}>Reject</Text>
                ) : null}
              </View>
            </ReviewMergeRequestActionButton>

            <ReviewMergeRequestActionButton
              accessibilityLabel={!canAct ? 'Not actionable' : isProcessing ? 'Processing' : 'Approve'}
              backgroundColor="#16A34A"
              disabled={!canAct || isAnyProcessing}
              onPress={onApprove}
              iconOnly={!isExpanded}
            >
              {isProcessing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isExpanded ? 4 : 0 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  {isExpanded ? (
                    <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: theme.typography.fontWeight.semibold }}>
                      Processing
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isExpanded ? 4 : 0 }}>
                  <Check size={18} color="#FFFFFF" />
                  {isExpanded ? (
                    <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: theme.typography.fontWeight.semibold }}>Approve</Text>
                  ) : null}
                </View>
              )}
            </ReviewMergeRequestActionButton>
          </View>

          <ReviewMergeRequestActionButton
            accessibilityLabel="Test"
            backgroundColor={theme.colors.neutral}
            disabled={isBuilding || isTestingThis}
            onPress={onTest}
            iconOnly={!isExpanded}
          >
            {isTestingThis ? (
              <ActivityIndicator size="small" color="#888" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: isExpanded ? 4 : 0 }}>
                <Play size={14} color={theme.colors.text} />
                {isExpanded ? (
                  <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }}>Test</Text>
                ) : null}
              </View>
            )}
          </ReviewMergeRequestActionButton>
        </View>
      </Card>
    </Pressable>
  );
}


