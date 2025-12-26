import * as React from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Play } from 'lucide-react-native';

import { useTheme } from '../../theme';
import { withAlpha } from '../utils/color';
import { Text } from '../primitives/Text';
import { ChatComposer } from '../chat/ChatComposer';
import { CommentRow } from './CommentRow';
import { useAppComments } from './useAppComments';
import { useAppDetails } from './useAppDetails';
import { useIosKeyboardSnapFix } from './useIosKeyboardSnapFix';

export type AppCommentsSheetProps = {
  appId: string | null;
  onClose: () => void;
  onCountChange?: (count: number) => void;
  onPlayApp?: (appId: string) => void | Promise<void>;
};

export function AppCommentsSheet({ appId, onClose, onCountChange, onPlayApp }: AppCommentsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = React.useRef<BottomSheetModal | null>(null);
  const snapPoints = React.useMemo(() => ['50%', '90%'], []);

  const { comments, loading, sending, error, create, refresh } = useAppComments(appId);
  const { app, loading: loadingApp } = useAppDetails(appId);
  const { keyboardVisible } = useIosKeyboardSnapFix(sheetRef);

  React.useEffect(() => {
    if (appId) {
      sheetRef.current?.present();
      void refresh();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [appId, refresh]);

  React.useEffect(() => {
    if (!appId) return;
    onCountChange?.(comments.length);
  }, [appId, comments.length, onCountChange]);

  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />,
    []
  );

  const handleChange = React.useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const handlePlay = React.useCallback(async () => {
    if (!appId) return;
    sheetRef.current?.dismiss();
    await onPlayApp?.(appId);
    onClose();
  }, [appId, onClose, onPlayApp]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onChange={handleChange}
      backgroundStyle={{
        backgroundColor: theme.scheme === 'dark' ? '#0B080F' : '#FFFFFF',
        borderTopLeftRadius: Platform.OS === 'ios' ? 39 : 16,
        borderTopRightRadius: Platform.OS === 'ios' ? 39 : 16,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.handleIndicator }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      topInset={insets.top}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: withAlpha(theme.colors.border, 0.1),
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              marginRight: theme.spacing.sm,
              fontSize: 18,
              lineHeight: 22,
              fontWeight: theme.typography.fontWeight.bold,
            }}
          >
            {loadingApp ? 'Loading...' : app?.name || 'Comments'}
          </Text>

          <LiquidGlassView
            style={[
              { borderRadius: 24 },
              !isLiquidGlassSupported && { backgroundColor: theme.scheme === 'dark' ? '#18181B' : '#F6F6F6' },
            ]}
            interactive
            effect="clear"
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: appId ? 1 : 0.5,
              }}
            >
              <Pressable
                disabled={!appId}
                onPress={() => void handlePlay()}
                hitSlop={8}
                style={({ pressed }) => [
                  {
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Play size={16} color={theme.colors.onPrimary} />
              </Pressable>
            </View>
          </LiquidGlassView>
        </View>

        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {loading && comments.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : comments.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
                No comments yet
              </Text>
            </View>
          ) : (
            comments.map((c, idx) => <CommentRow key={c.id} comment={c} showDivider={idx < comments.length - 1} />)
          )}
          {error ? (
            <Text variant="captionMuted" style={{ marginTop: theme.spacing.lg }}>
              Failed to load comments.
            </Text>
          ) : null}
        </BottomSheetScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: Platform.OS === 'ios' ? (keyboardVisible ? theme.spacing.lg : insets.bottom) : insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: withAlpha(theme.colors.border, 0.1),
            backgroundColor: withAlpha(theme.colors.background, 0.8),
          }}
        >
          <ChatComposer
            placeholder="Write a comment..."
            disabled={sending}
            sending={sending}
            useBottomSheetTextInput
            onSend={async (text) => {
              await create(text);
              Keyboard.dismiss();
            }}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}


