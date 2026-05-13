import { Router, Request, Response } from 'express'
import { AgentGraph } from '../services/agent-graph.js'
import { ChatHistory } from '../services/chat-history.js'
import { ChatRequest } from '../types/index.js'

interface SessionMemory {
  history: { role: 'user' | 'assistant'; content: string }[]
}

const sessions = new Map<string, SessionMemory>()

export function createChatRouter(agent: AgentGraph, history: ChatHistory): Router {
  const router = Router()

  // POST /api/ai/chat - streaming chat with ReACT navigation
  router.post('/chat', async (req: Request, res: Response) => {
    const { message, sessionId, userId } = req.body as ChatRequest
    const uid = userId || req.headers['x-user-cn'] as string || ''

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }

    const sid = sessionId || 'anonymous'
    console.log(`[Chat] Session: ${sid} | User: ${uid} | Query: "${message.substring(0, 80)}..."`)

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    res.write(JSON.stringify({ type: 'begin' }) + '\n')

    // Accumulate assistant response for persistence
    let fullAssistantContent = ''

    try {
      // Ensure session exists in SQLite (scoped to user)
      history.createSession(sid, uid)

      // Get or create session memory
      if (!sessions.has(sid)) {
        sessions.set(sid, { history: [] })
      }
      const session = sessions.get(sid)!

      // Save user message to SQLite
      history.addMessage(sid, 'user', message)

      // Run the ReACT agent
      const historyMessages = session.history.slice(-6) // last 3 turns
      const generator = agent.processQuery(message, historyMessages)

      for await (const event of generator) {
        res.write(JSON.stringify(event) + '\n')
        // Accumulate content for persistence
        if (event.type === 'item' && event.content) {
          fullAssistantContent += event.content
        }
      }

      // Save assistant response to in-memory history
      session.history.push({ role: 'user', content: message })
      if (fullAssistantContent) {
        session.history.push({ role: 'assistant', content: fullAssistantContent })
      }

      // Save assistant response to SQLite
      if (fullAssistantContent) {
        history.addMessage(sid, 'assistant', fullAssistantContent)
      }

      // Auto-title: use first user message as session title
      const msgCount = session.history.length
      if (msgCount <= 2) {
        const title = message.length > 40 ? message.substring(0, 40) + '…' : message
        history.updateSessionTitle(sid, title)
      }

      res.write(JSON.stringify({ type: 'end' }) + '\n')

      // Keep sessions manageable
      if (sessions.size > 100) {
        const firstKey = sessions.keys().next().value
        if (firstKey) sessions.delete(firstKey)
      }
    } catch (err) {
      console.error('[Chat] Error:', err)
      res.write(JSON.stringify({ type: 'item', content: '抱歉，我暂时无法回应，请稍后再试。' }) + '\n')
      res.write(JSON.stringify({ type: 'end' }) + '\n')
    } finally {
      res.end()
    }
  })

  // GET /api/ai/health - health check
  router.get('/health', (_req: Request, res: Response) => {
    const stats = agent.getNavigator().getStats()
    res.json({
      status: 'ok',
      kbFiles: stats.files,
      kbDirectories: stats.directories,
      sessions: sessions.size,
      uptime: process.uptime(),
    })
  })

  return router
}
