import { Platform } from 'react-native';
import { Mixpanel } from 'mixpanel-react-native';

import { log } from '../../core/logger';
import type {
  StudioAnalyticsEventMap,
  StudioAnalyticsEventName,
  StudioAnalyticsEventPayload,
} from './events';

type StudioAnalyticsInitOptions = {
  enabled: boolean;
  token?: string;
  serverUrl?: string;
  debug?: boolean;
};

let studioMixpanel: Mixpanel | null = null;
let studioAnalyticsEnabled = false;
let initPromise: Promise<void> | null = null;

export async function initStudioAnalytics(options: StudioAnalyticsInitOptions) {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!options.enabled) {
      studioAnalyticsEnabled = false;
      return;
    }

    const token = (options.token ?? '').trim();
    if (!token) {
      studioAnalyticsEnabled = false;
      log.warn('[studio-analytics] disabled: missing Mixpanel token');
      return;
    }

    try {
      const trackAutomaticEvents = false;
      const useNative = false;
      const serverUrl = (options.serverUrl ?? '').trim() || 'https://api.mixpanel.com';
      const superProperties = {
        runtime: 'comerge-studio',
        platform: Platform.OS,
      };

      studioMixpanel = new Mixpanel(token, trackAutomaticEvents, useNative);
      await studioMixpanel.init(false, superProperties, serverUrl);
      studioMixpanel.setLoggingEnabled(Boolean(options.debug));
      studioMixpanel.setFlushBatchSize(50);
      studioAnalyticsEnabled = true;
    } catch (error) {
      studioMixpanel = null;
      studioAnalyticsEnabled = false;
      log.warn('[studio-analytics] init failed', error);
    }
  })();

  return initPromise;
}

export function isStudioAnalyticsEnabled() {
  return studioAnalyticsEnabled;
}

export async function trackStudioEvent<TName extends StudioAnalyticsEventName>(
  eventName: TName,
  properties: StudioAnalyticsEventPayload<TName>
) {
  if (!studioAnalyticsEnabled || !studioMixpanel) return;
  try {
    await studioMixpanel.track(eventName, properties as StudioAnalyticsEventMap[TName]);
  } catch (error) {
    log.warn('[studio-analytics] track failed', { eventName, error });
  }
}

export async function flushStudioAnalytics() {
  if (!studioAnalyticsEnabled || !studioMixpanel) return;
  try {
    await studioMixpanel.flush();
  } catch (error) {
    log.warn('[studio-analytics] flush failed', error);
  }
}

export async function identifyStudioUser(userId: string) {
  if (!studioAnalyticsEnabled || !studioMixpanel || !userId) return;
  try {
    await studioMixpanel.identify(userId);
  } catch (error) {
    log.warn('[studio-analytics] identify failed', error);
  }
}

export async function resetStudioAnalytics() {
  if (!studioAnalyticsEnabled || !studioMixpanel) return;
  try {
    await studioMixpanel.reset();
  } catch (error) {
    log.warn('[studio-analytics] reset failed', error);
  }
}
