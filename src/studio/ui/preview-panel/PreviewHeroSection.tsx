import * as React from 'react';

import type { App } from '../../../data/apps/types';
import { PreviewHeroCard } from '../../../components/preview/PreviewHeroCard';
import { PreviewPlaceholder } from '../../../components/preview/PreviewPlaceholder';
import { PreviewImage } from '../../../components/preview/PreviewImage';
import { StatsBar } from '../../../components/preview/StatsBar';
import { PreviewStatusBadge } from '../../../components/preview/PreviewStatusBadge';

export type PreviewHeroSectionProps = {
  appStatus: App['status'];
  showProcessing: boolean;
  imageUrl: string | null;
  imageLoaded: boolean;
  onImageLoad: () => void;
  stats: {
    likeCount: number;
    commentCount: number;
    forkCount: number;
    isLiked: boolean;
    handleLike: () => Promise<void> | void;
    handleOpenComments: () => void;
  };
};

export function PreviewHeroSection({
  appStatus,
  showProcessing,
  imageUrl,
  imageLoaded,
  onImageLoad,
  stats,
}: PreviewHeroSectionProps) {
  return (
    <PreviewHeroCard
      overlayTopLeft={showProcessing ? <PreviewStatusBadge status={appStatus} /> : null}
      background={<PreviewPlaceholder visible={!imageLoaded} />}
      image={<PreviewImage uri={imageUrl} onLoad={onImageLoad} />}
      overlayBottom={
        <StatsBar
          likeCount={stats.likeCount}
          commentCount={stats.commentCount}
          forkCount={stats.forkCount}
          isLiked={stats.isLiked}
          onPressLike={() => void stats.handleLike()}
          onPressComments={stats.handleOpenComments}
          centered
          fixedWidth={160}
        />
      }
      style={{ marginBottom: 16 }}
    />
  );
}


