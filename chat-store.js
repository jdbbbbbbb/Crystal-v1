import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;

export class ChatStore {
  constructor(databasePath) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        username_key TEXT NOT NULL UNIQUE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        conversation_key TEXT NOT NULL DEFAULT 'general',
        reply_to_id INTEGER REFERENCES messages(id)
      );
      CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    `);
    const messageColumns = this.database.prepare('PRAGMA table_info(messages)').all();
    if (!messageColumns.some((column) => column.name === 'conversation_key')) {
      this.database.exec("ALTER TABLE messages ADD COLUMN conversation_key TEXT NOT NULL DEFAULT 'general'");
    }
    if (!messageColumns.some((column) => column.name === 'reply_to_id')) {
      this.database.exec('ALTER TABLE messages ADD COLUMN reply_to_id INTEGER REFERENCES messages(id)');
    }
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS message_reads (
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TEXT NOT NULL,
        PRIMARY KEY (message_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS message_reactions (
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (message_id, user_id, emoji)
      );
      CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_key, id);
    `);
  }

  createAccount(usernameInput, password) {
    const username = String(usernameInput ?? '').trim();
    const usernameKey = username.toLowerCase();
    if (!usernamePattern.test(username)) throw Object.assign(new Error('Use 3–24 letters, numbers, underscores, or hyphens for your username.'), { status: 400 });
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      throw Object.assign(new Error('Password must be between 10 and 128 characters.'), { status: 400 });
    }
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    try {
      const result = this.database.prepare(
        'INSERT INTO users (username, username_key, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(username, usernameKey, salt.toString('hex'), hash.toString('hex'), new Date().toISOString());
      return this.userById(Number(result.lastInsertRowid));
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw Object.assign(new Error('That username is already taken.'), { status: 409 });
      throw error;
    }
  }

  authenticate(usernameInput, password) {
    const usernameKey = String(usernameInput ?? '').trim().toLowerCase();
    const user = this.database.prepare(
      'SELECT id, username, password_salt, password_hash FROM users WHERE username_key = ?'
    ).get(usernameKey);
    if (!user || typeof password !== 'string') return null;
    const expected = Buffer.from(user.password_hash, 'hex');
    const actual = scryptSync(password, Buffer.from(user.password_salt, 'hex'), expected.length);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    return { id: Number(user.id), username: user.username };
  }

  createSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    this.database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .run(tokenHash, userId, Date.now() + sessionLifetimeMs);
    this.database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    return token;
  }

  userForSession(token) {
    if (!token) return null;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = this.database.prepare(`
      SELECT users.id, users.username, sessions.expires_at
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(tokenHash);
    if (!row) return null;
    if (row.expires_at <= Date.now()) {
      this.database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
      return null;
    }
    return { id: Number(row.id), username: row.username };
  }

  deleteSession(token) {
    if (!token) return;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    this.database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }

  resolveConversation(userId, conversationInput) {
    const conversation = String(conversationInput || 'general');
    if (conversation === 'general') return 'general';
    const match = /^dm\/(\d+)$/.exec(conversation);
    if (!match) throw Object.assign(new Error('Unknown chat conversation.'), { status: 400 });
    const otherId = Number(match[1]);
    if (!Number.isSafeInteger(otherId) || otherId <= 0 || otherId === userId || !this.userById(otherId)) {
      throw Object.assign(new Error('That direct message recipient is unavailable.'), { status: 404 });
    }
    return `dm:${Math.min(userId, otherId)}:${Math.max(userId, otherId)}`;
  }

  addMessage(userId, contentInput, conversationKey = 'general', replyToId = null) {
    const content = String(contentInput ?? '').trim();
    if (!content || content.length > 500) throw Object.assign(new Error('Messages must be between 1 and 500 characters.'), { status: 400 });
    let replyTo = null;
    if (replyToId !== null && replyToId !== undefined) {
      if (!Number.isSafeInteger(replyToId) || replyToId <= 0) {
        throw Object.assign(new Error('Invalid reply target.'), { status: 400 });
      }
      replyTo = this.database.prepare(`
        SELECT messages.id, messages.content, users.username, messages.conversation_key
        FROM messages JOIN users ON users.id = messages.user_id WHERE messages.id = ?
      `).get(replyToId);
      if (!replyTo || replyTo.conversation_key !== conversationKey) {
        throw Object.assign(new Error('That message cannot be replied to.'), { status: 404 });
      }
    }
    const createdAt = new Date().toISOString();
    const result = this.database.prepare('INSERT INTO messages (user_id, content, created_at, conversation_key, reply_to_id) VALUES (?, ?, ?, ?, ?)')
      .run(userId, content, createdAt, conversationKey, replyTo?.id ?? null);
    return {
      id: Number(result.lastInsertRowid),
      userId,
      content,
      createdAt,
      readBy: [],
      replyTo: replyTo ? { id: Number(replyTo.id), username: replyTo.username, content: replyTo.content } : null
    };
  }

  listMessages(userId, conversationKey) {
    const readResult = this.database.prepare(`
      INSERT OR IGNORE INTO message_reads (message_id, user_id, read_at)
      SELECT id, ?, ? FROM messages WHERE conversation_key = ? AND user_id != ?
    `).run(userId, new Date().toISOString(), conversationKey, userId);
    const rows = this.database.prepare(`
      SELECT messages.id, messages.user_id, users.username, messages.content, messages.created_at,
        messages.reply_to_id, reply_users.username AS reply_username, replies.content AS reply_content,
        (SELECT GROUP_CONCAT(reading_users.username, char(31))
          FROM message_reads
          JOIN users AS reading_users ON reading_users.id = message_reads.user_id
          WHERE message_reads.message_id = messages.id) AS read_by
      FROM messages
      JOIN users ON users.id = messages.user_id
      LEFT JOIN messages AS replies ON replies.id = messages.reply_to_id
      LEFT JOIN users AS reply_users ON reply_users.id = replies.user_id
      WHERE messages.conversation_key = ?
      ORDER BY messages.id DESC LIMIT 100
    `).all(conversationKey).reverse();
    const listReactions = this.database.prepare(`
      SELECT emoji, COUNT(*) AS count, MAX(user_id = ?) AS reacted
      FROM message_reactions WHERE message_id = ? GROUP BY emoji ORDER BY emoji
    `);
    const messages = rows.map((row) => ({
      id: Number(row.id),
      userId: Number(row.user_id),
      username: row.username,
      content: row.content,
      createdAt: row.created_at,
      readBy: row.read_by ? row.read_by.split('\x1f') : [],
      replyTo: row.reply_to_id ? { id: Number(row.reply_to_id), username: row.reply_username, content: row.reply_content } : null,
      reactions: listReactions.all(userId, row.id).map((reaction) => ({
        emoji: reaction.emoji,
        count: Number(reaction.count),
        reacted: Boolean(reaction.reacted)
      }))
    }));
    return { messages, readChanged: readResult.changes > 0 };
  }

  toggleReaction(userId, messageId, conversationKey, emoji) {
    const allowedEmojis = new Set(['👍', '❤️', '😂', '😮', '😢']);
    if (!Number.isSafeInteger(messageId) || messageId <= 0 || !allowedEmojis.has(emoji)) {
      throw Object.assign(new Error('Invalid reaction.'), { status: 400 });
    }
    const message = this.database.prepare('SELECT conversation_key FROM messages WHERE id = ?').get(messageId);
    if (!message || message.conversation_key !== conversationKey) {
      throw Object.assign(new Error('That message is unavailable.'), { status: 404 });
    }
    const existing = this.database.prepare('SELECT 1 FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?')
      .get(messageId, userId, emoji);
    if (existing) {
      this.database.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?')
        .run(messageId, userId, emoji);
      return false;
    }
    this.database.prepare('INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)')
      .run(messageId, userId, emoji, new Date().toISOString());
    return true;
  }

  listUsers(excludeUserId) {
    return this.database.prepare('SELECT id, username FROM users WHERE id != ? ORDER BY username_key LIMIT 200')
      .all(excludeUserId)
      .map((user) => ({ id: Number(user.id), username: user.username }));
  }

  userById(id) {
    const user = this.database.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
    return user ? { id: Number(user.id), username: user.username } : null;
  }

  close() {
    this.database.close();
  }
}