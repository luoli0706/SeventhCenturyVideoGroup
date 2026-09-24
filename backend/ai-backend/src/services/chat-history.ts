import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

export interface Session {
  id: string
  user_id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  session_id: string
  role: string
  content: string
  created_at: string
}

export class ChatHistory {
  private db: Database.Database

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'data', 'chat-history.db')
    const dir = path.dirname(resolvedPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    this.db = new Database(resolvedPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.init()
  }

  private init(): void {
    // 所有时间戳统一用 datetime('now','localtime')，即服务所在时区的本地时间。
    // 本机为 Asia/Shanghai（UTC+0800），故落库即 UTC+8。
    // 注意：这依赖服务器的系统时区 —— 若日后把系统时区改成 UTC，
    // 存量数据与新增数据的含义都会跟着变，迁移前需一并考虑。
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    `)
    // Migrate existing data: add user_id column if missing
    try {
      this.db.exec('ALTER TABLE sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT \'\'')
    } catch {
      // column already exists — ignore
    }
  }

  createSession(id: string, userId: string, title?: string): void {
    // 时间戳一律交给 SQLite 生成（表默认值与 messages 用的都是
    // datetime('now','localtime')）。原先这里用 JS 的 toISOString() 手写，
    // 那是 UTC，而 messages 那边是本地时间 —— 同一会话的两张表差 8 小时。
    this.db.prepare(
      'INSERT OR IGNORE INTO sessions (id, user_id, title) VALUES (?, ?, ?)'
    ).run(id, userId, title || '')
  }

  updateSessionTitle(sessionId: string, title: string): void {
    this.db.prepare(
      "UPDATE sessions SET title = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(title, sessionId)
  }

  touchSession(sessionId: string): void {
    this.db.prepare(
      "UPDATE sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(sessionId)
  }

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): void {
    this.db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, role, content)
    this.touchSession(sessionId)
  }

  /**
   * 会话总数（不限用户与条数上限）。仅用于启动日志。
   *
   * 启动时还没有用户身份，原先直接调的是按用户过滤的 getSessions() 且没传参：
   * userId 落成 undefined → 绑定为 NULL → WHERE user_id = NULL 恒不命中，
   * 于是那行日志永远打印「0 previous sessions」，看着像历史库是空的。
   */
  countSessions(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number }
    return row.n
  }

  getSessions(userId: string): Session[] {
    const rows = this.db.prepare(`
      SELECT s.id, s.user_id, s.title, s.created_at, s.updated_at,
        (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s
      WHERE s.user_id = ?
      ORDER BY s.updated_at DESC
      LIMIT 50
    `).all(userId) as Session[]
    return rows
  }

  getMessages(sessionId: string, userId: string): Message[] {
    return this.db.prepare(
      `SELECT m.id, m.session_id, m.role, m.content, m.created_at
       FROM messages m
       JOIN sessions s ON s.id = m.session_id
       WHERE m.session_id = ? AND s.user_id = ?
       ORDER BY m.id ASC`
    ).all(sessionId, userId) as Message[]
  }

  deleteSession(sessionId: string, userId: string): void {
    this.db.prepare(
      'DELETE FROM messages WHERE session_id = ? AND session_id IN (SELECT id FROM sessions WHERE id = ? AND user_id = ?)'
    ).run(sessionId, sessionId, userId)
    this.db.prepare(
      'DELETE FROM sessions WHERE id = ? AND user_id = ?'
    ).run(sessionId, userId)
  }

  close(): void {
    this.db.close()
  }
}
