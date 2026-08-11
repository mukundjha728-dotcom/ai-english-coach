import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isUrlValid = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
const isKeyValid = rawKey.length > 20 && !rawKey.includes('YOUR_');

export const isSupabaseConfigured = isUrlValid && isKeyValid;

// Use dummy values if not configured so the app can at least render
export const supabase = createClient(
  isUrlValid ? rawUrl : 'https://placeholder.supabase.co',
  isKeyValid ? rawKey : 'placeholder-key'
);
