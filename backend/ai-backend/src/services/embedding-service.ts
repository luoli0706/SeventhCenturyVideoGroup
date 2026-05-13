import OpenAI from 'openai'
import { env } from '../config/env.js'

export class EmbeddingService {
  private client: OpenAI | null = null

  constructor() {
    if (env.DEEPSEEK_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: env.DEEPSEEK_BASE_URL,
      })
    }
  }

  /**
   * Generate embedding vector for a text using DeepSeek API.
   * Falls back to local feature vector on failure.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Try API first
    if (this.client) {
      try {
        const response = await this.client.embeddings.create({
          model: env.DEEPSEEK_EMBEDDING_MODEL,
          input: text,
        })
        return response.data[0].embedding
      } catch (err) {
        console.warn('DeepSeek embedding API failed, using local fallback:', (err as Error).message)
      }
    }

    // Local fallback: character frequency based feature vector
    return this.localEmbedding(text)
  }

  /**
   * Local fallback embedding using character frequency analysis.
   * Creates a 1024-dimensional vector from the text.
   */
  private localEmbedding(text: string): number[] {
    const dim = 1024
    const vec = new Array(dim).fill(0)

    if (!text) return vec

    // Use character n-gram frequencies as features
    const normalized = text.toLowerCase()

    // Simple hash-based feature extraction
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i)
      // Spread the character across multiple dimensions using hash
      const idx1 = Math.abs(charCode * 7 + i * 3) % dim
      const idx2 = Math.abs(charCode * 11 + i * 5 + 1) % dim
      const idx3 = Math.abs(charCode * 13 + i * 7 + 2) % dim

      // Weight by position (recent chars get slightly more weight)
      const weight = 1 + (i / normalized.length) * 0.5
      vec[idx1] += weight * 0.5
      vec[idx2] += weight * 0.3
      vec[idx3] += weight * 0.2
    }

    // Normalize the vector to unit length
    return this.normalize(vec)
  }

  /**
   * Normalize a vector to unit length.
   */
  normalize(vec: number[]): number[] {
    let sumSq = 0
    for (const v of vec) sumSq += v * v
    const norm = Math.sqrt(sumSq)
    if (norm < 1e-10) return vec
    return vec.map(v => v / norm)
  }

  /**
   * Compute cosine similarity between two vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dot = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
  }
}
