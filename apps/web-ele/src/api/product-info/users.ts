import { assertSupabaseClient } from './client';
import type { ProfileRecord, UserRole } from './types';

export async function listProfiles() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ProfileRecord[];
}

export async function updateProfileRole(id: string, role: UserRole) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRecord;
}
