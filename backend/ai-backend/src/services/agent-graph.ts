import OpenAI from 'openai'
import { env } from '../config/env.js'
import { KnowledgeNavigator } from './kb-navigator.js'

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

const NAVIGATOR_PROMPT = `你是一个知识库导航系统。你的任务是从标题树中选择与用户问题最相关的节点。

标题树（仅标题层级，无正文内容）：
{{INDEX}}

用户问题：{{QUERY}}
{{EXISTING_CONTEXT}}

规则：
1. 选择最匹配用户问题的标题节点，优先选择深度更深（更具体）的节点
2. 如果问题涉及多个方面，可以输出多个标题
3. 输出标题文本必须与标题树中的完全一致
4. 如果已加载内容足够回答，输出 DONE
5. 如果问题与知识库完全无关，输出 SKIP_KB
6. 最多选择3个最相关的标题

输出格式：每行一个标题（例如：MAD 知识核心 > 主要分类）`

export class AgentGraph {
  private openai: OpenAI
  private navigator: KnowledgeNavigator

  constructor(navigator: KnowledgeNavigator) {
    this.navigator = navigator
    this.openai = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL,
    })
  }

  /**
   * Navigate the knowledge base: LLM picks relevant sections from the index.
   * Returns resolved heading paths (may be empty if KB is irrelevant).
   */
  async navigate(query: string, existingContext: string[]): Promise<string[]> {
    const index = this.navigator.getIndex()
    const existingBlock = existingContext.length > 0
      ? `\n已加载的内容节点：${existingContext.map((c, i) => {
          const title = c.split('\n')[0]?.substring(0, 80) || `[节点${i+1}]`
          return `\n节点${i+1}: ${title}`
        }).join('')}\n\n如果已有内容足够，输出 DONE。如果需要补充，继续选择。`
      : ''

    const prompt = NAVIGATOR_PROMPT
      .replace('{{INDEX}}', index)
      .replace('{{QUERY}}', query)
      .replace('{{EXISTING_CONTEXT}}', existingBlock)

    const response = await this.openai.chat.completions.create({
      model: env.DEEPSEEK_CHAT_MODEL,
      messages: [
        { role: 'system', content: '你是一个精确的知识库导航系统，只输出标题路径。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 512,
    })

    const content = response.choices[0]?.message?.content || ''
    const lines = content.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('```') && !l.startsWith('DONE') && !l.startsWith('SKIP'))

    if (lines.length === 0) return []

    // Resolve each line to a valid heading path
    const resolved: string[] = []
    for (const line of lines) {
      const heading = this.navigator.findClosestHeading(line)
      if (heading && !resolved.includes(heading)) {
        resolved.push(heading)
      }
    }

    if (resolved.length > 0) {
      console.log(`[Agent] Navigated → ${resolved.length} section(s): ${resolved.join(', ')}`)
    } else {
      console.log('[Agent] Navigation: no matching sections found (LLM output will be used as-is)')
    }

    return resolved
  }

  /**
   * Load content for the given heading paths. Returns a formatted context string.
   */
  loadContext(headingPaths: string[]): string {
    const parts: string[] = []
    for (const path of headingPaths) {
      const content = this.navigator.loadSubtree(path)
      if (content.trim()) {
        parts.push(content.trim())
      }
    }
    return parts.join('\n\n---\n\n')
  }

  /**
   * Full ReACT pipeline: navigate → navigate again (if needed) → load → generate.
   * Returns a stream of the final response.
   *
   * ReACT rounds:
   *   Round 1: navigate (pick sections from index)
   *   Round 2: navigate again (pick additional sections if needed)
   *   Load all selected sections → generate streaming response.
   */
  async* processQuery(
    query: string,
    history: { role: 'system' | 'user' | 'assistant'; content: string }[]
  ): AsyncGenerator<{ type: string; content?: string; paths?: string[] }> {
    console.log(`[Agent] Processing query: "${query.substring(0, 60)}..."`)

    // === ReACT Round 1: Initial navigation ===
    const paths1 = await this.navigate(query, [])
    const allPaths = [...paths1]

    // === ReACT Round 2: Optional supplementary navigation ===
    if (allPaths.length > 0) {
      const loadedParts = allPaths.map(p => {
        const c = this.navigator.loadSubtree(p)
        return c.substring(0, 100)
      })
      const paths2 = await this.navigate(query, loadedParts)
      for (const p of paths2) {
        if (!allPaths.includes(p)) allPaths.push(p)
      }
    }

    // === Load all selected content ===
    let contextBlock = ''
    const loadedPaths: string[] = []

    if (allPaths.length > 0) {
      contextBlock = this.loadContext(allPaths)
      loadedPaths.push(...allPaths)
    }

    // Yield references for frontend display
    if (loadedPaths.length > 0) {
      yield {
        type: 'references',
        paths: loadedPaths,
      }
    }

    // === Generate streaming response ===
    const contextSection = contextBlock.trim()
      ? `\n以下是与问题相关的知识库内容（可能不完整，如有遗漏请如实告知）：\n\n${contextBlock}\n`
      : ''

    const historyMessages = history.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))

    const userContent = contextSection
      ? `${contextSection}\n请基于以上知识回答：\n\n${query}`
      : query

    const stream = await this.openai.chat.completions.create({
      model: env.DEEPSEEK_CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyMessages.slice(-6), // last 3 turns of context
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
        yield { type: 'item', content }
      }
    }

    if (!hasContent) {
      yield { type: 'item', content: '抱歉，我暂时无法回应，请稍后再试。' }
    }
  }

  getNavigator(): KnowledgeNavigator {
    return this.navigator
  }
}
