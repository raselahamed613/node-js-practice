const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise'); // Promises wrapper for modern async/await

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const JWT_SECRET = 'edgecore_secret_key_123';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MYSQL DATABASE CONNECTION POOL ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',          // Your MySQL username (default is often root)
    password: '',          // Your MySQL password (leave empty if none)
    database: 'edgecore_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify DB connection health on startup
db.getConnection()
    .then(() => console.log('💾 Connected successfully to edgecore_db MySQL instance.'))
    .catch(err => console.error('❌ MySQL Connection Failed: ', err.message));


// --- API ENDPOINTS (DB BACKED) ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        // Check if user already exists in DB
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Encrypt and save to database
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

        res.json({ success: true, message: "Registration successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database server error during registration" });
    }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user in DB
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const user = rows[0];

        // Match pass hashes
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, message: "Welcome to EdgeCore Portal" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database server error during login" });
    }
});

// 3. Get Registered IoT Devices
app.get('/api/devices', async (req, res) => {
    try {
        const [devices] = await db.execute('SELECT * FROM devices');
        res.json({ success: true, devices });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to query devices" });
    }
});

// --- REAL-TIME WEBSOCKET HARDWARE SIMULATOR ---
wss.on('connection', (ws) => {
    console.log('🔄 Dashboard client connected to EdgeCore Data Stream.');
    
    const telemetryInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const mockTelemetry = {
                timestamp: new Date().toLocaleTimeString(),
                deviceId: "EC-V16-001",
                sensorValue: (Math.random() * 30 + 50).toFixed(2), 
                powerDraw: (Math.random() * 2 + 12).toFixed(1),   
                status: "Operational"
            };
            ws.send(JSON.stringify(mockTelemetry));
        }
    }, 1500);

    ws.on('close', () => {
        clearInterval(telemetryInterval);
        console.log('❌ Dashboard client disconnected.');
    });
});

// --- BULLETPROOF VERSION SPA MIDDLEWARE ---
app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 EdgeCoreIoT Platform is LIVE`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`🛠️  Press Ctrl+C to stop the server\n`);
});