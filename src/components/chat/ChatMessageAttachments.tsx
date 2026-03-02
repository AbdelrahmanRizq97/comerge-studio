import * as React from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import type { ChatAttachment } from '../models/types';
import { useTheme } from '../../theme';
import { Text } from '../primitives/Text';
import { IconClose } from '../icons/StudioIcons';

export type ChatMessageAttachmentsProps = {
  messageId: string;
  attachments: ChatAttachment[];
  align?: 'left' | 'right';
  onAttachmentLoadError?: (messageId: string, attachmentId: string) => void;
};

export function ChatMessageAttachments({
  messageId,
  attachments,
  align = 'left',
  onAttachmentLoadError,
}: ChatMessageAttachmentsProps) {
  const theme = useTheme();
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState(0);
  const failedKeysRef = React.useRef<Set<string>>(new Set());
  const [loadingById, setLoadingById] = React.useState<Record<string, boolean>>({});
  const [modalLoadingById, setModalLoadingById] = React.useState<Record<string, boolean>>({});
  const pulse = React.useRef(new Animated.Value(0.45)).current;

  const imageAttachments = React.useMemo(
    () =>
      attachments.filter(
        (att) =>
          att.mimeType.startsWith('image/') &&
          typeof att.uri === 'string' &&
          att.uri.length > 0
      ),
    [attachments]
  );

  const itemHeight = imageAttachments.length === 1 ? 180 : 124;
  const maxItemWidth = imageAttachments.length === 1 ? 280 : 180;

  const getAspectRatio = (att: ChatAttachment) => {
    const width = typeof att.width === 'number' ? att.width : 0;
    const height = typeof att.height === 'number' ? att.height : 0;
    if (width > 0 && height > 0) {
      return Math.max(0.35, Math.min(2.4, width / height));
    }
    return 0.8;
  };

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  React.useEffect(() => {
    if (imageAttachments.length === 0) {
      setLoadingById({});
      setModalLoadingById({});
      return;
    }
    setLoadingById((prev) => {
      const next: Record<string, boolean> = {};
      for (const att of imageAttachments) {
        next[att.id] = prev[att.id] ?? true;
      }
      return next;
    });
  }, [imageAttachments]);

  React.useEffect(() => {
    if (!viewerVisible) return;
    if (imageAttachments.length === 0) {
      setModalLoadingById({});
      return;
    }
    setModalLoadingById(() => {
      const next: Record<string, boolean> = {};
      for (const att of imageAttachments) {
        next[att.id] = true;
      }
      return next;
    });
  }, [viewerVisible, imageAttachments]);

  if (imageAttachments.length === 0) return null;

  const handleError = (attachmentId: string) => {
    const key = `${messageId}:${attachmentId}`;
    if (failedKeysRef.current.has(key)) return;
    failedKeysRef.current.add(key);
    onAttachmentLoadError?.(messageId, attachmentId);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        {imageAttachments.map((att, index) => (
          <Pressable
            key={att.id}
            onPress={() => {
              setViewerIndex(index);
              setViewerVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Attachment ${index + 1} of ${imageAttachments.length}`}
            style={{
              height: itemHeight,
              aspectRatio: getAspectRatio(att),
              maxWidth: maxItemWidth,
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
            }}
          >
            {loadingById[att.id] ? (
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  opacity: pulse,
                  backgroundColor: theme.colors.border,
                }}
              />
            ) : null}
            <ExpoImage
              source={{ uri: att.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={140}
              cachePolicy="memory-disk"
              onLoadStart={() => {
                setLoadingById((prev) => ({ ...prev, [att.id]: true }));
              }}
              onLoadEnd={() => {
                setLoadingById((prev) => ({ ...prev, [att.id]: false }));
              }}
              onError={() => handleError(att.id)}
            />
          </Pressable>
        ))}
      </View>

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <View
            style={{
              position: 'absolute',
              top: 56,
              right: 16,
              zIndex: 2,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close attachment viewer"
              onPress={() => setViewerVisible(false)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <IconClose size={18} colorToken="onPrimary" />
            </Pressable>
          </View>
          <FlatList
            data={imageAttachments}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => {
              const width = Dimensions.get('window').width;
              return { length: width, offset: width * index, index };
            }}
            renderItem={({ item, index }) => (
              <View style={{ width: Dimensions.get('window').width, height: '100%', justifyContent: 'center' }}>
                {modalLoadingById[item.id] ? (
                  <Animated.View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      opacity: pulse,
                      backgroundColor: theme.colors.border,
                    }}
                  />
                ) : null}
                <ExpoImage
                  source={{ uri: item.uri }}
                  style={{ width: '100%', height: '78%' }}
                  contentFit="contain"
                  transition={140}
                  cachePolicy="memory-disk"
                  onLoadStart={() => {
                    setModalLoadingById((prev) => ({ ...prev, [item.id]: true }));
                  }}
                  onLoadEnd={() => {
                    setModalLoadingById((prev) => ({ ...prev, [item.id]: false }));
                  }}
                  onError={() => handleError(item.id)}
                />
                <Text
                  variant="caption"
                  color="#FFFFFF"
                  style={{ textAlign: 'center', marginTop: theme.spacing.sm }}
                >
                  {index + 1} / {imageAttachments.length}
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

