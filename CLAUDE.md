# SCVG Project Context

柒世纪视频组（Seventh Century Video Group）— MAD/MMD 创作研究社团官方网站。

## Tech Stack
- Frontend: Vue 3 + Vite + Arco Design + Vue Router
- Backend: Go + Echo + GORM + SQLite (port 7777)
- AI Backend: TypeScript + file-based RAG + DeepSeek API (port 7778)
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
- `backend/ai-backend/` — TypeScript AI assistant (LangGraph + file-based RAG)
- `backend/AI-data-source/` — Knowledge base markdown files for RAG

## Key Endpoints
- https://7thcv.cn — Production site
- /api/* — Go backend proxy (→ localhost:7777)
- /api/ai/* — AI backend proxy (→ localhost:7778)
