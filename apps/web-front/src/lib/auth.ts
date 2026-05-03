import type { Session, User } from '@supabase/supabase-js';

import { reactive, readonly } from 'vue';

import { isSupabaseConfigured, supabase } from '#/lib/supabase';

interface AuthState {
  initialized: boolean;
  pending: boolean;
  session: null | Session;
  user: null | User;
}

const state = reactive<AuthState>({
  initialized: false,
  pending: false,
  session: null,
  user: null,
});

let initializedPromise: null | Promise<void> = null;

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase 尚未配置，请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。',
    );
  }

  return supabase;
}

export function useAuthState() {
  return readonly(state);
}

export async function initializeAuth() {
  if (initializedPromise) {
    return initializedPromise;
  }

  initializedPromise = (async () => {
    if (!isSupabaseConfigured || !supabase) {
      state.initialized = true;
      return;
    }

    state.pending = true;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      state.session = session;
      state.user = session?.user ?? null;
    } finally {
      state.pending = false;
      state.initialized = true;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      state.session = session;
      state.user = session?.user ?? null;
      state.initialized = true;
      state.pending = false;
    });
  })();

  return initializedPromise;
}

export async function loginWithPassword(email: string, password: string) {
  const client = assertSupabaseClient();

  if (!email.trim() || !password) {
    throw new Error('请输入邮箱和密码。');
  }

  state.pending = true;

  try {
    const {
      data: { session, user },
      error,
    } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    state.session = session;
    state.user = user;
  } finally {
    state.pending = false;
    state.initialized = true;
  }
}

export async function logout() {
  const client = assertSupabaseClient();

  state.pending = true;

  try {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    state.session = null;
    state.user = null;
  } finally {
    state.pending = false;
    state.initialized = true;
  }
}
