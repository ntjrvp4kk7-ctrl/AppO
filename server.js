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

// Pre-seed default user and work week for TBRRABBITBIZ@gmail.com
const TBR_EMAIL = 'tbrrabbitbiz@gmail.com';
let tbrUser = database.users.find((u) => u.email.toLowerCase() === TBR_EMAIL);
if (!tbrUser) {
  tbrUser = {
    id: 'user-tbrrabbitbiz',
    email: TBR_EMAIL,
    passwordHash: 'password',
    workerName: 'Coleby Braddy',
    bossName: 'Jermaine',
    bossEmail: TBR_EMAIL,
    createdAt: new Date().toISOString(),
  };
  database.users.push(tbrUser);
}

if (!database.logs[tbrUser.id] || database.logs[tbrUser.id].length === 0) {
  database.logs[tbrUser.id] = [
    {
      id: 'log-2026-10-26',
      date: '2026-10-26',
      time: { startTime: '09:00', endTime: '17:00', lunchDeductionMinutes: 30, totalHours: 7.5, overtimeHours: 0 },
      status: 'Submitted',
      units: [
        {
          id: 'unit-1324',
          unitNumber: '1324 2 Bedroom / Olympus',
          paintColor: 'Mini Nail Hole Fixes',
          notes: '1324 2 Bedroom / Olympus. Found small holes/drywall damage, patched with mud, sanded smooth, rolled paint, cleaned floors.',
          isCompleted: true,
          photos: []
        }
      ]
    },
    {
      id: 'log-2026-10-27',
      date: '2026-10-27',
      time: { startTime: '10:30', endTime: '19:00', lunchDeductionMinutes: 30, totalHours: 8.0, overtimeHours: 0 },
      status: 'Submitted',
      units: [
        {
          id: 'unit-20261027-legends-north',
          unitNumber: '3 Bedroom / Legends North',
          paintColor: 'Standard Turnover',
          notes: '3 Bedroom / Legends North (10:30 am - 7:00 pm). Repaired drywall, rolled walls, trim touched up, floors cleaned.',
          isCompleted: true,
          photos: []
        }
      ]
    },
    {
      id: 'log-2026-10-28',
      date: '2026-10-28',
      time: { startTime: '09:00', endTime: '17:00', lunchDeductionMinutes: 60, totalHours: 7.0, overtimeHours: 0 },
      status: 'Submitted',
      units: [
        {
          id: 'unit-20261028-marsh-point',
          unitNumber: '315 1 Bedroom / Marsh Point',
          paintColor: 'Standard Paint',
          notes: 'Start: 9:00 am - Finish: 3:00 pm. 1 Bedroom unit repairs and paint at Marsh Point.',
          isCompleted: true,
          photos: []
        },
        {
          id: 'unit-20261028-old-folks-home',
          unitNumber: 'Old Folks Home',
          paintColor: 'Touch-up & Trim',
          notes: 'Start: 4:00 pm - Finish: 5:00 pm. Wall patch and paint touch-up at Old Folks Home.',
          isCompleted: true,
          photos: []
        }
      ]
    },
    {
      id: 'log-2026-10-29',
      date: '2026-10-29',
      time: { startTime: '09:30', endTime: '15:30', lunchDeductionMinutes: 0, totalHours: 6.0, overtimeHours: 0 },
      status: 'Submitted',
      units: [
        {
          id: 'unit-20261029-olympus',
          unitNumber: '315 1 Bedroom / Olympus',
          paintColor: 'Standard Paint',
          notes: 'Start: 9:30 am - Finish: 3:30 pm. 1 Bedroom unit repairs and paint at Olympus.',
          isCompleted: true,
          photos: []
        }
      ]
    },
    {
      id: 'log-2026-10-30',
      date: '2026-10-30',
      time: { startTime: '09:30', endTime: '16:30', lunchDeductionMinutes: 0, totalHours: 7.0, overtimeHours: 0 },
      status: 'Submitted',
      units: [
        {
          id: 'unit-20261030-marsh-point-315',
          unitNumber: 'Marsh Point 315',
          paintColor: 'Primer & Repairs',
          notes: 'Start: 9:30 am - Finish: 4:30 pm. Tons Of Repairs. Day 1 Primed all walls and doors and ceilings.',
          isCompleted: true,
          photos: []
        }
      ]
    }
  ];
  saveDatabase(database);
}

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
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // If dist/index.html is missing (e.g. Render ran without explicit npm run build), auto-build it now
    if (!fs.existsSync(indexPath)) {
      console.log('dist/index.html not found on Render! Running Vite build automatically...');
      try {
        const { build } = await import('vite');
        await build();
        console.log('Automatic Vite build finished successfully!');
      } catch (err) {
        console.error('Automatic Vite build encountered error:', err);
      }
    }

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Preparing Paint & Patch Log...</title>
              <meta http-equiv="refresh" content="3">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family:system-ui,-apple-system,sans-serif;background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;">
              <div>
                <h2 style="font-size:20px;margin-bottom:8px;">Preparing Application...</h2>
                <p style="color:#a1a1aa;font-size:14px;">Building files on Render. Refreshing automatically in 3 seconds...</p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }

  // Global error safety
  app.use((err, _req, res, _next) => {
    console.error('Server error handler:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (production: ${isProduction})`);
  });
}

startServer();
