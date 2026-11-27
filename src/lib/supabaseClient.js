import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('YOUR-PROJECT-ID')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function uniqueChannelName(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatSupabaseError(error, fallback = 'Terjadi kendala saat memproses permintaan.') {
  if (!error) return fallback;
  const msg = String(error.message || error.error_description || '').toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah. Periksa kembali atau gunakan fitur lupa kata sandi.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email kamu belum dikonfirmasi. Buka kotak masuk atau kirim ulang tautan verifikasi.';
  }
  if (msg.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk atau reset kata sandi jika lupa.';
  }
  if (msg.includes('password should be at least')) {
    return 'Kata sandi minimal terdiri dari 6 karakter.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Terlalu banyak percobaan dalam waktu singkat. Tunggu beberapa saat sebelum mencoba lagi.';
  }
  if (msg.includes('duplicate key')) {
    return 'Data yang sama sudah tercatat sebelumnya.';
  }
  return error.message || fallback;
}
