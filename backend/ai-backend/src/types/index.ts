export interface ChunkResult {
  id: string
  documentTitle: string
  documentSource: string
  content: string
  similarity: number
  category: string
}

export interface StoredChunk {
  id: string
  documentId: string
  documentTitle: string
  documentSource: string
  content: string
  category: string
  index: number
}

export interface StoredEmbedding {
  chunkId: string
  embedding: number[]
}

export interface AgentState {
  query: string
  retrievedContext: string
  relevantChunks: ChunkResult[]
}

export interface ChatRequest {
  message: string
  sessionId?: string
  model?: string
}

export interface CacheData {
  version: string
  fileHashes: Record<string, string>
  chunks: StoredChunk[]
  embeddings: StoredEmbedding[]
}
