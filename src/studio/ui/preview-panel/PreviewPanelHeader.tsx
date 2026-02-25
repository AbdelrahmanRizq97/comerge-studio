import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { RelatedApp, RelatedApps } from '../../../data/apps/types';
import { StudioSheetHeader } from '../../../components/studio-sheet/StudioSheetHeader';
import { StudioSheetHeaderIconButton } from '../../../components/studio-sheet/StudioSheetHeaderIconButton';
import { IconChat, IconChevronDown, IconClose, IconHome, IconShare } from '../../../components/icons/StudioIcons';
import { Modal } from '../../../components/primitives/Modal';
import { Text } from '../../../components/primitives/Text';
import { PreviewStatusBadge } from '../../../components/preview/PreviewStatusBadge';
import { useTheme } from '../../../theme';

export type PreviewPanelHeaderProps = {
  isOwner: boolean;
  isPublic: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
  onGoToChat: () => void;
  onShare?: () => void;
  relatedApps?: RelatedApps | null;
  relatedAppsLoading?: boolean;
  switchingRelatedAppId?: string | null;
  onOpenRelatedApps?: () => void;
  onSwitchRelatedApp?: (targetAppId: string) => void;
};

type RelatedAppListItem = {
  app: RelatedApp;
  section: 'original' | 'remix';
};

export function PreviewPanelHeader({
  isOwner,
  isPublic,
  onClose,
  onNavigateHome,
  onGoToChat,
  onShare,
  relatedApps,
  relatedAppsLoading,
  switchingRelatedAppId,
  onOpenRelatedApps,
  onSwitchRelatedApp,
}: PreviewPanelHeaderProps) {
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

  const uniqueRelatedCount = React.useMemo(() => {
    return new Set(relatedAppItems.map((item) => item.app.id)).size;
  }, [relatedAppItems]);

  const shouldShowRelatedApps = uniqueRelatedCount >= 2;

  const currentAppId = relatedApps?.current.id;
  const originalAppId = relatedApps?.original?.id ?? null;

  const sectionedRelatedApps = React.useMemo(() => {
    const original: RelatedAppListItem[] = [];
    const remixes: RelatedAppListItem[] = [];
    const seenIds = new Set<string>();
    for (const item of relatedAppItems) {
      if (seenIds.has(item.app.id)) continue;
      seenIds.add(item.app.id);
      if (item.section === 'original') {
        original.push(item);
      } else {
        remixes.push(item);
      }
    }
    return { original, remixes };
  }, [relatedAppItems]);

  const openRelatedApps = React.useCallback(() => {
    setRelatedAppsOpen(true);
    onOpenRelatedApps?.();
  }, [onOpenRelatedApps]);

  const closeRelatedApps = React.useCallback(() => {
    setRelatedAppsOpen(false);
  }, []);

  const handleSelectRelatedApp = React.useCallback(
    (targetAppId: string) => {
      if (!relatedApps) return;
      if (targetAppId === relatedApps.current.id) return;
      onSwitchRelatedApp?.(targetAppId);
      setRelatedAppsOpen(false);
    },
    [onSwitchRelatedApp, relatedApps]
  );

  const renderRelatedRow = React.useCallback(
    (item: RelatedAppListItem) => {
      const app = item.app;
      const isCurrent = app.id === currentAppId;
      const isOriginal = app.id === originalAppId;
      const isReady = app.status === 'ready';
      const isSwitching = switchingRelatedAppId === app.id;
      const disabled = isCurrent || !isReady || Boolean(switchingRelatedAppId);

      return (
        <Pressable
          key={app.id}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${app.name}`}
          disabled={disabled}
          onPress={() => handleSelectRelatedApp(app.id)}
          style={{
            borderRadius: theme.radii.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text numberOfLines={1} style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }}>
                {app.name}
              </Text>
              <View style={{ height: 4 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                {isOriginal ? (
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.neutral }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Original</Text>
                  </View>
                ) : null}
                {isCurrent ? (
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.primary }}>
                    <Text style={{ color: theme.colors.onPrimary, fontSize: 11 }}>Current</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              {app.status ? <PreviewStatusBadge status={app.status} /> : null}
              {isSwitching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [currentAppId, handleSelectRelatedApp, originalAppId, switchingRelatedAppId, theme]
  );

  return (
    <>
      <StudioSheetHeader
        left={
          onNavigateHome ? (
            <StudioSheetHeaderIconButton onPress={onNavigateHome} accessibilityLabel="Home" appearance="glass" intent="primary">
              <IconHome size={20} colorToken="onPrimary" />
            </StudioSheetHeaderIconButton>
          ) : null
        }
        center={null}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isOwner ? (
              <StudioSheetHeaderIconButton
                onPress={onGoToChat}
                accessibilityLabel="Chat"
                intent="primary"
                appearance="glass"
                style={{ marginRight: 8 }}
              >
                <IconChat size={20} colorToken="onPrimary" />
              </StudioSheetHeaderIconButton>
            ) : null}
            {isPublic && onShare ? (
              <StudioSheetHeaderIconButton
                onPress={onShare}
                accessibilityLabel="Share"
                intent="primary"
                appearance="glass"
                style={{ marginRight: 8 }}
              >
                <IconShare size={20} colorToken="onPrimary" />
              </StudioSheetHeaderIconButton>
            ) : null}
            {shouldShowRelatedApps ? (
              <StudioSheetHeaderIconButton
                onPress={openRelatedApps}
                accessibilityLabel="Related apps"
                intent="primary"
                appearance="glass"
                style={{ marginRight: 8 }}
              >
                {relatedAppsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <IconChevronDown size={20} colorToken="onPrimary" />
                )}
              </StudioSheetHeaderIconButton>
            ) : null}
            <StudioSheetHeaderIconButton onPress={onClose} accessibilityLabel="Close" appearance="glass" intent="primary">
              <IconClose size={20} colorToken="onPrimary" />
            </StudioSheetHeaderIconButton>
          </View>
        }
      />

      <Modal visible={relatedAppsOpen} onRequestClose={closeRelatedApps}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: theme.typography.fontWeight.semibold }}>
            Related apps
          </Text>

          {sectionedRelatedApps.original.length > 0 ? (
            <View>
              <Text style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Original</Text>
              {sectionedRelatedApps.original.map(renderRelatedRow)}
            </View>
          ) : null}

          {sectionedRelatedApps.remixes.length > 0 ? (
            <View>
              <Text style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Remixes</Text>
              {sectionedRelatedApps.remixes.map(renderRelatedRow)}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}


