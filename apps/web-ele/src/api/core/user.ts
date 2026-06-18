import type { UserInfo } from '@vben/types';

import { assertSupabaseClient } from '@/api/product-info/client';

export async function getUserInfoApi(): Promise<UserInfo> {
  const supabase = assertSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user = session?.user;

  if (!user) {
    throw new Error('当前登录会话已失效，请重新登录');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,email,name,role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const email = profile?.email || user.email || '';
  const role = profile?.role || 'user';
  const realName = profile?.name || email.split('@')[0] || 'User';

  return {
    avatar: '',
    desc: role === 'admin' ? '系统管理员' : '资料查看用户',
    homePath: '/admin/dashboard',
    realName,
    roles: [role],
    token: session.access_token,
    userId: user.id,
    username: email,
  };
}
