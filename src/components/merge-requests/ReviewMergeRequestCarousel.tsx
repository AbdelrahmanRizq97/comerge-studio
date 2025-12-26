import * as React from 'react';
import { Animated, FlatList, View, useWindowDimensions, type ViewStyle } from 'react-native';

import type { MergeRequest } from '../../data/merge-requests/types';
import type { UserStats } from '../../data/users/types';
import { useTheme } from '../../theme';
import { ReviewMergeRequestCard } from './ReviewMergeRequestCard';

export type ReviewMergeRequestCarouselProps = {
  mergeRequests: MergeRequest[];
  creatorStatsById: Record<string, UserStats>;
  processingMrId?: string | null;
  isBuilding?: boolean;
  testingMrId?: string | null;
  onReject: (mr: MergeRequest) => void | Promise<void>;
  onApprove: (mr: MergeRequest) => void;
  onTest: (mr: MergeRequest) => void | Promise<void>;
  style?: ViewStyle;
};

type CardRenderItem = { mr: MergeRequest; index: number; total: number };

export function ReviewMergeRequestCarousel({
  mergeRequests,
  creatorStatsById,
  processingMrId,
  isBuilding,
  testingMrId,
  onReject,
  onApprove,
  onTest,
  style,
}: ReviewMergeRequestCarouselProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const carouselScrollX = React.useRef(new Animated.Value(0)).current;

  const peekAmount = 24;
  const gap = 16;
  const cardWidth = React.useMemo(() => Math.max(1, width - theme.spacing.lg * 2 - peekAmount), [peekAmount, theme.spacing.lg, width]);
  const snapInterval = cardWidth + gap;
  const dotColor = theme.scheme === 'dark' ? '#FFFFFF' : '#000000';

  if (mergeRequests.length === 0) return null;

  return (
    <View style={[{ marginHorizontal: -theme.spacing.lg }, style]}>
      <FlatList
        horizontal
        data={mergeRequests}
        keyExtractor={(mr) => mr.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={snapInterval}
        disableIntervalMomentum
        style={{ paddingRight: peekAmount }}
        ListFooterComponent={<View style={{ width: peekAmount }} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: carouselScrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const total = mergeRequests.length;
          const creator = creatorStatsById[item.createdBy];
          const isExpanded = Boolean(expanded[item.id]);
          const isProcessing = Boolean(processingMrId && processingMrId === item.id);
          const isAnyProcessing = Boolean(processingMrId);
          const isTestingThis = Boolean(testingMrId && testingMrId === item.id);
          return (
            <View style={{ width: cardWidth }}>
              <ReviewMergeRequestCard
                mr={item}
                index={index}
                total={total}
                creator={creator}
                isExpanded={isExpanded}
                isProcessing={isProcessing}
                isAnyProcessing={isAnyProcessing}
                isBuilding={Boolean(isBuilding)}
                isTestingThis={isTestingThis}
                onToggle={() => setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                onReject={() => void onReject(item)}
                onApprove={() => onApprove(item)}
                onTest={() => void onTest(item)}
              />
            </View>
          );
        }}
      />

      {mergeRequests.length >= 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', columnGap: 8, marginTop: theme.spacing.md }}>
          {mergeRequests.map((mr, index) => {
            const inputRange = [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval];

            const scale = carouselScrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });

            const opacity = carouselScrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={mr.id}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: dotColor,
                  transform: [{ scale }],
                  opacity,
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}


