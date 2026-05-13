export interface ChatRequest {
  message: string
  sessionId?: string
  model?: string
}

export interface HeadingMapEntry {
  path: string
  isDir: boolean
}

export type MessageRole = 'system' | 'user' | 'assistant'
