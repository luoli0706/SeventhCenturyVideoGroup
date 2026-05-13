import { Router, Request, Response } from 'express'
import { AgentGraph } from '../services/agent-graph.js'
import { ChatRequest } from '../types/index.js'

interface SessionMemory {
  history: { role: 'user' | 'assistant'; content: string }[]
}

const sessions = new Map<string, SessionMemory>()

export function createChatRouter(agent: AgentGraph): Router {
  const router = Router()

  // POST /api/ai/chat - streaming chat with ReACT navigation
  router.post('/chat', async (req: Request, res: Response) => {
    const { message, sessionId } = req.body as ChatRequest

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }

    const sid = sessionId || 'anonymous'
    console.log(`[Chat] Session: ${sid} | Query: "${message.substring(0, 80)}..."`)

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    res.write(JSON.stringify({ type: 'begin' }) + '\n')

    try {
      // Get or create session memory
      if (!sessions.has(sid)) {
        sessions.set(sid, { history: [] })
      }
      const session = sessions.get(sid)!

      // Run the ReACT agent
      const history = session.history.slice(-6) // last 3 turns
      const generator = agent.processQuery(message, history)

      for await (const event of generator) {
        res.write(JSON.stringify(event) + '\n')
      }

      // Save to history
      session.history.push({ role: 'user', content: message })
      // The assistant response will be accumulated in a real implementation

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
