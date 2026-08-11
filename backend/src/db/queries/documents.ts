import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

export interface DocumentRecord {
  id?: string;
  user_id: string;
  filename: string;
  created_at?: string;
}

export interface DocumentChunkRecord {
  id?: string;
  document_id: string;
  content: string;
  embedding: number[];
}

export async function createDocument(userId: string, filename: string): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from('documents')
    .insert([{ user_id: userId, filename }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating document', { error: String(error) });
    throw new Error('Failed to create document');
  }

  return data;
}

export async function insertDocumentChunks(chunks: DocumentChunkRecord[]): Promise<void> {
  const { error } = await supabase
    .from('document_chunks')
    .insert(chunks);

  if (error) {
    logger.error('Error inserting document chunks', { error: String(error) });
    throw new Error('Failed to insert chunks');
  }
}

export async function getUserDocuments(userId: string): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error getting user documents', { error: String(error) });
    throw new Error('Failed to get user documents');
  }

  return data;
}

export async function findSimilarChunks(documentId: string, queryEmbedding: number[], limit: number = 3): Promise<{ content: string, similarity: number }[]> {
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: limit,
    p_document_id: documentId
  });

  if (error) {
    logger.error('Error finding similar chunks', { error: String(error) });
    throw new Error('Failed to find similar chunks');
  }

  return data;
}

export async function getDocumentText(documentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('content')
    .eq('document_id', documentId);

  if (error) {
    logger.error('Error getting document text', { error: String(error) });
    throw new Error('Failed to get document text');
  }

  return data.map(chunk => chunk.content).join('\n\n');
}
