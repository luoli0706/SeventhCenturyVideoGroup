import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { KnowledgeNavigator } from './services/kb-navigator.js'
import { AgentGraph } from './services/agent-graph.js'
import { ChatHistory } from './services/chat-history.js'
import { createChatRouter } from './routes/chat.js'
import { createHistoryRouter } from './routes/history.js'

async function bootstrap() {
  console.log('=== SCVG AI Backend (ReACT + B+ Tree KB) ===')
  console.log(`Starting on port ${env.PORT}...`)

  // Initialize knowledge base navigator
  console.log('\n--- Initializing Knowledge Base ---')
  const navigator = new KnowledgeNavigator(env.KNOWLEDGE_BASE_PATH)
  navigator.initialize()
  const stats = navigator.getStats()
  console.log(`KB: ${stats.directories} sections, ${stats.files} files`)

  // Initialize chat history (SQLite)
  console.log('\n--- Initializing Chat History ---')
  const history = new ChatHistory()
  const sessionCount = history.getSessions().length
  console.log(`Chat history: ${sessionCount} previous sessions`)

  // Create the ReACT agent
  const agent = new AgentGraph(navigator)

  // Set up Express
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  // Mount routes
  app.use('/api/ai', createChatRouter(agent, history))
  app.use('/api/ai', createHistoryRouter(history))

  // Start server
  app.listen(env.PORT, () => {
    console.log(`\n✓ AI Backend running at http://localhost:${env.PORT}`)
    console.log(`  API endpoint: POST http://localhost:${env.PORT}/api/ai/chat`)
    console.log(`  History API:  GET  http://localhost:${env.PORT}/api/ai/sessions`)
    console.log(`  Health check: GET  http://localhost:${env.PORT}/api/ai/health`)
    console.log('================================================\n')
  })
}

bootstrap().catch(err => {
  console.error('Fatal error during startup:', err)
  process.exit(1)
})
