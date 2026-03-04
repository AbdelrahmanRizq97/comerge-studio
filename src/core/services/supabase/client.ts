import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let clientSingleton: SupabaseClient | null = null;
let injectedClient: SupabaseClient | null = null;
let hasInjectedClient = false;
let runtimeConfig: { url: string; anonKey: string } | null = null;

export function setSupabaseClient(client: SupabaseClient) {
  injectedClient = client;
  clientSingleton = client;
  hasInjectedClient = true;
}

export function isSupabaseClientInjected(): boolean {
  return hasInjectedClient;
}

export function setSupabaseConfig(config: { url: string; anonKey: string }) {
  runtimeConfig = config;
}

export function getSupabaseClient(): SupabaseClient {
  if (clientSingleton) return clientSingleton;
  if (injectedClient) return injectedClient;

  if (!runtimeConfig?.url) {
    throw new Error('comerge-studio: Supabase config not initialized (missing url).');
  }
  if (!runtimeConfig?.anonKey) {
    throw new Error('comerge-studio: Supabase config not initialized (missing anonKey).');
  }

  clientSingleton = createClient(runtimeConfig.url, runtimeConfig.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return clientSingleton;
}

