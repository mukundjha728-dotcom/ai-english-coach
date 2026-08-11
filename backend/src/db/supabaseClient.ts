import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY?.trim() || '';

const isUrlValid = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');
const isKeyValid = supabaseServiceRoleKey.length > 20 && !supabaseServiceRoleKey.includes('YOUR_');

if (!isUrlValid || !isKeyValid) {
  logger.error('Missing or invalid SUPABASE_URL / SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

/**
 * Server-side Supabase client using the service role key.
 * Used for DB operations that bypass RLS (admin-level access).
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Creates a Supabase client scoped to a specific user's auth token.
 * Used when RLS enforcement is needed.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl!, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
