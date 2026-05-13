import fs from 'fs'
import path from 'path'
import { StoredChunk, StoredEmbedding, ChunkResult, CacheData } from '../types/index.js'
import { DocumentLoader } from './document-loader.js'
import { EmbeddingService } from './embedding-service.js'

export class VectorStore {
  private chunks: StoredChunk[] = []
  private embeddings: StoredEmbedding[] = []
  private loader: DocumentLoader
  private embedder: EmbeddingService
  private cachePath: string

  constructor(loader: DocumentLoader, embedder: EmbeddingService, cachePath: string) {
    this.loader = loader
    this.embedder = embedder
    this.cachePath = cachePath
  }

  /**
   * Initialize the store: load from cache or build from source files.
   */
  async initialize(basePath: string): Promise<void> {
    const cacheFile = path.join(this.cachePath, 'cache.json')

    if (fs.existsSync(cacheFile)) {
      console.log('Loading vector store from cache...')
      try {
        const raw = fs.readFileSync(cacheFile, 'utf-8')
        const data: CacheData = JSON.parse(raw)
        this.chunks = data.chunks
        this.embeddings = data.embeddings

        // Check if source files have changed
        const currentFiles = this.loader.loadFiles(basePath)
        const currentHash = this.loader.computeHash(currentFiles)
        if (data.fileHashes && Object.values(data.fileHashes).join('') === currentFiles.map(f => f.hash).join('')) {
          console.log(`Cache is up-to-date: ${this.chunks.length} chunks, ${this.embeddings.length} embeddings`)
          return
        }
        console.log('Source files changed, rebuilding...')
      } catch (err) {
        console.warn('Cache load failed, rebuilding:', (err as Error).message)
      }
    }

    await this.build(basePath)
  }

  /**
   * Build the vector store from source files.
   */
  private async build(basePath: string): Promise<void> {
    console.log('Building vector store from source files...')
    this.chunks = this.loader.processAll(basePath)

    // Generate embeddings for each chunk
    this.embeddings = []
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const embedding = await this.embedder.generateEmbedding(chunk.content)
      this.embeddings.push({ chunkId: chunk.id, embedding })

      if ((i + 1) % 10 === 0 || i === this.chunks.length - 1) {
        console.log(`  Embedded ${i + 1}/${this.chunks.length} chunks`)
      }
    }

    // Save to cache
    await this.saveCache(basePath)
    console.log(`Vector store ready: ${this.chunks.length} chunks`)
  }

  /**
   * Save the current state to cache file.
   */
  private async saveCache(basePath: string): Promise<void> {
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true })
    }

    const files = this.loader.loadFiles(basePath)
    const fileHashes: Record<string, string> = {}
    files.forEach(f => { fileHashes[f.title] = f.hash })

    const cacheData: CacheData = {
      version: '1.0',
      fileHashes,
      chunks: this.chunks,
      embeddings: this.embeddings,
    }

    fs.writeFileSync(
      path.join(this.cachePath, 'cache.json'),
      JSON.stringify(cacheData, null, 2),
      'utf-8'
    )
    console.log('Vector store cached to disk')
  }

  /**
   * Search for the most similar chunks to a query embedding.
   */
  searchSimilarChunks(queryEmbedding: number[], topK: number = 5): ChunkResult[] {
    if (this.embeddings.length === 0 || this.chunks.length === 0) return []

    const results: { chunkId: string; similarity: number }[] = []

    for (const emb of this.embeddings) {
      const similarity = this.embedder.cosineSimilarity(queryEmbedding, emb.embedding)
      results.push({ chunkId: emb.chunkId, similarity })
    }

    // Sort by similarity descending and get top K
    results.sort((a, b) => b.similarity - a.similarity)
    const topResults = results.slice(0, topK)

    return topResults.map(r => {
      const chunk = this.chunks.find(c => c.id === r.chunkId)
      if (!chunk) return null
      return {
        id: chunk.id,
        documentTitle: chunk.documentTitle,
        documentSource: chunk.documentSource,
        content: chunk.content,
        similarity: r.similarity,
        category: chunk.category,
      }
    }).filter((r): r is ChunkResult => r !== null)
  }

  /**
   * Format retrieved chunks into a context string for the LLM prompt.
   */
  formatContext(chunks: ChunkResult[]): string {
    if (chunks.length === 0) return '（未找到相关参考文档）'

    return chunks
      .map((chunk, i) => {
        return `[参考文档 ${i + 1}] 《${chunk.documentTitle}》
来源：${chunk.documentSource}
相关性：${(chunk.similarity * 100).toFixed(0)}%
内容：
${chunk.content}`
      })
      .join('\n\n---\n\n')
  }

  getDocumentCount(): number {
    const uniqueDocs = new Set(this.chunks.map(c => c.documentId))
    return uniqueDocs.size
  }

  getChunkCount(): number {
    return this.chunks.length
  }
}
