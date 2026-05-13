import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { DocumentLoader } from './services/document-loader.js'
import { EmbeddingService } from './services/embedding-service.js'
import { VectorStore } from './services/vector-store.js'
import { AgentGraph } from './services/agent-graph.js'
import { createChatRouter } from './routes/chat.js'

async function bootstrap() {
  console.log('=== SCVG AI Backend (TypeScript + file-based RAG) ===')
  console.log(`Starting on port ${env.PORT}...`)

  // Initialize core services
  const loader = new DocumentLoader()
  const embedder = new EmbeddingService()
  const store = new VectorStore(loader, embedder, env.CACHE_PATH)

  // Build or load vector store
  console.log('\n--- Initializing Vector Store ---')
  await store.initialize(env.KNOWLEDGE_BASE_PATH)
  console.log(`Documents: ${store.getDocumentCount()}, Chunks: ${store.getChunkCount()}`)

  // Create the agent
  const agent = new AgentGraph(store, embedder)

  // Set up Express
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  // Mount routes
  app.use('/api/ai', createChatRouter(agent))

  // Start server
  app.listen(env.PORT, () => {
    console.log(`\n✓ AI Backend running at http://localhost:${env.PORT}`)
    console.log(`  API endpoint: POST http://localhost:${env.PORT}/api/ai/chat`)
    console.log(`  Health check: GET  http://localhost:${env.PORT}/api/ai/health`)
    console.log('================================================\n')
  })
}

bootstrap().catch(err => {
  console.error('Fatal error during startup:', err)
  process.exit(1)
})
