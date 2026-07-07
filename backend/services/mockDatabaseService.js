import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const seedDataPath = path.join(__dirname, '..', 'data', 'schemes_documents.json');

// Initialize database connection
let db;

function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error opening local SQLite database:', err);
        return reject(err);
      }
      
      try {
        // Create tables
        await runQuery(`
          CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            tracking_id TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            urgency TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            photo_url TEXT,
            status TEXT DEFAULT 'submitted',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            messages TEXT DEFAULT '[]',
            language TEXT DEFAULT 'en',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS schemes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            eligibility TEXT,
            eligibility_hi TEXT,
            description TEXT,
            description_hi TEXT,
            documents_required TEXT, -- Store as JSON string
            official_url TEXT,
            processing_time TEXT
          )
        `);

        // Seed schemes if empty
        const count = await getRow('SELECT COUNT(*) as count FROM schemes');
        if (count && count.count === 0) {
          console.log('Seeding local schemes database...');
          if (fs.existsSync(seedDataPath)) {
            const rawData = fs.readFileSync(seedDataPath, 'utf8');
            const data = JSON.parse(rawData);
            for (const s of data.schemes) {
              await runQuery(
                `INSERT INTO schemes (id, name, category, eligibility, eligibility_hi, description, description_hi, documents_required, official_url, processing_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  s.id,
                  s.name,
                  s.category,
                  s.eligibility,
                  s.eligibility_hi,
                  s.description,
                  s.description_hi,
                  JSON.stringify(s.documents_required || []),
                  s.official_url,
                  s.processing_time
                ]
              );
            }
            console.log(`Seeded ${data.schemes.length} schemes successfully.`);
          }
        }
        resolve();
      } catch (tableErr) {
        reject(tableErr);
      }
    });
  });
}

// Promise wrappers for SQLite3
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Auto init
initDb().then(() => console.log('Mock SQLite Database Initialized.')).catch(err => console.error('Mock SQLite Init Error:', err));

// Export database operations
export const mockDatabaseService = {
  // Complaints operations
  async saveComplaint(complaint) {
    const { id, tracking_id, description, category, urgency, latitude, longitude, photo_url } = complaint;
    await runQuery(
      `INSERT INTO complaints (id, tracking_id, description, category, urgency, latitude, longitude, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tracking_id, description, category, urgency, latitude, longitude, photo_url]
    );
    return this.getComplaintByTrackingId(tracking_id);
  },

  async getComplaintByTrackingId(trackingId) {
    const row = await getRow('SELECT * FROM complaints WHERE tracking_id = ?', [trackingId]);
    return row;
  },

  async updateComplaintStatus(trackingId, status) {
    await runQuery(
      'UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE tracking_id = ?',
      [status, trackingId]
    );
    return this.getComplaintByTrackingId(trackingId);
  },

  async getAllComplaints() {
    return allRows('SELECT * FROM complaints ORDER BY created_at DESC');
  },

  // Chat sessions operations
  async saveChatSession(id, messages, language) {
    // Check if session exists
    const existing = await getRow('SELECT id FROM chat_sessions WHERE id = ?', [id]);
    const messagesJson = JSON.stringify(messages);
    if (existing) {
      await runQuery(
        'UPDATE chat_sessions SET messages = ?, language = ? WHERE id = ?',
        [messagesJson, language, id]
      );
    } else {
      await runQuery(
        'INSERT INTO chat_sessions (id, messages, language) VALUES (?, ?, ?)',
        [id, messagesJson, language]
      );
    }
    return this.getChatSession(id);
  },

  async getChatSession(id) {
    const row = await getRow('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    if (row) {
      row.messages = JSON.parse(row.messages || '[]');
    }
    return row;
  },

  // Schemes operations
  async getSchemes() {
    const rows = await allRows('SELECT * FROM schemes');
    return rows.map(r => ({
      ...r,
      documents_required: JSON.parse(r.documents_required || '[]')
    }));
  },

  async getSchemeById(id) {
    const r = await getRow('SELECT * FROM schemes WHERE id = ?', [id]);
    if (r) {
      r.documents_required = JSON.parse(r.documents_required || '[]');
    }
    return r;
  }
};
