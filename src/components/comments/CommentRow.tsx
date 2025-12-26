import * as React from 'react';
import { View } from 'react-native';

import type { AppComment } from '../../data/comments/types';
import { usersRepository } from '../../data/users/repository';
import { useTheme } from '../../theme';
import { Avatar } from '../primitives/Avatar';
import { Text } from '../primitives/Text';
import { withAlpha } from '../utils/color';
import { formatTimeAgo } from './formatTimeAgo';

export function CommentRow({ comment, showDivider }: { comment: AppComment; showDivider: boolean }) {
  const theme = useTheme();
  const [authorName, setAuthorName] = React.useState<string | null>(null);
  const [authorAvatar, setAuthorAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await usersRepository.getStats(comment.authorId);
        if (cancelled) return;
        setAuthorName(stats.name);
        setAuthorAvatar(stats.avatar);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [comment.authorId]);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: withAlpha(theme.colors.border, 0.5),
      }}
    >
      <Avatar size={32} uri={authorAvatar} name={authorName ?? comment.authorId} style={{ marginTop: 6 }} />

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text style={{ fontSize: 14, lineHeight: 18, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text }}>
            {authorName ?? 'Unknown User'}
          </Text>
          <Text style={{ fontSize: 12, lineHeight: 16, color: theme.colors.textMuted }}>
            {formatTimeAgo(comment.createdAt)}
          </Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
          {comment.body ?? comment.description ?? ''}
        </Text>
      </View>
    </View>
  );
}


