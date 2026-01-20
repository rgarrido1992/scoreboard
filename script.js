/**
 * SCOREBOARD OVERLAY - JAVASCRIPT
 * ================================
 * Real-time sync with WebSocket server
 */

// ========================================
// TEAM CONFIGURATION
// ========================================

const teams = {
    'ARCANGELES': {
        name: 'ARCÁNGELES',
        shortName: 'ARC',
        logo: 'img/ARCANGELES_ESCUDO.png',
        color: '#000000',
        secondaryColor: '#FFFFFF',
        textColor: '#FFFFFF'
    },
    'BLACKPANTHERS': {
        name: 'BLACK PANTHERS',
        shortName: 'BPN',
        logo: 'img/escudo_black_panthers.png',
        color: '#0f072b',
        secondaryColor: '#9b85e4',
        textColor: '#9b85e4'
    },
    'BRICKSBROTHERS': {
        name: 'BRICKS BROTHERS',
        shortName: 'BBT',
        logo: 'img/BRICKSBROTHERS_ESCUDO.png',
        color: '#DDDDDD',
        secondaryColor: '#000000',
        textColor: '#000000'
    },
    'EQUIPOA': {
        name: 'EQUIPO A',
        shortName: 'EQA',
        logo: 'img/EQUIPOA_ESCUDO.png',
        color: '#d21036',
        secondaryColor: '#0e1c52',
        textColor: '#0e1c52'
    },
    'FILOSOFOSOLIMPICOS': {
        name: 'FILÓSOFOS OLÍMPICOS',
        shortName: 'FOL',
        logo: 'img/FILOSOFOSOLIMPICOS_ESCUDO.png',
        color: '#eed000',
        secondaryColor: '#005cb5',
        textColor: '#005cb5'
    },
    'GRANAUDITORIO': {
        name: 'GRAN AUDITORIO',
        shortName: 'GAU',
        logo: 'img/GRANAUDITORIO_ESCUDO.png',
        color: '#1b1b1b',
        secondaryColor: '#ff001e',
        textColor: '#FFFFFF'
    },
    'MANDARINAALFA': {
        name: 'MANDARINA ALFA',
        shortName: 'MNA',
        logo: 'img/MANDARINAALFA_ESCUDO.png',
        color: '#000000',
        secondaryColor: '#ff6600',
        textColor: '#FF6600'
    },
    'REALSPORTICO': {
        name: 'REAL SPÓRTICO',
        shortName: 'RSP',
        logo: 'img/REALSPORTICO_ESCUDO.png',
        color: '#ffffff',
        secondaryColor: '#2f1b7a',
        textColor: '#2f1b7a'
    },
    'THEKINGDOM': {
        name: 'THE KINGDOM',
        shortName: 'KDM',
        logo: 'img/THEKINGDOM_ESCUDO.png',
        color: '#005a59',
        secondaryColor: '#ffaf08',
        textColor: '#ffaf08'
    },
    'TITISTEAM': {
        name: 'TITIS TEAM',
        shortName: 'TTM',
        logo: 'img/TITISTEAM_ESCUDO.png',
        color: '#00ccf7',
        secondaryColor: '#FFFFFF',
        textColor: '#FFFFFF'
    }
};

// ========================================
// STATE MANAGEMENT
// ========================================

const state = {
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
        running: false,
        interval: null
    },
    overlayMode: false
};

// Default logo SVGs
const defaultLogos = {
    team1: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23667eea' stroke='%23fff' stroke-width='3'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='30' font-family='Arial'%3E⚽%3C/text%3E%3C/svg%3E",
    team2: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f093fb' stroke='%23fff' stroke-width='3'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='30' font-family='Arial'%3E⚽%3C/text%3E%3C/svg%3E"
};

// ========================================
// WEBSOCKET CONNECTION
// ========================================

let ws = null;
let reconnectInterval = null;

function connectWebSocket() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'init':
                case 'sync':
                    // Update local state from server
                    syncFromServer(message.state);
                    break;
            }
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
        }
    };

    ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, reconnecting...');
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                if (!ws || ws.readyState === WebSocket.CLOSED) {
                    connectWebSocket();
                }
            }, 2000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function sendToServer(type, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
    }
}

function syncFromServer(serverState) {
    // Update team 1
    if (serverState.team1) {
        state.team1.key = serverState.team1.key || '';
        state.team1.name = serverState.team1.name || 'LOCAL';
        state.team1.score = serverState.team1.score || 0;
        state.team1.logo = serverState.team1.logo;

        // Use shortName for overlay display, full name otherwise
        const team1Data = state.team1.key && teams[state.team1.key] ? teams[state.team1.key] : null;
        const displayName = team1Data?.shortName || state.team1.name;
        document.getElementById('team1-name').textContent = displayName;
        document.getElementById('team1-score').textContent = state.team1.score;

        // Update mobile elements (use full name)
        const mobileTeam1Name = document.getElementById('mobile-team1-name');
        const mobileTeam1Score = document.getElementById('mobile-team1-score');
        if (mobileTeam1Name) mobileTeam1Name.textContent = state.team1.name;
        if (mobileTeam1Score) mobileTeam1Score.textContent = state.team1.score;

        const team1Select = document.getElementById('team1-select');
        if (team1Select && state.team1.key) {
            team1Select.value = state.team1.key;
        }

        if (state.team1.logo) {
            document.getElementById('team1-logo').src = state.team1.logo;
        } else {
            document.getElementById('team1-logo').src = defaultLogos.team1;
        }
    }

    // Update team 2
    if (serverState.team2) {
        state.team2.key = serverState.team2.key || '';
        state.team2.name = serverState.team2.name || 'VISITANTE';
        state.team2.score = serverState.team2.score || 0;
        state.team2.logo = serverState.team2.logo;

        // Use shortName for overlay display, full name otherwise
        const team2Data = state.team2.key && teams[state.team2.key] ? teams[state.team2.key] : null;
        const displayName2 = team2Data?.shortName || state.team2.name;
        document.getElementById('team2-name').textContent = displayName2;
        document.getElementById('team2-score').textContent = state.team2.score;

        // Update mobile elements (use full name)
        const mobileTeam2Name = document.getElementById('mobile-team2-name');
        const mobileTeam2Score = document.getElementById('mobile-team2-score');
        if (mobileTeam2Name) mobileTeam2Name.textContent = state.team2.name;
        if (mobileTeam2Score) mobileTeam2Score.textContent = state.team2.score;

        const team2Select = document.getElementById('team2-select');
        if (team2Select && state.team2.key) {
            team2Select.value = state.team2.key;
        }

        if (state.team2.logo) {
            document.getElementById('team2-logo').src = state.team2.logo;
        } else {
            document.getElementById('team2-logo').src = defaultLogos.team2;
        }
    }

    // Update timer
    if (serverState.timer) {
        state.timer.seconds = serverState.timer.seconds || 0;
        state.timer.running = serverState.timer.running || false;
        updateTimerDisplay();

        // Start/stop timer based on server state
        if (state.timer.running && !state.timer.interval) {
            startLocalTimer();
        } else if (!state.timer.running && state.timer.interval) {
            stopLocalTimer();
        }
    }

    // Update team colors (FIFA style)
    updateTeamColors();
}

// ========================================
// TEAM COLORS - FIFA STYLE
// ========================================

function updateTeamColors() {
    const team1Section = document.getElementById('team1-section');
    const team2Section = document.getElementById('team2-section');
    const team1Name = document.getElementById('team1-name');
    const team2Name = document.getElementById('team2-name');

    // Apply Team 1 colors (Local - border on LEFT side)
    if (team1Section && state.team1.key && teams[state.team1.key]) {
        const team = teams[state.team1.key];
        const primaryColor = team.color;
        const secondaryColor = team.secondaryColor || primaryColor;
        const textColor = team.textColor || '#ffffff';

        // Create gradient background with primary color
        team1Section.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${darkenColor(primaryColor, 20)} 100%)`;
        team1Section.style.borderLeftColor = secondaryColor;
        team1Section.style.borderLeftWidth = '10px';
        team1Section.style.borderLeftStyle = 'solid';

        // Apply text color
        if (team1Name) {
            team1Name.style.color = textColor;
        }
    } else if (team1Section) {
        // Reset to default
        team1Section.style.background = 'linear-gradient(135deg, #1a2e5c 0%, #0d1b2a 100%)';
        team1Section.style.borderLeftColor = 'rgba(255, 255, 255, 0.2)';
        if (team1Name) team1Name.style.color = '#ffffff';
    }

    // Apply Team 2 colors (Visitante - border on RIGHT side)
    if (team2Section && state.team2.key && teams[state.team2.key]) {
        const team = teams[state.team2.key];
        const primaryColor = team.color;
        const secondaryColor = team.secondaryColor || primaryColor;
        const textColor = team.textColor || '#ffffff';

        // Create gradient background with primary color
        team2Section.style.background = `linear-gradient(135deg, ${darkenColor(primaryColor, 20)} 0%, ${primaryColor} 100%)`;
        team2Section.style.borderRightColor = secondaryColor;
        team2Section.style.borderRightWidth = '10px';
        team2Section.style.borderRightStyle = 'solid';

        // Apply text color
        if (team2Name) {
            team2Name.style.color = textColor;
        }
    } else if (team2Section) {
        // Reset to default
        team2Section.style.background = 'linear-gradient(135deg, #0d1b2a 0%, #1a2e5c 100%)';
        team2Section.style.borderRightColor = 'rgba(255, 255, 255, 0.2)';
        if (team2Name) team2Name.style.color = '#ffffff';
    }
}

// Helper: Darken a hex color
function darkenColor(hex, percent) {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    let r = parseInt(h.substring(0, 2), 16);
    let g = parseInt(h.substring(2, 4), 16);
    let b = parseInt(h.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * (100 - percent) / 100));
    g = Math.max(0, Math.floor(g * (100 - percent) / 100));
    b = Math.max(0, Math.floor(b * (100 - percent) / 100));

    return `rgb(${r}, ${g}, ${b})`;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check for overlay mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('overlay') === 'true') {
        enableOverlayMode();
    }

    // Update overlay URL display
    updateOverlayUrl();

    // Connect to WebSocket server
    connectWebSocket();
});

// ========================================
// APPLY CHANGES (Main function)
// ========================================

function applyChanges() {
    const team1Key = document.getElementById('team1-select').value;
    const team2Key = document.getElementById('team2-select').value;

    // Update Team 1
    if (team1Key && teams[team1Key]) {
        state.team1.key = team1Key;
        state.team1.name = teams[team1Key].name;
        state.team1.logo = teams[team1Key].logo;
    } else {
        state.team1.key = '';
        state.team1.name = 'LOCAL';
        state.team1.logo = null;
    }

    // Update Team 2
    if (team2Key && teams[team2Key]) {
        state.team2.key = team2Key;
        state.team2.name = teams[team2Key].name;
        state.team2.logo = teams[team2Key].logo;
    } else {
        state.team2.key = '';
        state.team2.name = 'VISITANTE';
        state.team2.logo = null;
    }

    // Send to server (will broadcast to all clients including overlay)
    sendToServer('update', {
        state: {
            team1: {
                key: state.team1.key,
                name: state.team1.name,
                score: state.team1.score,
                logo: state.team1.logo
            },
            team2: {
                key: state.team2.key,
                name: state.team2.name,
                score: state.team2.score,
                logo: state.team2.logo
            },
            timer: {
                seconds: state.timer.seconds,
                running: state.timer.running
            }
        }
    });

    // Visual feedback
    const btn = document.querySelector('.btn-apply');
    const originalText = btn.textContent;
    btn.textContent = '✅ ¡APLICADO!';
    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1500);
}

// ========================================
// SCORE MANAGEMENT
// ========================================

function changeScore(teamNumber, delta) {
    const teamKey = `team${teamNumber}`;
    const newScore = Math.max(0, state[teamKey].score + delta);
    state[teamKey].score = newScore;

    // Update main scoreboard
    const scoreElement = document.getElementById(`team${teamNumber}-score`);
    if (scoreElement) {
        scoreElement.textContent = newScore;
        // Trigger animation
        scoreElement.classList.add('animating');
        setTimeout(() => scoreElement.classList.remove('animating'), 300);
    }

    // Update mobile score
    const mobileScoreElement = document.getElementById(`mobile-team${teamNumber}-score`);
    if (mobileScoreElement) {
        mobileScoreElement.textContent = newScore;
    }

    // Send score update to server (include timer state to avoid resetting it)
    sendToServer('score', {
        team: teamNumber,
        score: newScore,
        timer: {
            seconds: state.timer.seconds,
            running: state.timer.running
        }
    });
}

// ========================================
// TIMER MANAGEMENT
// ========================================

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const timeStr = formatTime(state.timer.seconds);

    // Update main timer
    const mainTimer = document.getElementById('timer');
    if (mainTimer) mainTimer.textContent = timeStr;

    // Update mobile timer
    const mobileTimer = document.getElementById('mobile-timer');
    if (mobileTimer) mobileTimer.textContent = timeStr;
}

function startLocalTimer() {
    if (state.timer.interval) return;

    const mainTimer = document.getElementById('timer');
    const mobileTimer = document.getElementById('mobile-timer');
    if (mainTimer) mainTimer.classList.add('running');
    if (mobileTimer) mobileTimer.classList.add('running');

    state.timer.interval = setInterval(() => {
        state.timer.seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopLocalTimer() {
    const mainTimer = document.getElementById('timer');
    const mobileTimer = document.getElementById('mobile-timer');
    if (mainTimer) mainTimer.classList.remove('running');
    if (mobileTimer) mobileTimer.classList.remove('running');

    if (state.timer.interval) {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
    }
}

function startTimer() {
    if (state.timer.running) return;

    state.timer.running = true;
    startLocalTimer();

    // Send timer state to server
    sendToServer('timer', {
        timer: {
            seconds: state.timer.seconds,
            running: true
        }
    });
}

function pauseTimer() {
    if (!state.timer.running) return;

    state.timer.running = false;
    stopLocalTimer();

    // Send timer state to server
    sendToServer('timer', {
        timer: {
            seconds: state.timer.seconds,
            running: false
        }
    });
}

function resetTimer() {
    pauseTimer();
    state.timer.seconds = 0;
    updateTimerDisplay();

    // Send timer state to server
    sendToServer('timer', {
        timer: {
            seconds: 0,
            running: false
        }
    });
}

function setTimer() {
    const minutes = parseInt(document.getElementById('start-minutes').value) || 0;
    pauseTimer();
    state.timer.seconds = minutes * 60;
    updateTimerDisplay();

    // Send timer state to server
    sendToServer('timer', {
        timer: {
            seconds: state.timer.seconds,
            running: false
        }
    });
}

// ========================================
// MATCH CONTROLS
// ========================================

function resetMatch() {
    if (!confirm('¿Estás seguro de que quieres reiniciar el partido? Se perderán los datos actuales.')) {
        return;
    }

    // Reset scores
    state.team1.score = 0;
    state.team2.score = 0;

    // Reset timer
    resetTimer();

    // Send full state update
    sendToServer('update', {
        state: {
            team1: state.team1,
            team2: state.team2,
            timer: {
                seconds: 0,
                running: false
            }
        }
    });
}

// ========================================
// OVERLAY MODE
// ========================================

function toggleOverlayMode() {
    state.overlayMode = !state.overlayMode;

    if (state.overlayMode) {
        enableOverlayMode();
    } else {
        disableOverlayMode();
    }
}

function enableOverlayMode() {
    state.overlayMode = true;
    document.body.classList.add('overlay-mode');
}

function disableOverlayMode() {
    state.overlayMode = false;
    document.body.classList.remove('overlay-mode');
}

function updateOverlayUrl() {
    const overlayUrlEl = document.getElementById('overlay-url');
    if (overlayUrlEl) {
        // Use actual URL so it works on Railway, mobile, etc.
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        overlayUrlEl.textContent = `${baseUrl}?overlay=true`;
    }
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key.toLowerCase()) {
        case ' ':
        case 'p':
            // Toggle timer
            e.preventDefault();
            if (state.timer.running) {
                pauseTimer();
            } else {
                startTimer();
            }
            break;
        case 'r':
            // Reset timer
            if (e.ctrlKey || e.metaKey) return;
            resetTimer();
            break;
        case 'o':
            // Toggle overlay mode
            toggleOverlayMode();
            break;
        case '1':
            // Add goal to team 1
            changeScore(1, 1);
            break;
        case '2':
            // Add goal to team 2
            changeScore(2, 1);
            break;
        case '!':
            // Remove goal from team 1
            changeScore(1, -1);
            break;
        case '@':
            // Remove goal from team 2
            changeScore(2, -1);
            break;
    }
});
