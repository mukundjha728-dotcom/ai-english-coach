// @ts-ignore - pdf-parse types are sometimes tricky with ESM
import pdfParse from 'pdf-parse';
import { llmClient } from '../llm/LLMClient.js';
import { createDocument, insertDocumentChunks, DocumentChunkRecord } from '../db/queries/documents.js';
import { logger } from '../utils/logger.js';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Splits text into chunks of roughly CHUNK_SIZE characters, with CHUNK_OVERLAP.
 */
function chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.substring(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - chunkOverlap;
  }
  return chunks;
}

/**
 * Processes a PDF buffer:
 * 1. Extracts text
 * 2. Chunks text
 * 3. Generates embeddings via LLM
 * 4. Saves to DB
 */
export async function processPdfDocument(userId: string, filename: string, buffer: Buffer): Promise<string> {
  try {
    logger.info(`Starting PDF processing for ${filename}`);
    
    // 1. Extract text
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.replace(/\s+/g, ' ').trim();

    if (!text) {
      throw new Error('No readable text found in PDF');
    }

    // 2. Create document record
    const document = await createDocument(userId, filename);
    const documentId = document.id!;

    // 3. Chunk text
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    logger.info(`Extracted ${chunks.length} chunks from ${filename}`);

    // 4. Generate embeddings and save (batching for performance/rate limits)
    const dbChunks: DocumentChunkRecord[] = [];
    
    // We could do Promise.all, but to avoid rate limits, we process sequentially or in small batches
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 50) continue; // Skip very small chunks

      try {
        const embedding = await llmClient.generateEmbedding(chunk);
        dbChunks.push({
          document_id: documentId,
          content: chunk,
          embedding
        });
      } catch (err) {
        logger.error(`Failed to embed chunk ${i}`, { error: String(err) });
        // Depending on strictness, we might throw or continue. We'll continue for robustness.
      }
    }

    if (dbChunks.length === 0) {
      throw new Error('Failed to generate any valid embeddings for the document.');
    }

    // 5. Insert to DB
    await insertDocumentChunks(dbChunks);
    logger.info(`Successfully stored ${dbChunks.length} chunks for ${filename}`);

    return documentId;
  } catch (error) {
    logger.error('Error processing PDF', { filename, error: String(error) });
    throw error;
  }
}
