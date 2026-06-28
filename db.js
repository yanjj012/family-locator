const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

async function initDB() {
  const SQL = await initSqlJs();
  let db;
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`CREATE TABLE IF NOT EXISTS locations (
    device_id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  
  // 持久化到文件
  function save() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
  
  // 每次 SQL 操作后保存
  const origRun = db.run.bind(db);
  db.run = function(...args) {
    const result = origRun(...args);
    save();
    return result;
  };
  
  const origExec = db.exec.bind(db);
  db.exec = function(...args) {
    const result = origExec(...args);
    save();
    return result;
  };
  
  return db;
}

module.exports = initDB;
