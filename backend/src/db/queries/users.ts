import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

export interface UserRecord {
  id: string;
  auth_id: string;
  email: string | null;
  display_name: string | null;
  proficiency_level: string;
  created_at: string;
}

/**
 * Finds an existing user by auth_id or creates a new one.
 */
export async function findOrCreateUser(authId: string, email?: string): Promise<UserRecord> {
  try {
    // Try to find existing user
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();

    if (existing && !findError) {
      return existing as UserRecord;
    }

    // Create new user
    const { data: created, error: createError } = await supabase
      .from('users')
      .insert({ auth_id: authId, email: email ?? null })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return created as UserRecord;
  } catch (error) {
    logger.error('Error in findOrCreateUser', { authId, error: String(error) });
    throw error;
  }
}

/**
 * Fetches a user profile by internal user ID.
 */
export async function getUserProfile(userId: string): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('User not found', { userId });
      return null;
    }

    return data as UserRecord;
  } catch (error) {
    logger.error('Error in getUserProfile', { userId, error: String(error) });
    throw error;
  }
}

/**
 * Updates a user's proficiency level.
 */
export async function updateProficiencyLevel(userId: string, level: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ proficiency_level: level })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update proficiency level: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateProficiencyLevel', { userId, level, error: String(error) });
    throw error;
  }
}
