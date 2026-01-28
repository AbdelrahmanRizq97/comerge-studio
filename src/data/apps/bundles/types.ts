export type Platform = 'ios' | 'android';

export type BundleStatus = 'pending' | 'building' | 'succeeded' | 'failed';

export type BundleAssetKind = 'metro-assets' | string;

export type BundleAsset = {
  id: string;
  kind: BundleAssetKind;
  storageBucket: string;
  storageKey: string;
  contentType: string | null;
  size: number | null;
  checksumSha256: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Bundle = {
  id: string;
  appId: string;
  fingerprint: string;
  platform: Platform;
  status: BundleStatus;
  storageKey: string | null;
  size: number | null;
  checksumSha256: string | null;
  contentType: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  assets?: BundleAsset[];
};

export type InitiateBundleRequest = {
  commitId?: string;
  platform: Platform;
  expiresAt?: string; // ISO string
  idempotencyKey?: string;
};


