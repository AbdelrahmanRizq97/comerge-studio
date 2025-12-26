import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { App } from '../../../data/apps/types';
import { Text } from '../../../components/primitives/Text';
import { IconChat, IconChevronRight, IconDraw } from '../../../components/icons/StudioIcons';
import { withAlpha } from '../../../components/utils/color';
import { useTheme } from '../../../theme';
import { PressableCardRow } from './PressableCardRow';
import { SectionTitle } from './SectionTitle';
import { statusDescription } from './utils';

export type PreviewCustomizeSectionProps = {
  app: App;
  isOwner: boolean;
  shouldForkOnEdit: boolean;
  showProcessing: boolean;
  onGoToChat: () => void;
  onStartDraw?: () => void;
};

export function PreviewCustomizeSection({
  app,
  isOwner,
  shouldForkOnEdit,
  showProcessing,
  onGoToChat,
  onStartDraw,
}: PreviewCustomizeSectionProps) {
  const theme = useTheme();

  return (
    <>
      <SectionTitle>Customize</SectionTitle>

      {showProcessing ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.lg,
            borderRadius: theme.radii.lg,
            backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
            borderWidth: 1,
            borderColor: withAlpha(theme.colors.warning, 0.2),
            marginBottom: theme.spacing.sm,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(theme.colors.warning, 0.1),
              marginRight: theme.spacing.lg,
            }}
          >
            <ActivityIndicator color={theme.colors.warning} size="small" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, lineHeight: 20, fontWeight: theme.typography.fontWeight.semibold }}>
              {app.status === 'error' ? 'Error' : 'Processing'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
              {statusDescription(app.status, app.statusError)}
            </Text>
          </View>
        </View>
      ) : null}

      <PressableCardRow
        accessibilityLabel={isOwner ? 'Edit app' : 'Remix app'}
        onPress={onGoToChat}
        style={{
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
          borderWidth: 1,
          borderColor: withAlpha(theme.colors.primary, 0.1),
          marginBottom: theme.spacing.sm,
        }}
        left={
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(theme.colors.primary, 0.1),
              marginRight: theme.spacing.lg,
            }}
          >
            <IconChat size={20} colorToken="primary" />
          </View>
        }
        title={
          <Text style={{ color: theme.colors.text, fontSize: 16, lineHeight: 20, fontWeight: theme.typography.fontWeight.semibold }}>
            {isOwner ? (app.forkedFromAppId ? 'Edit your Remix' : 'Edit Your App') : 'Remix App'}
          </Text>
        }
        subtitle={
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
            {isOwner && app.forkedFromAppId
              ? 'Make changes to your remix with chat'
              : shouldForkOnEdit
                ? 'Chat to create your own copy and edit it'
                : 'Chat to apply changes'}
          </Text>
        }
        right={<IconChevronRight size={20} colorToken="textMuted" />}
      />

      {isOwner && onStartDraw ? (
        <PressableCardRow
          accessibilityLabel="Draw changes"
          onPress={onStartDraw}
          style={{
            padding: theme.spacing.lg,
            borderRadius: theme.radii.lg,
            backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
            borderWidth: 1,
            borderColor: withAlpha(theme.colors.danger, 0.1),
            marginBottom: theme.spacing.sm,
          }}
          left={
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: withAlpha(theme.colors.danger, 0.1),
                marginRight: theme.spacing.lg,
              }}
            >
              <IconDraw size={20} colorToken="danger" />
            </View>
          }
          title={
            <Text style={{ color: theme.colors.text, fontSize: 16, lineHeight: 20, fontWeight: theme.typography.fontWeight.semibold }}>
              Draw Changes
            </Text>
          }
          subtitle={
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
              Annotate the app with drawings
            </Text>
          }
          right={<IconChevronRight size={20} colorToken="textMuted" />}
        />
      ) : null}
    </>
  );
}


