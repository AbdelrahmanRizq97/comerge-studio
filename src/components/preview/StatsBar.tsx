import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Heart, MessageCircle } from 'lucide-react-native';

import { useTheme } from '../../theme';
import { Text } from '../primitives/Text';
import { MergeIcon } from '../icons/MergeIcon';
import { ResettableLiquidGlassView } from '../utils/ResettableLiquidGlassView';

export type StatsBarProps = {
  likeCount: number;
  commentCount: number;
  forkCount: number;
  isLiked?: boolean;
  onPressLike?: () => void;
  onPressComments?: () => void;
  style?: ViewStyle;
  centered?: boolean;
  fixedWidth?: number;
};

export function StatsBar({
  likeCount,
  commentCount,
  forkCount,
  isLiked = false,
  onPressLike,
  onPressComments,
  style,
  centered = false,
  fixedWidth,
}: StatsBarProps) {
  const theme = useTheme();
  const statsBgColor = theme.scheme === 'dark' ? 'rgba(24, 24, 27, 0.5)' : 'rgba(255, 255, 255, 0.5)';

  return (
    <View
      style={[
        { position: 'absolute', bottom: 12, width: '100%', paddingHorizontal: 12 },
        centered && { alignItems: 'center' },
        style,
      ]}
    >
      <ResettableLiquidGlassView
        style={[
          { borderRadius: 100, overflow: 'hidden' },
          fixedWidth ? { width: fixedWidth } : undefined,
          !isLiquidGlassSupported && { backgroundColor: statsBgColor },
        ]}
        effect="clear"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <Pressable
            disabled={!onPressLike}
            onPress={onPressLike}
            hitSlop={8}
            style={{ paddingVertical: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Heart
                size={16}
                strokeWidth={2.5}
                color={isLiked ? theme.colors.danger : '#FFFFFF'}
                fill={isLiked ? theme.colors.danger : 'transparent'}
              />
              <View style={{ width: 4 }} />
              <Text
                variant="caption"
                style={{
                  color: isLiked ? theme.colors.danger : '#FFFFFF',
                  fontWeight: theme.typography.fontWeight.bold,
                }}
              >
                {likeCount}
              </Text>
            </View>
          </Pressable>

          <Pressable
            disabled={!onPressComments}
            onPress={onPressComments}
            hitSlop={8}
            style={{ paddingVertical: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MessageCircle size={16} strokeWidth={2.5} color="#FFFFFF" />
              <View style={{ width: 4 }} />
              <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: theme.typography.fontWeight.bold }}>
                {commentCount}
              </Text>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <MergeIcon width={14} height={14} color="#FFFFFF" />
            </View>
            <View style={{ width: 4 }} />
            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: theme.typography.fontWeight.bold }}>
              {forkCount}
            </Text>
          </View>
        </View>
      </ResettableLiquidGlassView>
    </View>
  );
}


