import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import type { RelatedApp, RelatedApps } from '../../../data/apps/types';
import { Modal } from '../../../components/primitives/Modal';
import { Text } from '../../../components/primitives/Text';
import { PreviewStatusBadge } from '../../../components/preview/PreviewStatusBadge';
import { withAlpha } from '../../../components/utils/color';
import { useTheme } from '../../../theme';
import { SectionTitle } from './SectionTitle';

type RelatedAppListItem = {
  app: RelatedApp;
  section: 'original' | 'remix';
};

export type PreviewRelatedAppsSectionProps = {
  relatedApps?: RelatedApps | null;
  relatedAppsLoading?: boolean;
  switchingRelatedAppId?: string | null;
  onOpenRelatedApps?: () => void;
  onSwitchRelatedApp?: (targetAppId: string) => void;
};

const INLINE_VISIBLE_COUNT = 4;

function formatRelativeUpdatedAt(updatedAt: string): string {
  const parsed = new Date(updatedAt);
  const ms = parsed.getTime();
  if (!Number.isFinite(ms)) return 'Updated recently';

  const diffMs = Date.now() - ms;
  if (diffMs < 60_000) return 'Updated just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days}d ago`;

  return `Updated ${parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function PreviewRelatedAppsSection({
  relatedApps,
  relatedAppsLoading,
  switchingRelatedAppId,
  onOpenRelatedApps,
  onSwitchRelatedApp,
}: PreviewRelatedAppsSectionProps) {
  const theme = useTheme();
  const [relatedAppsOpen, setRelatedAppsOpen] = React.useState(false);

  const relatedAppItems = React.useMemo((): RelatedAppListItem[] => {
    if (!relatedApps) return [];

    const items: RelatedAppListItem[] = [];
    if (relatedApps.original) {
      items.push({ app: relatedApps.original, section: 'original' });
    }
    for (const remix of relatedApps.remixes) {
      items.push({ app: remix, section: 'remix' });
    }
    return items;
  }, [relatedApps]);

  const dedupedRelatedApps = React.useMemo(() => {
    const seen = new Set<string>();
    const items: RelatedAppListItem[] = [];
    for (const item of relatedAppItems) {
      if (seen.has(item.app.id)) continue;
      seen.add(item.app.id);
      items.push(item);
    }
    return items;
  }, [relatedAppItems]);

  const uniqueRelatedCount = dedupedRelatedApps.length;
  const shouldShowRelatedApps = uniqueRelatedCount >= 2;

  const currentAppId = relatedApps?.current.id;
  const originalAppId = relatedApps?.original?.id ?? null;

  const sectionedRelatedApps = React.useMemo(() => {
    const original: RelatedAppListItem[] = [];
    const remixes: RelatedAppListItem[] = [];
    for (const item of dedupedRelatedApps) {
      if (item.section === 'original') {
        original.push(item);
      } else {
        remixes.push(item);
      }
    }
    return { original, remixes };
  }, [dedupedRelatedApps]);

  const inlineItems = React.useMemo(() => dedupedRelatedApps.slice(0, INLINE_VISIBLE_COUNT), [dedupedRelatedApps]);
  const overflowCount = Math.max(0, uniqueRelatedCount - inlineItems.length);
  const canOpenModal = overflowCount > 0;

  const closeRelatedApps = React.useCallback(() => {
    setRelatedAppsOpen(false);
  }, []);

  const openRelatedApps = React.useCallback(() => {
    if (!canOpenModal) return;
    setRelatedAppsOpen(true);
    onOpenRelatedApps?.();
  }, [canOpenModal, onOpenRelatedApps]);

  const handleSelectRelatedApp = React.useCallback(
    (targetAppId: string) => {
      if (!relatedApps) return;
      if (targetAppId === relatedApps.current.id) return;
      onSwitchRelatedApp?.(targetAppId);
      setRelatedAppsOpen(false);
    },
    [onSwitchRelatedApp, relatedApps]
  );

  const renderBadges = React.useCallback(
    (item: RelatedAppListItem, isCurrent: boolean) => {
      const badges: React.ReactNode[] = [];

      if (item.app.id === originalAppId) {
        badges.push(
          <View
            key="original"
            style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: withAlpha(theme.colors.neutral, 0.4) }}
          >
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Original</Text>
          </View>
        );
      }

      if (isCurrent) {
        badges.push(
          <View
            key="current"
            style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.primary }}
          >
            <Text style={{ color: theme.colors.onPrimary, fontSize: 11 }}>Current</Text>
          </View>
        );
      }

      return badges;
    },
    [originalAppId, theme.colors.neutral, theme.colors.onPrimary, theme.colors.primary, theme.colors.textMuted]
  );

  const renderRelatedCard = React.useCallback(
    (item: RelatedAppListItem, options?: { fullWidth?: boolean }) => {
      const isCurrent = item.app.id === currentAppId;
      const isReady = item.app.status === 'ready';
      const isSwitching = switchingRelatedAppId === item.app.id;
      const disabled = isCurrent || !isReady || Boolean(switchingRelatedAppId);

      return (
        <Pressable
          key={item.app.id}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${item.app.name}, ${formatRelativeUpdatedAt(item.app.updatedAt).toLowerCase()}`}
          disabled={disabled}
          onPress={() => handleSelectRelatedApp(item.app.id)}
          style={{
            borderRadius: theme.radii.md,
            borderWidth: 1,
            borderColor: withAlpha(theme.colors.border, isCurrent ? 1 : 0.8),
            backgroundColor: isCurrent ? withAlpha(theme.colors.primary, 0.09) : withAlpha(theme.colors.surfaceRaised, 0.5),
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 8,
            opacity: disabled ? 0.7 : 1,
            width: options?.fullWidth ? undefined : 188,
            minWidth: options?.fullWidth ? undefined : 188,
            marginBottom: options?.fullWidth ? theme.spacing.sm : 0,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }}>
                {item.app.name}
              </Text>
              <Text style={{ marginTop: 2, color: theme.colors.textMuted, fontSize: 12 }}>
                {formatRelativeUpdatedAt(item.app.updatedAt)}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  minHeight: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {renderBadges(item, isCurrent)}
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{ minHeight: 20, justifyContent: 'center' }}>
                {!isReady ? <PreviewStatusBadge status={item.app.status} /> : null}
              </View>
              {isSwitching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [currentAppId, handleSelectRelatedApp, renderBadges, switchingRelatedAppId, theme]
  );

  if (!relatedAppsLoading && !shouldShowRelatedApps) return null;

  return (
    <>
      <SectionTitle>Related Apps</SectionTitle>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        {canOpenModal ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Open all related apps" onPress={openRelatedApps}>
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: theme.typography.fontWeight.semibold }}>
              See all ({uniqueRelatedCount})
            </Text>
          </Pressable>
        ) : null}
      </View>

      {relatedAppsLoading ? (
        <View style={{ height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xs }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
            paddingBottom: theme.spacing.xs,
            alignItems: 'flex-start',
          }}
        >
          {inlineItems.map((item) => renderRelatedCard(item))}
        </ScrollView>
      )}

      <Modal visible={relatedAppsOpen} onRequestClose={closeRelatedApps}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: theme.typography.fontWeight.semibold }}>
            Related apps
          </Text>

          {sectionedRelatedApps.original.length > 0 ? (
            <View>
              <Text style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Original</Text>
              {sectionedRelatedApps.original.map((item) => renderRelatedCard(item, { fullWidth: true }))}
            </View>
          ) : null}

          {sectionedRelatedApps.remixes.length > 0 ? (
            <View>
              <Text style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Remixes</Text>
              {sectionedRelatedApps.remixes.map((item) => renderRelatedCard(item, { fullWidth: true }))}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

