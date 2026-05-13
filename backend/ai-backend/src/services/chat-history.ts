import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

export interface Session {
  id: string
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
    `)
  }

  createSession(id: string, title?: string): void {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
    )
    stmt.run(id, title || '', now, now)
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

  getSessions(): Session[] {
    const rows = this.db.prepare(`
      SELECT s.id, s.title, s.created_at, s.updated_at,
        (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s
      ORDER BY s.updated_at DESC
      LIMIT 50
    `).all() as Session[]
    return rows
  }

  getMessages(sessionId: string): Message[] {
    return this.db.prepare(
      'SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY id ASC'
    ).all(sessionId) as Message[]
  }

  deleteSession(sessionId: string): void {
    this.db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId)
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
  }

  close(): void {
    this.db.close()
  }
}
