const express = require('express');
const http = require('http');
const { Server } = require('ws');
const initDB = require('./db');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

const PORT = 3000;
const ADMIN_TOKEN = 'admin123'; // ⚠️ 请修改这个密码

let db;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 家人上报位置
app.post('/api/location', (req, res) => {
  const { device_id, lat, lng, name } = req.body;
  if (!device_id || lat == null || lng == null) {
    return res.status(400).json({ error: '缺少参数 device_id, lat, lng' });
  }
  
  db.run(
    `INSERT OR REPLACE INTO locations (device_id, name, lat, lng, updated_at)
     VALUES (?, ?, ?, ?, datetime('now','localtime'))`,
    [device_id, name || '未知', lat, lng]
  );
  
  broadcast({ type: 'location', device_id, name: name || '未知', lat, lng });
  res.json({ ok: true });
});

// 管理员获取所有位置
app.get('/api/locations', (req, res) => {
  const token = req.query.token || req.headers['x-token'];
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: '未授权' });
  
  const result = db.exec('SELECT device_id, name, lat, lng, updated_at FROM locations ORDER BY updated_at DESC');
  const rows = result[0]?.values.map(row => ({
    device_id: row[0], name: row[1], lat: row[2], lng: row[3], updated_at: row[4]
  })) || [];
  res.json(rows);
});

// 删除设备
app.delete('/api/locations/:device_id', (req, res) => {
  const token = req.query.token || req.headers['x-token'];
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: '未授权' });
  
  db.run('DELETE FROM locations WHERE device_id = ?', [req.params.device_id]);
  res.json({ ok: true });
});

// WebSocket 广播
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'auth' && data.token === ADMIN_TOKEN) {
        ws.isAdmin = true;
        const result = db.exec('SELECT device_id, name, lat, lng, updated_at FROM locations');
        const rows = result[0]?.values.map(row => ({
          device_id: row[0], name: row[1], lat: row[2], lng: row[3], updated_at: row[4]
        })) || [];
        ws.send(JSON.stringify({ type: 'init', locations: rows }));
      }
    } catch (e) {}
  });
});

initDB().then(database => {
  db = database;
  server.listen(PORT, () => {
    console.log(`\n🚀 家人位置追踪服务已启动!`);
    console.log(`   📍 管理员地图: http://localhost:${PORT}/admin.html`);
    console.log(`   🔑 管理员密码: ${ADMIN_TOKEN}`);
    console.log(`\n   模拟家人上报:`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/location \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"device_id":"phone1","lat":39.9042,"lng":116.4074,"name":"张三"}'`);
    console.log(`\n   WebSocket 实时更新已就绪\n`);
  });
});
