import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AgentGraph } from '../services/agent-graph.js'
import { ChatRequest } from '../types/index.js'

export function createChatRouter(agent: AgentGraph): Router {
  const router = Router()

  // POST /api/ai/chat - streaming chat endpoint
  router.post('/chat', async (req: Request, res: Response) => {
    const { message, model } = req.body as ChatRequest

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }

    console.log(`[Chat] Session: ${req.body.sessionId || 'anonymous'} | Query: "${message.substring(0, 80)}..."`)

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Send begin event
    res.write(JSON.stringify({ type: 'begin' }) + '\n')

    try {
      // Step 1: Retrieve relevant context
      const { retrievedContext, relevantChunks } = await agent.retrieve(message)

      // Send reference info
      if (relevantChunks.length > 0) {
        res.write(JSON.stringify({
          type: 'references',
          chunks: relevantChunks.map(c => ({
            title: c.documentTitle,
            content: c.content.substring(0, 200),
            similarity: c.similarity,
          })),
        }) + '\n')
      }

      // Step 2: Build messages and stream LLM response
      const openai = new OpenAI({
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: env.DEEPSEEK_BASE_URL,
      })

      const systemPrompt = agent.getSystemPrompt()
      const contextBlock = retrievedContext || '（未找到相关参考文档）'

      const userContent = `以下是检索到的相关知识库内容：

${contextBlock}

请基于以上知识回答以下问题（如果知识库中没有相关信息，请如实告知）：

${message}`

      const stream = await openai.chat.completions.create({
        model: model || env.DEEPSEEK_CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      })

      let hasContent = false
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          hasContent = true
          res.write(JSON.stringify({ type: 'item', content }) + '\n')
        }
      }

      if (!hasContent) {
        res.write(JSON.stringify({ type: 'item', content: '抱歉，我暂时无法回应，请稍后再试。' }) + '\n')
      }

      res.write(JSON.stringify({ type: 'end' }) + '\n')
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
    res.json({
      status: 'ok',
      documents: agent['vectorStore'].getDocumentCount(),
      chunks: agent['vectorStore'].getChunkCount(),
      uptime: process.uptime(),
    })
  })

  return router
}
