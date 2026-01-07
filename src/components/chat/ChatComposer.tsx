import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Plus } from 'lucide-react-native';

import { useTheme } from '../../theme';
import { MultilineTextInput } from './MultilineTextInput';
import { IconChevronRight, IconClose } from '../icons/StudioIcons';

export type ChatComposerProps = {
  value?: string;
  onChangeValue?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  sendDisabled?: boolean;
  sending?: boolean;
  autoFocus?: boolean;
  onSend: (text: string, attachments?: string[]) => void | Promise<void>;
  attachments?: string[];
  onRemoveAttachment?: (index: number) => void;
  onAddAttachment?: () => void;
  renderAddAttachment?: () => React.ReactNode;
  renderRemoveIcon?: () => React.ReactNode;
  renderSendIcon?: () => React.ReactNode;
  useBottomSheetTextInput?: boolean;
  onLayout?: (e: { height: number }) => void;
  style?: ViewStyle;
};

const THUMBNAIL_HEIGHT = 90;

function AspectRatioThumbnail({
  uri,
  onRemove,
  renderRemoveIcon,
}: {
  uri: string;
  onRemove?: () => void;
  renderRemoveIcon?: () => React.ReactNode;
}) {
  const [aspectRatio, setAspectRatio] = React.useState(1);

  return (
    <View style={{ height: THUMBNAIL_HEIGHT, aspectRatio, position: 'relative' }}>
      <View style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          onLoad={(e) => {
            const { width, height } = (e as any).nativeEvent?.source ?? {};
            if (width && height) setAspectRatio(width / height);
          }}
        />
      </View>
      {onRemove ? (
        <Pressable
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onPress={onRemove}
          hitSlop={10}
        >
          {renderRemoveIcon ? renderRemoveIcon() : <IconClose size={12} colorToken="onPrimary" />}
        </Pressable>
      ) : null}
    </View>
  );
}

export function ChatComposer({
  value,
  onChangeValue,
  placeholder = 'Describe the idea you want to build',
  disabled = false,
  sendDisabled = false,
  sending = false,
  autoFocus = false,
  onSend,
  attachments = [],
  onRemoveAttachment,
  onAddAttachment,
  renderAddAttachment,
  renderRemoveIcon,
  renderSendIcon,
  useBottomSheetTextInput,
  onLayout,
  style,
}: ChatComposerProps) {
  const theme = useTheme();
  const [internal, setInternal] = React.useState('');
  const text = value ?? internal;
  const setText = onChangeValue ?? setInternal;
  const hasAttachments = attachments.length > 0;
  const hasText = text.trim().length > 0;
  const composerMinHeight = hasAttachments ? THUMBNAIL_HEIGHT + 44 + 24 : 44;

  const isButtonDisabled = sending || disabled || sendDisabled;
  const maxInputHeight = React.useMemo(() => Dimensions.get('window').height * 0.5, []);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const [sendPressed, setSendPressed] = React.useState(false);
  const inputRef = React.useRef<import('react-native').TextInput | null>(null);
  const prevAutoFocusRef = React.useRef(false);

  React.useEffect(() => {
    const shouldFocus = autoFocus && !prevAutoFocusRef.current && !disabled && !sending;
    prevAutoFocusRef.current = autoFocus;
    if (!shouldFocus) return;

    // Temporary workaround: Bottom sheets can take a moment to open
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 75);
    return () => clearTimeout(t);
  }, [autoFocus, disabled, sending]);

  const triggerShake = React.useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSend = React.useCallback(async () => {
    if (isButtonDisabled) return;
    // Require at least one character of text (attachments alone not enough)
    if (!hasText) {
      triggerShake();
      return;
    }
    const trimmed = text.trim();
    await onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
  }, [attachments, hasText, isButtonDisabled, onSend, setText, text, triggerShake]);

  const textareaBgColor = theme.scheme === 'dark' ? '#18181B' : '#F6F6F6';
  const placeholderTextColor = theme.scheme === 'dark' ? '#A1A1AA' : '#71717A';

  return (
    <View
      style={[{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 }, style]}
      onLayout={(e) => onLayout?.({ height: e.nativeEvent.layout.height })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>
          <LiquidGlassView
            style={[
              // LiquidGlassView doesn't reliably auto-size to children; ensure enough height for the
              // thumbnail strip when attachments are present.
              { borderRadius: 24, flex: 1, minHeight: composerMinHeight },
              !isLiquidGlassSupported && { backgroundColor: textareaBgColor },
            ]}
            interactive
            effect="clear"
          >
            {hasAttachments ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingTop: 12 }}
              >
                {attachments.map((uri, index) => (
                  <AspectRatioThumbnail
                    key={`attachment-${index}`}
                    uri={uri}
                    onRemove={onRemoveAttachment ? () => onRemoveAttachment(index) : undefined}
                    renderRemoveIcon={renderRemoveIcon}
                  />
                ))}
                {onAddAttachment ? (
                  renderAddAttachment ? (
                    renderAddAttachment()
                  ) : (
                    <Pressable
                      style={{
                        height: THUMBNAIL_HEIGHT,
                        aspectRatio: 0.6,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      }}
                      onPress={onAddAttachment}
                    >
                      <Plus size={24} color="rgba(255, 255, 255, 0.5)" />
                    </Pressable>
                  )
                ) : null}
              </ScrollView>
            ) : null}

            <MultilineTextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              editable={!disabled && !sending}
              useBottomSheetTextInput={useBottomSheetTextInput}
              autoFocus={autoFocus}
              placeholderTextColor={placeholderTextColor}
              scrollEnabled
              style={{
                maxHeight: maxInputHeight,
                minHeight: 44,
                color: theme.scheme === 'dark' ? '#FAFAFA' : '#09090B',
                paddingHorizontal: 16,
                paddingVertical: 12,
                lineHeight: 20,
              }}
            />
          </LiquidGlassView>
        </Animated.View>

        <LiquidGlassView
          style={[{ borderRadius: 100 }, !isLiquidGlassSupported && { backgroundColor: textareaBgColor }]}
          interactive
          effect="clear"
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: 'hidden',
              backgroundColor: theme.colors.primary,
              opacity: isButtonDisabled ? 0.6 : sendPressed ? 0.9 : 1,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              disabled={isButtonDisabled}
              onPress={handleSend}
              onPressIn={() => setSendPressed(true)}
              onPressOut={() => setSendPressed(false)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {sending ? (
                <ActivityIndicator />
              ) : renderSendIcon ? (
                renderSendIcon()
              ) : (
                <IconChevronRight size={20} colorToken="onPrimary" />
              )}
            </Pressable>
          </View>
        </LiquidGlassView>
      </View>
    </View>
  );
}


