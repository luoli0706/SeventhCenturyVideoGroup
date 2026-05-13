import { Router, Request, Response } from 'express'
import { ChatHistory } from '../services/chat-history.js'

export function createHistoryRouter(history: ChatHistory): Router {
  const router = Router()

  // GET /api/ai/sessions - list all sessions
  router.get('/sessions', (_req: Request, res: Response) => {
    try {
      const sessions = history.getSessions()
      res.json({ sessions })
    } catch (err) {
      console.error('[History] Error listing sessions:', err)
      res.status(500).json({ error: '获取历史记录失败' })
    }
  })

  // GET /api/ai/sessions/:sessionId - get messages for a session
  router.get('/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      const messages = history.getMessages(sessionId)
      res.json({ sessionId, messages })
    } catch (err) {
      console.error('[History] Error getting session:', err)
      res.status(500).json({ error: '获取对话记录失败' })
    }
  })

  // DELETE /api/ai/sessions/:sessionId - delete a session
  router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params
      history.deleteSession(sessionId)
      res.json({ ok: true })
    } catch (err) {
      console.error('[History] Error deleting session:', err)
      res.status(500).json({ error: '删除对话失败' })
    }
  })

  return router
}
