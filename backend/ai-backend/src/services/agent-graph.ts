import { env } from '../config/env.js'
import { AgentState, ChunkResult } from '../types/index.js'
import { VectorStore } from './vector-store.js'
import { EmbeddingService } from './embedding-service.js'

const SYSTEM_PROMPT = `你是视小姬，柒世纪视频组（MAD/MMD创作研究社团）的AI助手。你热情、专业，使用简体中文交流。

## 你的特点
- 态度友好热情，语气活泼亲切，偶尔使用"喵"作为语气词
- 回答结构清晰，信息准确
- 基于知识库内容回答，不编造信息
- 对于超出知识范围的问题，诚实告知无法回答

## 回答规范
1. 优先使用参考文档中的信息来回答问题
2. 如果问题涉及具体步骤或操作，使用条理清晰的列表
3. 涉及版权、法律问题时，务必提醒合规操作
4. 回答中保留重要的警告、版权提醒和注意事项
5. 对内容进行适当语义压缩，移除冗余重复表述，保留所有关键信息
6. 如果参考文档中没有相关信息，诚实地告知用户
7. 不要提及"根据参考文档"或"根据知识库"等内部信息

## 知识范围
- MAD（MAD Movie）的定义、历史、分类、制作流程、工具生态
- MMD（MikuMikuDance）的基础概念、软硬件要求、工作流程、插件
- 柒世纪视频组的社团概况、组织架构、成员信息
- 新人学习路线图、资源导航

请用温暖专业的语气回答用户的问题。`

export class AgentGraph {
  private vectorStore: VectorStore
  private embeddingService: EmbeddingService

  constructor(vectorStore: VectorStore, embeddingService: EmbeddingService) {
    this.vectorStore = vectorStore
    this.embeddingService = embeddingService
  }

  /**
   * Run the retrieval node: embed query and search for relevant chunks.
   */
  async retrieve(query: string): Promise<{ retrievedContext: string; relevantChunks: ChunkResult[] }> {
    console.log(`[Agent] Retrieving context for: "${query.substring(0, 50)}..."`)
    const queryEmbedding = await this.embeddingService.generateEmbedding(query)
    const chunks = this.vectorStore.searchSimilarChunks(queryEmbedding, 5)
    const context = this.vectorStore.formatContext(chunks)
    return { retrievedContext: context, relevantChunks: chunks }
  }

  /**
   * Build the messages array for the LLM call.
   */
  buildMessages(query: string, context: string, model?: string) {
    const contextBlock = context || '（未找到相关参考文档）'

    const userPrompt = `以下是检索到的相关知识库内容：

${contextBlock}

请基于以上知识回答以下问题（如果知识库中没有相关信息，请如实告知）：

${query}`

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ] as const
  }

  /**
   * Get the system prompt for streaming responses (used by the route handler).
   */
  getSystemPrompt(): string {
    return SYSTEM_PROMPT
  }
}
