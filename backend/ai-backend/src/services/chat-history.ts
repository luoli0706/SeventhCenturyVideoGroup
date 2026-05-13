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
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    stmt.run(id, userId, title || '', now, now)
  }

  updateSessionTitle(sessionId: string, title: string): void {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    this.db.prepare('UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?').run(title, now, sessionId)
  }

  touchSession(sessionId: string): void {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(now, sessionId)
  }

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): void {
    this.db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, role, content)
    this.touchSession(sessionId)
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
