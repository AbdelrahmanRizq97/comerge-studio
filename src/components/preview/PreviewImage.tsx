import * as React from 'react';
import { Image, type ImageStyle } from 'react-native';

export type PreviewImageProps = {
  uri?: string | null;
  onLoad?: () => void;
  style?: ImageStyle;
};

export function PreviewImage({ uri, onLoad, style }: PreviewImageProps) {
  if (!uri) return null;
  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      onLoad={onLoad}
      style={[{ width: '100%', height: '100%' }, style]}
    />
  );
}


