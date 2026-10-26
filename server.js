import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support base64 before/after photos payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Storage directory & database file for Render.com persistence
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading db.json, creating initial store', err);
  }
  return { users: [], sessions: {}, logs: {} };
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json', err);
  }
}

let database = loadDatabase();

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  const token = authHeader.split(' ')[1];
  const userId = database.sessions[token];
  if (!userId) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const user = database.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  req.user = user;
  req.userId = userId;
  next();
}

// --- API Endpoints ---

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, workerName, bossName, bossEmail } = req.body;
  if (!email || !password || !workerName) {
    return res.status(400).json({ error: 'Email, password, and your name are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = database.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email: normalizedEmail,
    passwordHash: password,
    workerName: workerName.trim(),
    bossName: (bossName || 'My Boss').trim(),
    bossEmail: (bossEmail || '').trim(),
    createdAt: new Date().toISOString(),
  };

  const token = `token-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  database.users.push(newUser);
  database.sessions[token] = newUser.id;
  database.logs[newUser.id] = [];
  saveDatabase(database);

  const { passwordHash: _, ...safeUser } = newUser;
  res.json({ token, user: safeUser });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = database.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = `token-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  database.sessions[token] = user.id;
  saveDatabase(database);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { workerName, bossName, bossEmail } = req.body;

  const userIndex = database.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (workerName) database.users[userIndex].workerName = workerName.trim();
  if (bossName) database.users[userIndex].bossName = bossName.trim();
  if (bossEmail !== undefined) database.users[userIndex].bossEmail = bossEmail.trim();

  saveDatabase(database);
  const { passwordHash: _, ...safeUser } = database.users[userIndex];
  res.json({ user: safeUser });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete database.sessions[token];
    saveDatabase(database);
  }
  res.json({ success: true });
});

// Get Work Logs for user
app.get('/api/worklogs', authMiddleware, (req, res) => {
  const userId = req.userId;
  const userLogs = database.logs[userId] || [];
  res.json({ logs: userLogs });
});

// Save Work Logs for user
app.post('/api/worklogs', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'logs must be an array.' });
  }

  database.logs[userId] = logs;
  saveDatabase(database);
  res.json({ success: true, count: logs.length });
});

// Health check for Render.com
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Paint & Patch Field Log', timestamp: new Date().toISOString() });
});

// Start Server: In development uses Vite middleware; in production serves static dist
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (production: ${isProduction})`);
  });
}

startServer();
