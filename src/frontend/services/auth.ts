import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AdminStatus = 'loading' | 'signed_out' | 'not_admin' | 'admin';

/**
 * Status login admin. Login = akun Supabase Auth; hak admin = terdaftar di
 * tabel `app_admins` (dicek server lewat RPC `is_admin`, bukan di browser).
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AdminStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) {
        if (!cancelled) setStatus('signed_out');
        return;
      }
      const { data, error } = await supabase.rpc('is_admin');
      if (!cancelled) setStatus(!error && data === true ? 'admin' : 'not_admin');
    };

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { check(s); });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    status,
    email: session?.user.email ?? null,
    signOut: () => supabase.auth.signOut(),
  };
}

export const signInAdmin = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false as const, message: 'Email atau password salah.' };
  const { data } = await supabase.rpc('is_admin');
  if (data !== true) {
    await supabase.auth.signOut();
    return { ok: false as const, message: 'Akun ini belum terdaftar sebagai admin.' };
  }
  return { ok: true as const };
};
