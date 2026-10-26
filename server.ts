import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support base64 photos upload (up to 50MB payload)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent File Storage (for Render.com & local sessions)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  workerName: string;
  bossName: string;
  bossEmail: string;
  companyName: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: { [token: string]: string }; // token -> userId
  logs: { [userId: string]: any[] }; // userId -> DailyWorkLog[]
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading db.json, initializing fresh store', err);
  }
  return { users: [], sessions: {}, logs: {} };
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json', err);
  }
}

// In-memory cache synced with disk
let database = loadDatabase();

// Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
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
  (req as any).user = user;
  (req as any).userId = userId;
  next();
}

// --- API Endpoints ---

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, workerName, bossName, bossEmail, companyName } = req.body;
  if (!email || !password || !workerName) {
    return res.status(400).json({ error: 'Email, password, and technician name are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = database.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser: UserRecord = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email: normalizedEmail,
    passwordHash: password, // Simple auth suitable for this applet
    workerName: workerName.trim(),
    bossName: (bossName || 'My Boss').trim(),
    bossEmail: (bossEmail || '').trim(),
    companyName: (companyName || 'Drywall & Paint Pro Services').trim(),
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
app.post('/api/auth/login', (req: Request, res: Response) => {
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

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { workerName, bossName, bossEmail, companyName } = req.body;

  const userIndex = database.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (workerName) database.users[userIndex].workerName = workerName.trim();
  if (bossName) database.users[userIndex].bossName = bossName.trim();
  if (bossEmail !== undefined) database.users[userIndex].bossEmail = bossEmail.trim();
  if (companyName) database.users[userIndex].companyName = companyName.trim();

  saveDatabase(database);
  const { passwordHash: _, ...safeUser } = database.users[userIndex];
  res.json({ user: safeUser });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete database.sessions[token];
    saveDatabase(database);
  }
  res.json({ success: true });
});

// Get Work Logs for current user
app.get('/api/worklogs', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userLogs = database.logs[userId] || [];
  res.json({ logs: userLogs });
});

// Sync / Save Work Logs for current user
app.post('/api/worklogs', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'logs must be an array.' });
  }

  database.logs[userId] = logs;
  saveDatabase(database);
  res.json({ success: true, count: logs.length });
});

// Health check endpoint for Render.com
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Paint & Drywall Work Log', timestamp: new Date().toISOString() });
});

// Setup dev server with Vite or production static files
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
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FieldLog Paint & Drywall Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
