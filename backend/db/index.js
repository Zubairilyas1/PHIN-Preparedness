import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const dbDir = join(projectRoot, 'database');
const dbPath = join(dbDir, 'outbreak.sqlite');
const schemaPath = join(__dirname, 'schema.sql');

let db = null;
let SQL = null;

export async function initDatabase() {
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  
  SQL = await initSqlJs({ locateFile: () => join(__dirname, 'sql-wasm.wasm') });
  
  let fileBuffer;
  if (existsSync(dbPath)) {
    fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database initialized');
  
  return { db, SQL };
}

export { db };

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    writeFileSync(dbPath, Buffer.from(data));
  }
}

export function prepare(sql) {
  return {
    get: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      }
      stmt.free();
      return null;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    run: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      const changes = db.getRowsModified();
      stmt.free();
      saveDatabase();
      const idResult = db.exec('SELECT last_insert_rowid()');
      const lastInsertRowid = idResult[0]?.values[0]?.[0] || 0;
      return { changes, lastInsertRowid };
    },
    iterate: (...params) => {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      return {
        [Symbol.iterator]: () => ({
          next: () => {
            if (stmt.step()) {
              return { value: stmt.getAsObject(), done: false };
            }
            stmt.free();
            return { done: true };
          }
        })
      };
    }
  };
}

export function exec(sql, params = []) {
  if (params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
    return [];
  }
  const result = db.exec(sql);
  saveDatabase();
  return result;
}