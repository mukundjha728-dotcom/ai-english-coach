import { supabase } from './supabaseClient';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Makes an authenticated API request to the backend.
 * Automatically injects the Supabase access token.
 */
async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response;
}

/**
 * Creates a new conversation session on the backend.
 */
export async function startConversation(sessionType: string = 'conversation', documentId?: string): Promise<{
  sessionId: string;
  wsUrl: string;
}> {
  const response = await fetchWithAuth('/api/conversation/start', {
    method: 'POST',
    body: JSON.stringify({ sessionType, documentId }),
  });

  return response.json();
}

/**
 * Uploads a document to the backend.
 */
export async function uploadDocument(file: File): Promise<{ documentId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Retrieves the list of user documents.
 */
export async function getDocuments(): Promise<{ documents: any[] }> {
  const response = await fetchWithAuth('/api/documents');
  return response.json();
}

/**
 * Validates the current auth session with the backend.
 */
export async function validateSession(): Promise<{
  user: {
    id: string;
    email: string;
    displayName: string | null;
    proficiencyLevel: string;
  };
}> {
  const response = await fetchWithAuth('/api/auth/session', {
    method: 'POST',
  });

  return response.json();
}

/**
 * Generates a scorecard for a completed session.
 */
export async function generateScorecard(sessionId: string): Promise<{ scorecard: any }> {
  const response = await fetchWithAuth(`/api/conversation/${sessionId}/scorecard`, {
    method: 'POST',
  });
  return response.json();
}

/**
 * Retrieves a scorecard for a session.
 */
export async function getScorecard(sessionId: string): Promise<{ scorecard: any }> {
  const response = await fetchWithAuth(`/api/conversation/${sessionId}/scorecard`);
  return response.json();
}
