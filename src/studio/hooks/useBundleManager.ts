import * as React from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { unzip } from 'react-native-zip-archive';

import type { Platform as BundlePlatform, Bundle, BundleAsset } from '../../data/apps/bundles/types';
import { bundlesRepository } from '../../data/apps/bundles/repository';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableNetworkError(e: unknown): boolean {
  const err = e as any;
  const code = typeof err?.code === 'string' ? err.code : '';
  const message = typeof err?.message === 'string' ? err.message : '';

  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  if (message.toLowerCase().includes('network error')) return true;
  if (message.toLowerCase().includes('timeout')) return true;

  const status = typeof err?.response?.status === 'number' ? err.response.status : undefined;
  if (status && (status === 429 || status >= 500)) return true;

  return false;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; baseDelayMs: number; maxDelayMs: number }
): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= opts.attempts; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const retryable = isRetryableNetworkError(e);
      if (!retryable || attempt >= opts.attempts) {
        throw e;
      }
      const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(2, attempt - 1));
      const jitter = Math.floor(Math.random() * 250);
      await sleep(exp + jitter);
    }
  }
  throw lastErr;
}

type BundleSource = {
  appId: string;
  commitId?: string | null;
};

export type UseBundleManagerParams = {
  base: BundleSource;
  platform: BundlePlatform;
  /**
   * When false, we will NOT initiate/build/download the latest base bundle.
   * We'll keep rendering whatever base bundle we already have (or hydrate from disk).
   *
   * Test bundles (merge request previews) are NOT gated by this.
   */
  canRequestLatest?: boolean;
  embeddedBaseBundles?: EmbeddedBaseBundles;
};

export type BundleLoadState = {
  bundlePath: string | null;
  /**
   * Monotonic token to force runtime remount when the bundle file path stays the same
   * (e.g. base bundle is replaced in-place).
   */
  renderToken: number;
  loading: boolean;
  loadingMode: 'base' | 'test' | null;
  statusLabel: string | null;
  error: string | null;
  /**
   * True when showing a temporary/testing bundle (e.g. merge request preview).
   */
  isTesting: boolean;
};

export type UseBundleManagerResult = BundleLoadState & {
  loadBase: () => Promise<void>;
  loadTest: (src: BundleSource) => Promise<void>;
  restoreBase: () => Promise<void>;
};

export type EmbeddedBaseBundle = {
  module: number;
  meta?: BaseBundleMeta | null;
  assetsModule?: number;
  assetsMeta?: EmbeddedAssetsMeta | null;
};

export type EmbeddedBaseBundles = {
  ios?: EmbeddedBaseBundle;
  android?: EmbeddedBaseBundle;
};

type EmbeddedAssetsMeta = {
  checksumSha256: string | null;
  size: number | null;
};

function safeName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function bundlesCacheDir(): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('expo-file-system cacheDirectory is not available.');
  }
  return `${FileSystem.cacheDirectory}comerge/bundles/`;
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return;
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

async function ensureBundleDir(key: string) {
  await ensureDir(bundlesCacheDir());
  await ensureDir(bundleDir(key));
}

function baseBundleKey(appId: string, platform: BundlePlatform): string {
  return `base:${appId}:${platform}`;
}

function testBundleKey(appId: string, commitId: string | null | undefined, platform: BundlePlatform, bundleId: string): string {
  return `test:${appId}:${commitId ?? 'head'}:${platform}:${bundleId}`;
}

function legacyBundleFileUri(key: string): string {
  const dir = bundlesCacheDir();
  return `${dir}${safeName(key)}.jsbundle`;
}

function legacyBundleMetaFileUri(key: string): string {
  const dir = bundlesCacheDir();
  return `${dir}${safeName(key)}.meta.json`;
}

function bundleDir(key: string): string {
  const dir = bundlesCacheDir();
  return `${dir}${safeName(key)}/`;
}

function toBundleFileUri(key: string, platform: BundlePlatform): string {
  return `${bundleDir(key)}index.${platform}.jsbundle`;
}

function toBundleMetaFileUri(key: string): string {
  return `${bundleDir(key)}bundle.meta.json`;
}

function toAssetsMetaFileUri(key: string): string {
  return `${bundleDir(key)}assets.meta.json`;
}

function toAssetsDir(key: string): string {
  return `${bundleDir(key)}assets/`;
}

type BaseBundleMeta = {
  fingerprint: string;
  bundleId: string;
  checksumSha256: string | null;
  size: number | null;
  updatedAt: string;
};

async function readJsonFile<T>(fileUri: string): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return null;
    const raw = await (FileSystem as any).readAsStringAsync(fileUri);
    if (!raw || !String(raw).trim()) return null;
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(fileUri: string, value: unknown): Promise<void> {
  try {
    await (FileSystem as any).writeAsStringAsync(fileUri, JSON.stringify(value));
  } catch {

  }
}

async function getExistingNonEmptyFileUri(fileUri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists && info.size && info.size > 0) return fileUri;
    return null;
  } catch {
    return null;
  }
}

async function getExistingBundleFileUri(key: string, platform: BundlePlatform): Promise<string | null> {
  const nextPath = toBundleFileUri(key, platform);
  const next = await getExistingNonEmptyFileUri(nextPath);
  if (next) return next;
  const legacyPath = legacyBundleFileUri(key);
  const legacy = await getExistingNonEmptyFileUri(legacyPath);
  return legacy;
}

async function downloadIfMissing(url: string, fileUri: string): Promise<string> {
  const existing = await getExistingNonEmptyFileUri(fileUri);
  if (existing) return existing;
  return await withRetry(
    async () => {
      await deleteFileIfExists(fileUri);
      const res = await FileSystem.downloadAsync(url, fileUri);
      const ok = await getExistingNonEmptyFileUri(res.uri);
      if (!ok) throw new Error('Downloaded bundle is empty.');
      return res.uri;
    },
    { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
  );
}

async function deleteFileIfExists(fileUri: string) {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return;
    await FileSystem.deleteAsync(fileUri).catch(() => { });
  } catch {

  }
}

async function hydrateBaseFromEmbeddedAsset(
  appId: string,
  platform: BundlePlatform,
  embedded: EmbeddedBaseBundle | undefined
): Promise<{ bundlePath: string; meta?: BaseBundleMeta | null } | null> {
  if (!embedded?.module) return null;
  const key = baseBundleKey(appId, platform);
  const existing = await getExistingBundleFileUri(key, platform);
  if (existing) {
    return { bundlePath: existing, meta: embedded.meta ?? null };
  }
  await ensureBundleDir(key);
  const targetUri = toBundleFileUri(key, platform);

  const asset = Asset.fromModule(embedded.module);
  await asset.downloadAsync();
  const sourceUri = asset.localUri ?? asset.uri;
  if (!sourceUri) return null;
  const info = await FileSystem.getInfoAsync(sourceUri);
  if (!info.exists) return null;

  await deleteFileIfExists(targetUri);
  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  const finalUri = await getExistingNonEmptyFileUri(targetUri);
  if (!finalUri) return null;
  return { bundlePath: finalUri, meta: embedded.meta ?? null };
}

async function hydrateAssetsFromEmbeddedAsset(
  appId: string,
  platform: BundlePlatform,
  key: string,
  embedded: EmbeddedBaseBundle | undefined
): Promise<boolean> {
  const moduleId = embedded?.assetsModule;
  if (!moduleId) return false;

  const assetsMeta = embedded?.assetsMeta ?? null;
  const assetsDir = toAssetsDir(key);
  const metaUri = toAssetsMetaFileUri(key);

  const existingMeta = await readJsonFile<AssetsMeta>(metaUri);
  const assetsDirInfo = await FileSystem.getInfoAsync(assetsDir);
  const assetsDirExists = assetsDirInfo.exists && assetsDirInfo.isDirectory;
  const checksumMatches =
    Boolean(existingMeta?.checksumSha256) &&
    Boolean(assetsMeta?.checksumSha256) &&
    existingMeta?.checksumSha256 === assetsMeta?.checksumSha256;
  const embeddedMetaMatches = existingMeta?.storageKey?.startsWith('embedded:');
  if (assetsDirExists && checksumMatches && embeddedMetaMatches) {
    return true;
  }

  await ensureBundleDir(key);
  await ensureDir(assetsDir);

  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const sourceUri = asset.localUri ?? asset.uri;
  if (!sourceUri) return false;
  const info = await FileSystem.getInfoAsync(sourceUri);
  if (!info.exists) return false;

  const zipUri = `${bundleDir(key)}assets.zip`;
  await deleteFileIfExists(zipUri);
  await FileSystem.copyAsync({ from: sourceUri, to: zipUri });

  try {
    await FileSystem.deleteAsync(assetsDir, { idempotent: true }).catch(() => { });
  } catch {
  }
  await ensureDir(assetsDir);
  await unzipArchive(zipUri, assetsDir);

  await writeJsonFile(metaUri, {
    checksumSha256: assetsMeta?.checksumSha256 ?? null,
    storageKey: `embedded:${assetsMeta?.checksumSha256 ?? 'unknown'}`,
    updatedAt: new Date().toISOString(),
  } satisfies AssetsMeta);
  return true;
}

async function safeReplaceFileFromUrl(
  url: string,
  targetUri: string,
  tmpKey: string,
  platform: BundlePlatform
): Promise<string> {
  const tmpKeySafe = `tmp:${tmpKey}:${Date.now()}`;
  const tmpUri = toBundleFileUri(tmpKeySafe, platform);
  await ensureDir(bundleDir(tmpKeySafe));
  try {
    await withRetry(
      async () => {
        await deleteFileIfExists(tmpUri);
        await FileSystem.downloadAsync(url, tmpUri);
        const tmpOk = await getExistingNonEmptyFileUri(tmpUri);
        if (!tmpOk) throw new Error('Downloaded bundle is empty.');
      },
      { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
    );

    await deleteFileIfExists(targetUri);
    await FileSystem.moveAsync({ from: tmpUri, to: targetUri });

    const finalOk = await getExistingNonEmptyFileUri(targetUri);
    if (!finalOk) throw new Error('Bundle replacement failed.');
    return targetUri;
  } finally {
    await deleteFileIfExists(tmpUri);
  }
}

async function safeReplaceFileFromUrlToPath(url: string, targetUri: string, tmpKey: string): Promise<string> {
  const tmpDir = `${bundlesCacheDir()}tmp/`;
  await ensureDir(tmpDir);
  const tmpUri = `${tmpDir}${safeName(tmpKey)}.tmp`;
  try {
    await withRetry(
      async () => {
        await deleteFileIfExists(tmpUri);
        await FileSystem.downloadAsync(url, tmpUri);
        const tmpOk = await getExistingNonEmptyFileUri(tmpUri);
        if (!tmpOk) throw new Error('Downloaded file is empty.');
      },
      { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
    );
    await deleteFileIfExists(targetUri);
    await FileSystem.moveAsync({ from: tmpUri, to: targetUri });
    const finalOk = await getExistingNonEmptyFileUri(targetUri);
    if (!finalOk) throw new Error('File replacement failed.');
    return targetUri;
  } finally {
    await deleteFileIfExists(tmpUri);
  }
}

function getMetroAssets(bundle: Bundle): BundleAsset | null {
  const assets = bundle.assets ?? [];
  return assets.find((asset) => asset.kind === 'metro-assets') ?? null;
}

type AssetsMeta = {
  checksumSha256: string | null;
  storageKey: string;
  updatedAt: string;
};

async function ensureAssetsForBundle(
  appId: string,
  bundle: Bundle,
  key: string,
  platform: BundlePlatform
): Promise<void> {
  const asset = getMetroAssets(bundle);
  if (!asset?.storageKey) return;

  await ensureBundleDir(key);
  const assetsDir = toAssetsDir(key);
  await ensureDir(assetsDir);

  const metaUri = toAssetsMetaFileUri(key);
  const existingMeta = await readJsonFile<AssetsMeta>(metaUri);
  const assetsDirInfo = await FileSystem.getInfoAsync(assetsDir);
  const assetsDirExists = assetsDirInfo.exists && assetsDirInfo.isDirectory;
  if (
    existingMeta?.checksumSha256 &&
    asset.checksumSha256 &&
    existingMeta.checksumSha256 === asset.checksumSha256 &&
    (existingMeta.storageKey === asset.storageKey || existingMeta.storageKey?.startsWith('embedded:')) &&
    assetsDirExists
  ) {
    return;
  }

  const signed = await withRetry(
    async () => {
      return await bundlesRepository.getSignedAssetsDownloadUrl(appId, bundle.id, {
        redirect: false,
        kind: asset.kind,
      });
    },
    { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
  );

  const zipUri = `${bundleDir(key)}assets.zip`;
  await safeReplaceFileFromUrlToPath(signed.url, zipUri, `${appId}:${bundle.id}:${platform}:${asset.kind}`);

  try {
    await FileSystem.deleteAsync(assetsDir, { idempotent: true }).catch(() => { });
  } catch {

  }
  await ensureDir(assetsDir);
  await unzipArchive(zipUri, assetsDir);
  await writeJsonFile(metaUri, {
    checksumSha256: asset.checksumSha256 ?? null,
    storageKey: asset.storageKey,
    updatedAt: new Date().toISOString(),
  } satisfies AssetsMeta);
}

async function unzipArchive(sourceUri: string, destDir: string) {
  try {
    await unzip(sourceUri, destDir);
  } catch (e) {
    throw new Error(
      `Failed to extract assets archive. Ensure 'react-native-zip-archive' is installed in the host app. ${String(
        (e as Error)?.message ?? e
      )}`
    );
  }
}

async function pollBundle(appId: string, bundleId: string, opts: { timeoutMs: number; intervalMs: number }): Promise<Bundle> {
  const start = Date.now();
  while (true) {
    try {
      const bundle = await bundlesRepository.getById(appId, bundleId);
      if (bundle.status === 'succeeded' || bundle.status === 'failed') return bundle;
    } catch (e) {
      if (!isRetryableNetworkError(e)) {
        throw e;
      }
    }
    if (Date.now() - start > opts.timeoutMs) {
      throw new Error('Bundle build timed out.');
    }
    await sleep(opts.intervalMs);
  }
}

async function resolveBundlePath(
  src: BundleSource,
  platform: BundlePlatform,
  mode: 'base' | 'test'
): Promise<{ bundlePath: string; label: string; bundle: Bundle }> {
  const { appId, commitId } = src;
  const dir = bundlesCacheDir();
  await ensureDir(dir);

  const initiate = await withRetry(
    async () => {
      return await bundlesRepository.initiate(appId, {
        platform,
        commitId: commitId ?? undefined,
        idempotencyKey: `${appId}:${commitId ?? 'head'}:${platform}`,
      });
    },
    { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
  );

  const finalBundle =
    initiate.status === 'succeeded' || initiate.status === 'failed'
      ? initiate
      : await pollBundle(appId, initiate.id, { timeoutMs: 3 * 60 * 1000, intervalMs: 1200 });

  if (finalBundle.status === 'failed') {
    throw new Error('Bundle build failed.');
  }

  let bundleWithAssets = finalBundle;
  if (finalBundle.status === 'succeeded' && (!finalBundle.assets || finalBundle.assets.length === 0)) {
    try {
      bundleWithAssets = await bundlesRepository.getById(appId, finalBundle.id);
    } catch {
      bundleWithAssets = finalBundle;
    }
  }

  const signed = await withRetry(
    async () => {
      return await bundlesRepository.getSignedDownloadUrl(appId, finalBundle.id, { redirect: false });
    },
    { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
  );
  const key =
    mode === 'base'
      ? baseBundleKey(appId, platform)
      : testBundleKey(appId, commitId, platform, finalBundle.id);
  await ensureBundleDir(key);
  const bundlePath =
    mode === 'base'
      ? await safeReplaceFileFromUrl(
        signed.url,
        toBundleFileUri(key, platform),
        `${appId}:${commitId ?? 'head'}:${platform}:${finalBundle.id}`,
        platform
      )
      : await downloadIfMissing(signed.url, toBundleFileUri(key, platform));
  try {
    await ensureAssetsForBundle(appId, bundleWithAssets, key, platform);
  } catch {

  }
  return { bundlePath, label: 'Ready', bundle: bundleWithAssets };
}

export function useBundleManager({
  base,
  platform,
  canRequestLatest = true,
  embeddedBaseBundles,
}: UseBundleManagerParams): UseBundleManagerResult {
  const [bundlePath, setBundlePath] = React.useState<string | null>(null);
  const [renderToken, setRenderToken] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMode, setLoadingMode] = React.useState<'base' | 'test' | null>(null);
  const [statusLabel, setStatusLabel] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const baseRef = React.useRef(base);
  baseRef.current = base;

  const embeddedBaseBundlesRef = React.useRef<EmbeddedBaseBundles | undefined>(embeddedBaseBundles);
  embeddedBaseBundlesRef.current = embeddedBaseBundles;

  // Monotonic operation ids to prevent stale async loads from overwriting newer ones.
  const baseOpIdRef = React.useRef(0);
  const testOpIdRef = React.useRef(0);
  const activeLoadModeRef = React.useRef<'base' | 'test' | null>(null);
  const desiredModeRef = React.useRef<'base' | 'test'>('base');

  const canRequestLatestRef = React.useRef<boolean>(canRequestLatest);
  React.useEffect(() => {
    canRequestLatestRef.current = canRequestLatest;
    if (!canRequestLatest) {
      // Stop any in-flight base load from updating UI while the app is not ready.
      baseOpIdRef.current += 1;
      if (activeLoadModeRef.current === 'base') {
        setLoading(false);
        setLoadingMode(null);
        setStatusLabel(null);
        activeLoadModeRef.current = null;
      }
    }
  }, [canRequestLatest]);
  // Track the most recently successfully loaded base bundle so we can instantly exit test mode.
  const lastBaseBundlePathRef = React.useRef<string | null>(null);
  const lastBaseFingerprintRef = React.useRef<string | null>(null);
  // Only used to suppress an unnecessary remount on cold start when the network bundle matches the disk bundle.
  const initialHydratedBaseFromDiskRef = React.useRef(false);
  const hasCompletedFirstNetworkBaseLoadRef = React.useRef(false);

  const hydrateBaseFromDisk = React.useCallback(
    async (appId: string, reason: 'initial' | 'fallback') => {
      try {
        const dir = bundlesCacheDir();
        await ensureDir(dir);
        const key = baseBundleKey(appId, platform);
        let existing = await getExistingBundleFileUri(key, platform);
        let embeddedMeta: BaseBundleMeta | null = null;
        if (!existing) {
          const embedded = embeddedBaseBundlesRef.current?.[platform];
          const hydrated = await hydrateBaseFromEmbeddedAsset(appId, platform, embedded);
          if (hydrated?.bundlePath) {
            existing = hydrated.bundlePath;
            embeddedMeta = hydrated.meta ?? null;
            if (embeddedMeta) {
              await ensureBundleDir(key);
              await writeJsonFile(toBundleMetaFileUri(key), embeddedMeta);
              await writeJsonFile(legacyBundleMetaFileUri(key), embeddedMeta);
            }
          }
        }
        if (existing) {
          lastBaseBundlePathRef.current = existing;
          setBundlePath(existing);
          const meta =
            embeddedMeta ??
            (await readJsonFile<BaseBundleMeta>(toBundleMetaFileUri(key))) ??
            (await readJsonFile<BaseBundleMeta>(legacyBundleMetaFileUri(key)));
          const embedded = embeddedBaseBundlesRef.current?.[platform];
          const embeddedFingerprint = embedded?.meta?.fingerprint ?? null;
          const actualFingerprint = meta?.fingerprint ?? embeddedMeta?.fingerprint ?? null;
          if (embedded?.assetsModule && embeddedFingerprint && actualFingerprint === embeddedFingerprint) {
            try {
              await hydrateAssetsFromEmbeddedAsset(appId, platform, key, embedded);
            } catch {

            }
          }
          if (meta?.fingerprint) {
            lastBaseFingerprintRef.current = meta.fingerprint;
          }
          if (reason === 'initial') {
            initialHydratedBaseFromDiskRef.current = true;
            hasCompletedFirstNetworkBaseLoadRef.current = false;
          }
        }
      } catch {

      }
    },
    [platform]
  );

  // On cold reopen, try to load the last base bundle from disk as early as possible.
  React.useEffect(() => {
    if (!base.appId) return;
    initialHydratedBaseFromDiskRef.current = false;
    hasCompletedFirstNetworkBaseLoadRef.current = false;
    void hydrateBaseFromDisk(base.appId, 'initial');
  }, [base.appId, platform, hydrateBaseFromDisk]);

  const activateCachedBase = React.useCallback(
    async (appId: string) => {
      setIsTesting(false);
      setStatusLabel(null);
      setError(null);
      const cachedBase = lastBaseBundlePathRef.current;
      if (cachedBase) {
        setBundlePath(cachedBase);
      } else {
        await hydrateBaseFromDisk(appId, 'fallback');
      }
    },
    [hydrateBaseFromDisk]
  );

  const load = React.useCallback(async (src: BundleSource, mode: 'base' | 'test') => {
    if (!src.appId) return;

    if (mode === 'test') {
      // Testing takes precedence over any in-flight base refresh.
      desiredModeRef.current = 'test';
      baseOpIdRef.current += 1;
    }

    const canRequestLatest = canRequestLatestRef.current;
    if (mode === 'base' && !canRequestLatest) {
      await activateCachedBase(src.appId);
      return;
    }

    const opId = mode === 'base' ? ++baseOpIdRef.current : ++testOpIdRef.current;
    activeLoadModeRef.current = mode;
    setLoading(true);
    setLoadingMode(mode);
    setError(null);
    setStatusLabel(mode === 'test' ? 'Loading test bundle…' : 'Loading latest build…');

    if (mode === 'base' && desiredModeRef.current === 'base') {
      void activateCachedBase(src.appId);
    }

    try {
      const { bundlePath: path, bundle } = await resolveBundlePath(src, platform, mode);
      if (mode === 'base' && opId !== baseOpIdRef.current) return;
      if (mode === 'test' && opId !== testOpIdRef.current) return;
      if (desiredModeRef.current !== mode) return;
      setBundlePath(path);
      const fingerprint = bundle.checksumSha256 ?? `id:${bundle.id}`;

      // If we started by rendering a base bundle from disk and the network "latest" bundle is the same,
      // avoid a pointless remount (no visual flicker) ONLY for that first refresh.
      const shouldSkipInitialBaseRemount =
        mode === 'base' &&
        initialHydratedBaseFromDiskRef.current &&
        !hasCompletedFirstNetworkBaseLoadRef.current &&
        Boolean(lastBaseFingerprintRef.current) &&
        lastBaseFingerprintRef.current === fingerprint;

      if (!shouldSkipInitialBaseRemount) {
        setRenderToken((t) => t + 1);
      }

      if (mode === 'base') {
        lastBaseBundlePathRef.current = path;
        lastBaseFingerprintRef.current = fingerprint;
        hasCompletedFirstNetworkBaseLoadRef.current = true;
        initialHydratedBaseFromDiskRef.current = false;
        const metaKey = baseBundleKey(src.appId, platform);
        await ensureBundleDir(metaKey);
        void writeJsonFile(toBundleMetaFileUri(metaKey), {
          fingerprint,
          bundleId: bundle.id,
          checksumSha256: bundle.checksumSha256 ?? null,
          size: bundle.size ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies BaseBundleMeta);
        void writeJsonFile(legacyBundleMetaFileUri(metaKey), {
          fingerprint,
          bundleId: bundle.id,
          checksumSha256: bundle.checksumSha256 ?? null,
          size: bundle.size ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies BaseBundleMeta);
        setIsTesting(false);
      } else {
        setIsTesting(true);
      }
      setStatusLabel(null);
    } catch (e) {
      if (mode === 'base' && opId !== baseOpIdRef.current) return;
      if (mode === 'test' && opId !== testOpIdRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatusLabel(null);
    } finally {
      if (mode === 'base' && opId !== baseOpIdRef.current) return;
      if (mode === 'test' && opId !== testOpIdRef.current) return;
      setLoading(false);
      setLoadingMode(null);
      if (activeLoadModeRef.current === mode) activeLoadModeRef.current = null;
    }
  }, [activateCachedBase, platform]);

  const loadBase = React.useCallback(async () => {
    await load(baseRef.current, 'base');
  }, [load]);

  const loadTest = React.useCallback(async (src: BundleSource) => {
    await load(src, 'test');
  }, [load]);

  const restoreBase = React.useCallback(async () => {
    const src = baseRef.current;
    if (!src.appId) return;
    desiredModeRef.current = 'base';
    // Exiting test mode should drop any in-flight test completion.
    testOpIdRef.current += 1;
    await activateCachedBase(src.appId);
    if (canRequestLatestRef.current) {
      await load(src, 'base');
    }
  }, [activateCachedBase, load]);

  React.useEffect(() => {
    if (!canRequestLatest) return;
    void loadBase();
  }, [base.appId, base.commitId, platform, canRequestLatest, loadBase]);

  return { bundlePath, renderToken, loading, loadingMode, statusLabel, error, isTesting, loadBase, loadTest, restoreBase };
}


