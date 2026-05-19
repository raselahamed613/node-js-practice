const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const JWT_SECRET = 'edgecore_secret_key_123';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Mock Local Databases
const users = [];
const devices = [
    { id: "EC-V16-001", name: "Main Tank Controller", status: "Online", firmware: "v16.4" },
    { id: "EC-V17-002", name: "Factory Floor Gateway", status: "Online", firmware: "v17.1" }
];

// --- API ENDPOINTS ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ email, password: hashedPassword });
        res.json({ success: true, message: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, message: "Welcome to EdgeCore Portal" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during login" });
    }
});

// 3. Get Registered IoT Devices
app.get('/api/devices', (req, res) => {
    res.json({ success: true, devices });
});

// --- REAL-TIME WEBSOCKET HARDWARE SIMULATOR ---
wss.on('connection', (ws) => {
    console.log('🔄 Dashboard client connected to EdgeCore Data Stream.');
    
    // Simulate live edge telemetry data transmission every 1.5 seconds
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

// --- UPDATED FOR EXPRESS 5 COMPATIBILITY ---
// Using '(.*)' instead of '*' to avoid the "Missing parameter name" error
// app.get('(.*)', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// This works on all versions of Express/Node
app.use((req, res, next) => {
    // If the request isn't for an API or a static file, send index.html
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
}); 

// Note: The app.use() fallback above handles all non-API routes for Express 5 compatibility.

server.listen(PORT, () => {
    console.log(`\n🚀 EdgeCoreIoT Platform is LIVE`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`🛠️  Press Ctrl+C to stop the server\n`);
});