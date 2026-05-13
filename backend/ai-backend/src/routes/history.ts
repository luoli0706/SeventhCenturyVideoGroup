import { Router, Request, Response } from 'express'
import { ChatHistory } from '../services/chat-history.js'

export function createHistoryRouter(history: ChatHistory): Router {
  const router = Router()

  // Helper to extract user ID from request
  function getUserId(req: Request): string {
    return req.headers['x-user-cn'] as string || req.query.userId as string || ''
  }

  // GET /api/ai/sessions - list sessions for current user
  router.get('/sessions', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      if (!userId) {
        res.status(400).json({ error: '缺少用户标识' })
        return
      }
      const sessions = history.getSessions(userId)
      res.json({ sessions })
    } catch (err) {
      console.error('[History] Error listing sessions:', err)
      res.status(500).json({ error: '获取历史记录失败' })
    }
  })

  // GET /api/ai/sessions/:sessionId - get messages for a session
  router.get('/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      if (!userId) {
        res.status(400).json({ error: '缺少用户标识' })
        return
      }
      const { sessionId } = req.params
      const messages = history.getMessages(sessionId, userId)
      res.json({ sessionId, messages })
    } catch (err) {
      console.error('[History] Error getting session:', err)
      res.status(500).json({ error: '获取对话记录失败' })
    }
  })

  // DELETE /api/ai/sessions/:sessionId - delete a session
  router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      if (!userId) {
        res.status(400).json({ error: '缺少用户标识' })
        return
      }
      const { sessionId } = req.params
      history.deleteSession(sessionId, userId)
      res.json({ ok: true })
    } catch (err) {
      console.error('[History] Error deleting session:', err)
      res.status(500).json({ error: '删除对话失败' })
    }
  })

  return router
}
