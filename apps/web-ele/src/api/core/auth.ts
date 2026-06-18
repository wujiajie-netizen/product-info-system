import { assertSupabaseClient, getSupabaseClient } from '@/api/product-info/client';

export namespace AuthApi {
  export interface LoginParams {
    email?: string;
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    accessToken: string;
    refreshToken?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  const supabase = assertSupabaseClient();
  const email = data.email || data.username;

  if (!email || !data.password) {
    throw new Error('请输入邮箱和密码');
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  });

  if (error) {
    throw error;
  }

  const accessToken = authData.session?.access_token;

  if (!accessToken) {
    throw new Error('登录成功但未获取到访问令牌');
  }

  return {
    accessToken,
    refreshToken: authData.session?.refresh_token,
  };
}

export async function getSessionApi() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function refreshTokenApi() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw error;
  }

  return {
    data: data.session?.access_token || '',
    status: 0,
  };
}

export async function logoutApi() {
  const supabase = assertSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getAccessCodesApi() {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.role === 'admin'
    ? [
        'product:read',
        'product:write',
        'document:read',
        'document:write',
        'update:write',
        'user:write',
      ]
    : ['product:read', 'document:read'];
}
