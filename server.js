/**
 * SCOREBOARD OVERLAY - SERVER
 * ============================
 * Local server with WebSocket for real-time synchronization
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store current state
let currentState = {
    team1: {
        key: '',
        name: 'LOCAL',
        score: 0,
        logo: null
    },
    team2: {
        key: '',
        name: 'VISITANTE',
        score: 0,
        logo: null
    },
    timer: {
        seconds: 0,
        running: false
    }
};

// Broadcast to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Client connected');

    // Send current state to new client
    ws.send(JSON.stringify({
        type: 'init',
        state: currentState
    }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'update':
                    // Update state and broadcast to all clients
                    currentState = { ...currentState, ...message.state };
                    broadcast({
                        type: 'sync',
                        state: currentState
                    });
                    console.log('📊 State updated:', JSON.stringify(currentState, null, 2));
                    break;

                case 'score':
                    // Update specific score
                    if (message.team === 1) {
                        currentState.team1.score = message.score;
                    } else {
                        currentState.team2.score = message.score;
                    }
                    broadcast({
                        type: 'sync',
                        state: currentState
                    });
                    break;

                case 'timer':
                    currentState.timer = message.timer;
                    broadcast({
                        type: 'sync',
                        state: currentState
                    });
                    break;
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Client disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                  ⚽ SCOREBOARD SERVER ⚽                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   🎮 Panel de Control:  http://localhost:${PORT}            ║
║   📺 URL para OBS:      http://localhost:${PORT}?overlay=true║
║                                                          ║
║   Los cambios se sincronizarán en tiempo real!           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});
