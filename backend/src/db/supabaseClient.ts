import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
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
