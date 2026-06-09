# H5游戏《谁是卧底》设计规范 (Design Spec)

本项目是一款基于 H5 网页的《谁是卧底》联机对战小游戏。游戏支持**线上模式**（全自动流程与实时发言/投票）与**线下模式**（联机分发词汇，房主控制台掌控全局）。系统支持多词库勾选、自定义词库贡献、房间列表浏览、房主转交以及多回合累计积分榜。

---

## 1. 技术栈选择

* **前端 H5 客户端**：React + Vite + TypeScript + Tailwind CSS v4
  * 采用 H5 响应式布局，完美适配手机浏览器与微信内置浏览器。
  * 样式采用最新的 Tailwind CSS v4 进行极简且质感的暗黑/磨砂玻璃风格设计。
* **后端服务端**：TypeScript + Node.js (基于 `ws` 库实现 WebSocket 房间控制，基于内置 `http` 模块处理 API 请求)
  * 服务运行端口：**17712**
  * 本地开发使用 Vite Proxy 将前端 `/api` 和 `/ws` 请求代理至后端。
* **数据库**：SQLite 3 (存储游戏内置词库及用户贡献的自定义词库)

---

## 2. 系统架构与目录结构

采用前后端分离的 Monorepo 目录设计，结构清晰且利于类型共享。

```
/Who_is_Another/
├── backend/                  # 后端 Node TS 服务
│   ├── src/
│   │   ├── index.ts          # 入口文件：监听 17712 端口，处理 HTTP 路由与 WebSocket 升级
│   │   ├── db.ts             # SQLite 初始化与词汇操作库
│   │   ├── roomManager.ts    # 内存房间连接池与瞬态状态管理器
│   │   ├── gameLogic.ts      # 谁是卧底游戏阶段流转与结算算法
│   │   └── types.ts          # WebSocket 通信协议消息定义及房间接口定义
│   ├── package.json          # 依赖: ws, sqlite3, typescript, nodemon 等
│   ├── tsconfig.json
│   └── data/
│       └── words.db          # SQLite 词库数据库
└── frontend/                 # 前端 React 客户端
    ├── src/
    │   ├── components/       # 界面组件 (Lobby, Room, GameBoard, Scoreboard, ContributeWords)
    │   ├── hooks/
    │   │   └── useWebSocket.ts # 自定义 Hook，封装 WebSocket 消息重连及接收处理
    │   ├── App.tsx           # 路由分发与房间流程控制
    │   ├── index.css         # Tailwind v4 全局引入及主题色变量定义
    │   └── main.tsx
    ├── package.json          # 依赖: react, tailwindcss, lucide-react 等
    └── vite.config.ts        # 配置端口及代理（/api & /ws 代理至 17712 端口）
```

---

## 3. 数据库设计 (SQLite)

数据库仅用于存储词汇库配置，房间和游戏中的状态由后端内存进程维护。

### 3.1 词库分类表 `categories`
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,          -- 词库名称 (如: "经典词库", "数码科技", "二次元")
  description TEXT,                   -- 词库简介描述
  is_default INTEGER DEFAULT 0,       -- 是否为系统默认词库 (1为默认，0为用户贡献)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 词汇对表 `word_pairs`
```sql
CREATE TABLE word_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,        -- 关联分类 ID
  word_a TEXT NOT NULL,                -- 词汇 A (如: "苹果")
  word_b TEXT NOT NULL,                -- 词汇 B (如: "梨子")
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

---

## 4. HTTP API 接口规范

所有的 HTTP API 服务由 Node.js 后端统一处理，前缀为 `/api`。

1. **获取所有词库列表**
   * **请求**：`GET /api/categories`
   * **响应**：
     ```json
     [
       { "id": 1, "name": "经典常用", "description": "适合新手的常见词汇", "is_default": 1, "word_count": 42 }
     ]
     ```
2. **预览某个词库的词汇对**
   * **请求**：`GET /api/categories/:id/words`
   * **响应**：
     ```json
     [
       { "id": 12, "word_a": "牛奶", "word_b": "豆浆" }
     ]
     ```
3. **创建新词库分类 (用户贡献)**
   * **请求**：`POST /api/categories`
   * **参数**：`{ "name": "程序员词库", "description": "互联网黑话与代码工具" }`
   * **响应**：创建成功返回该 category 详情。
4. **向词库中添加新词汇对**
   * **请求**：`POST /api/categories/:id/words`
   * **参数**：`{ "word_a": "Java", "word_b": "JavaScript" }`
   * **响应**：成功状态。
5. **获取公开房间列表 (大厅房间列表)**
   * **请求**：`GET /api/rooms`
   * **响应**：返回当前所有处于 `lobby` 状态、人数未满且设置为公开的房间。
     ```json
     [
       { "roomId": "8888", "hostName": "小明", "playerCount": 5, "maxPlayers": 8, "mode": "online" }
     ]
     ```

---

## 5. WebSocket 通信协议设计

WebSocket 连接升级路径为 `/ws`。所有消息基于 JSON 格式，包含以下结构：
```typescript
interface WsMessage {
  type: string;     // 消息类型
  payload: any;     // 携带的数据
}
```

### 5.1 客户端 -> 服务端 消息定义

| 消息类型 (`type`) | 消息参数 (`payload`) | 说明 |
| :--- | :--- | :--- |
| `join_room` | `{ roomId: string, nickname: string }` | 加入房间，无此房间号则系统基于此ID作为房主自动建房 |
| `start_game` | `{ mode: 'online' \| 'offline', categoryIds: number[], maxPlayers: number, totalRounds: number }` | 房主启动游戏并设置规则参数 |
| `send_description` | `{ text: string }` | 线上模式：当前发言玩家向服务端发送文字描述 |
| `cast_vote` | `{ targetPlayerId: string }` | 线上模式：存活玩家在投票阶段提交得票人 |
| `eliminate_player` | `{ playerId: string }` | 线下模式：房主从控制台手动标记淘汰某人 |
| `next_round` | `{}` | 线下模式：房主手动结算本局，开启下一局 |
| `transfer_owner` | `{ targetPlayerId: string }` | 房主将自己的房主特权转交给指定玩家 |
| `restart_game` | `{ keepScore: boolean }` | 游戏结束后，房主选择是否保留当前积分重新开始 |

### 5.2 服务端 -> 客户端 消息定义

| 消息类型 (`type`) | 目的端 | 说明 |
| :--- | :--- | :--- |
| `room_state` | 广播 | 房间状态全量更新同步，驱动客户端视图 |
| `your_word` | 单播 | 发送给特定玩家其本局的词汇及身份角色 |
| `error` | 单播 | 异常处理（如房间已满、游戏已在进行中等错误提示） |

---

## 6. 游戏流程与状态机

房间在后端生命周期维护如下状态：
```
                   ┌───────────────┐
                   │    lobby      │ <──────────────────────┐
                   └───────┬───────┘                        │
                           │ start_game                     │
            线上模式        │         线下模式               │ restart_game
         ┌─────────────────┴─────────────────┐              │
         ▼                                   ▼              │
┌──────────────────┐               ┌──────────────────┐     │
│playing_description│               │ offline_playing  │ ───┼─┐
└────────┬─────────┘               └────────┬─────────┘     │ │
         │ 全员描述完毕                       │ 房主点击淘汰     │ │
         ▼                                   ▼              │ │
┌──────────────────┐               ┌──────────────────┐     │ │
│  playing_voting  │               │ 胜负判定/局数到达  │ ────┘ │
└────────┬─────────┘               └────────┬─────────┘         │
         │ 计票淘汰与胜负判定                  │                   │
         └────────┬──────────────────────────┘                   │
                  ▼                                              │
         ┌──────────────────┐                                    │
         │      ended       │ ───────────────────────────────────┘
         └──────────────────┘
```

### 6.1 线上模式详细逻辑
1. **大厅**：玩家自定义昵称加入。创建者默认为房主。房主可以勾选词库、配置最大人数与总局数（默认5局），并可随时将房主转交他人。
2. **描述阶段**：系统随机打乱玩家顺序，每次高亮一位玩家进行发言。后端计算 `currentSpeakerId` 广播，非发言人不可输入文字。
3. **投票阶段**：所有存活玩家界面显示投票卡片，对嫌疑人发起投票。
4. **结算**：系统统计得票最高的人将其淘汰，并公布其本局的词汇与身份。
   * 若卧底全部出局，平民胜；
   * 若卧底人数 >= 平民存活数，卧底胜；
   * 若胜负未分，进入下一轮发言。
5. **积分累加**：进入本局结算。系统将分数计入房间内存中，并继续下一局直至达到总局数，最后展示终极计分榜。

### 6.2 线下模式详细逻辑
1. **大厅**：玩家扫码或输入房间号加入大厅。
2. **分发词汇**：房主配置游戏并点击启动。服务端从选中词库中抽词，并通过单播将词汇下发给玩家。
3. **隐藏与防窥**：玩家手机屏幕显示一个被遮住的卡片，玩家需要按住/点击卡片才能显示词汇，松开后自动隐藏，有效防范线下旁边人窥屏。
4. **房主控制台**：房主手机进入“上帝视角”，显示所有人身份（谁是卧底、具体词汇）。玩家在现实中面对面描述和讨论。
5. **手动淘汰**：现实中玩家投票淘汰某人后，房主在控制台上点击“淘汰该玩家”按钮。服务端收到指令后判定胜负，直至本局结束，房主点击“下一局”重新发牌。

---

## 7. 积分排行榜与积分策略

每个房间在内存中维护跨回合的积分表。每一局结束时，根据其角色和实际表现计分并累加：

1. **平民得分 (Civilian)**
   * **胜利分**：若本局平民获得最终胜利，所有平民玩家 `+20` 分。
   * **指认分**：在投票阶段中，平民玩家如果成功把票投给了**真正的卧底**，每次成功指认 `+15` 分（即使最终该卧底没有被投出，只要指认正确就给分）。
2. **卧底得分 (Undercover)**
   * **胜利分**：若卧底成功误导平民并获胜，卧底玩家 `+40` 分.
   * **存活分**：若卧底在整局游戏结束时仍未被淘汰，额外 `+20` 分。
   * **低嫌疑加成 (Survival Bonus)**：如果卧底被越少的人投过票，说明伪装越成功，获得更高的附加分。
     * 计算公式：`附加得分 = (本局存活的总人数 - 该卧底本局累计获得的得票数) * 4`

---

## 8. 总结与后续

局数达到总局数后，房间进入最终计分板，决出前三名并辅以炫酷的颁奖动画。房间不解散，房主可以直接按照原配置发起新一轮比赛，也可以在房间中修改配置（如加入新朋友、多选几个词库）后重开，极高地保留玩家留存率。
