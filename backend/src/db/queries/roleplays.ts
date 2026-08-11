import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

export interface Roleplay {
  id: string;
  name: string;
  category: string;
  system_prompt_template: string;
  created_at: string;
}

export async function getRoleplays(): Promise<Roleplay[]> {
  const { data, error } = await supabase
    .from('roleplays')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    logger.error('Failed to fetch roleplays', { error: String(error) });
    throw error;
  }

  return data as Roleplay[];
}

export async function getRoleplayById(id: string): Promise<Roleplay | null> {
  const { data, error } = await supabase
    .from('roleplays')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    logger.error(`Failed to fetch roleplay ${id}`, { error: String(error) });
    throw error;
  }

  return data as Roleplay;
}
