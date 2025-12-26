import type { User } from '@supabase/supabase-js';

import { getSupabaseClient } from './client';

export type EnsureAnonymousSessionResult = {
  user: User;
  isNew: boolean;
};

export type EnsureAuthenticatedSessionResult = {
  user: User;
};

export async function ensureAuthenticatedSession(): Promise<EnsureAuthenticatedSessionResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user ?? null;
  if (!user) {
    throw new Error('comerge-studio: no authenticated Supabase session found.');
  }
  return { user };
}

export async function ensureAnonymousSession(): Promise<EnsureAnonymousSessionResult> {
  const supabase = getSupabaseClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const existingUser = sessionData.session?.user ?? null;
  if (existingUser) return { user: existingUser, isNew: false };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('comerge-studio: anonymous sign-in returned no user');

  return { user: data.user, isNew: true };
}


