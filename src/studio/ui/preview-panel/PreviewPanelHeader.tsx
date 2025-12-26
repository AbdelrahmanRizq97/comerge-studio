import * as React from 'react';
import { View } from 'react-native';

import { StudioSheetHeader } from '../../../components/studio-sheet/StudioSheetHeader';
import { StudioSheetHeaderIconButton } from '../../../components/studio-sheet/StudioSheetHeaderIconButton';
import { IconChat, IconClose, IconHome } from '../../../components/icons/StudioIcons';

export type PreviewPanelHeaderProps = {
  isOwner: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
  onGoToChat: () => void;
};

export function PreviewPanelHeader({ isOwner, onClose, onNavigateHome, onGoToChat }: PreviewPanelHeaderProps) {
  return (
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
          <StudioSheetHeaderIconButton onPress={onClose} accessibilityLabel="Close" appearance="glass" intent="primary">
            <IconClose size={20} colorToken="onPrimary" />
          </StudioSheetHeaderIconButton>
        </View>
      }
    />
  );
}


