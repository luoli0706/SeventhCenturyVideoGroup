# SCVG Project Context

柒世纪视频组（Seventh Century Video Group）— MAD/MMD 创作研究社团官方网站。

## Tech Stack
- Frontend: Vue 3 + Vite + Arco Design + Vue Router
- Backend: Go + Echo + GORM + SQLite (port 7777)
- AI Backend: TypeScript + ReACT + B+ Tree KB + DeepSeek API (port 7778)
- Proxy: nginx (HTTPS via Let's Encrypt)

## Design Theme
<design_aesthetic>
A dark creative theme inspired by creative studio / animation portfolio aesthetics:
- **Primary palette**: Deep indigo (#1a1a2e) → violet (#16213e) → accent cyan (#0f9b8e) / warm amber (#e6a817)
- **Typography**: Clean sans-serif hierarchy with generous line-height (1.6+) for readability
- **Surfaces**: Dark cards with subtle glassmorphism (backdrop-blur, rgba backgrounds), elevated with soft glows
- **Borders & dividers**: Subtle 1px borders at low opacity (rgba white 0.06-0.1)
- **Interactive states**: Cyan accent for active/selected, amber for hover highlights
- **Spacing**: 4px grid system, 16px/24px/32px as standard gutters
- **Motion**: Smooth 200-300ms transitions with ease-out, subtle scale on interaction
- **Don't use**: Default browser styles, pure white backgrounds (#fff), overused gradients, generic card shadows
</design_aesthetic>

## Project Structure
- `frontend/` — Vue 3 SPA with Arco Design components
- `backend/go-echo-sqlite/` — Go API server (Echo + GORM + SQLite)
- `backend/ai-backend/` — TypeScript AI assistant (ReACT + B+ Tree KB navigation)
- `backend/AI-data-source/` — Knowledge base markdown files (B+ tree directory structure)

## AI Assistant Architecture

### Knowledge Base (B+ Tree)
- `AI-data-source/索引.md` — Internal node: complete H1→H4 title tree, no content body
- `AI-data-source/<H1>/...` — Leaf nodes: content files organized by heading hierarchy
- Each heading level corresponds to a directory/file level in the file system
- LLM navigates the index tree to find relevant sections, system loads entire subtrees

### ReACT Pipeline
```
User Query → [Navigate LLM] → picks headings from 索引.md
              → [Load] → reads full subtree content from disk
              → [Generate LLM] → streams response via OpenAI SDK
              → [Round 2] → repeat navigation for supplementary context
```

Key files:
- `src/services/kb-navigator.ts` — Heading→path mapping, subtree loading
- `src/services/agent-graph.ts` — ReACT loop (navigate → load → generate)
- `src/routes/chat.ts` — POST /api/ai/chat streaming endpoint

### DeepSeek API
- Chat model: `deepseek-v4-flash` (primary), `deepseek-v4-pro` (fallback)
- No embedding API — navigation is LLM-driven, not vector-based

## Key Endpoints
- https://7thcv.cn — Production site
- /api/* — Go backend proxy (→ localhost:7777)
- /api/ai/* — AI backend proxy (→ localhost:7778, streaming)

## Systemd Services
- `scvg.service` — Go backend
- `ai-backend.service` — TypeScript AI backend (tsx src/index.ts)
- nginx — Reverse proxy + HTTPS
