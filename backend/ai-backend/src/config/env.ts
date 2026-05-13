import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const env = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  DEEPSEEK_CHAT_MODEL: process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash',
  DEEPSEEK_EMBEDDING_MODEL: process.env.DEEPSEEK_EMBEDDING_MODEL || 'deepseek-embedding',
  PORT: parseInt(process.env.AI_BACKEND_PORT || '7778', 10),
  KNOWLEDGE_BASE_PATH: path.resolve(
    __dirname,
    '../../',
    process.env.KNOWLEDGE_BASE_PATH || '../AI-data-source'
  ),
  CACHE_PATH: path.resolve(__dirname, '../../data'),
}

if (!env.DEEPSEEK_API_KEY) {
  console.warn('⚠ DEEPSEEK_API_KEY is not set, embedding will use local fallback only')
}

console.log(`Knowledge base path: ${env.KNOWLEDGE_BASE_PATH}`)
console.log(`Cache path: ${env.CACHE_PATH}`)
console.log(`Port: ${env.PORT}`)
