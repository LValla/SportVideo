// State Management
let currentSet = 1;
let team1Score = 0;
let team2Score = 0;
let isLive = false;
let accessToken = null;
let videoStream = null;

// YouTube API Configuration
const YOUTUBE_CLIENT_ID = '19616453952-u6bbdaf3g69j2hvhmdag6jv36h23a3og.apps.googleusercontent.com';
const YOUTUBE_REDIRECT_URI = window.location.origin;
const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.force-ssl'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadStoredData();
});

// Event Listeners Setup
function setupEventListeners() {
    document.getElementById('loginBtn').addEventListener('click', handleYouTubeLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('endStreamBtn').addEventListener('click', handleEndStream);
    document.getElementById('closeSetBtn').addEventListener('click', handleCloseSet);
}

// ===== AUTHENTICATION =====
function handleYouTubeLogin() {
    // OAuth 2.0 Login Flow
    const state = generateRandomString(32);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', YOUTUBE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', YOUTUBE_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('scope', YOUTUBE_SCOPES.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('access_type', 'online');

    window.location.href = authUrl.toString();
}

function handleAuthCallback() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get('access_token');
    const state = fragment.get('state');

    if (token && state === sessionStorage.getItem('oauth_state')) {
        accessToken = token;
        localStorage.setItem('youtube_token', token);
        showStreamingScreen();
        initializeCamera();
        startLive();
    } else {
        alert('Errore di autenticazione');
    }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        accessToken = null;
        localStorage.removeItem('youtube_token');
        resetScores();
        hideStreamingScreen();
        stopCamera();
        isLive = false;
    }
}

// ===== CAMERA & STREAMING =====
async function initializeCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: 'environment'
            },
            audio: true
        };

        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('cameraFeed');
        videoElement.srcObject = videoStream;
        
        console.log('Fotocamera inizializzata con successo');
    } catch (error) {
        console.error('Errore nell\'accesso alla fotocamera:', error);
        alert('Non è stato possibile accedere alla fotocamera. Verifica i permessi.');
    }
}

function stopCamera() {
    if (videoStream) {
        const tracks = videoStream.getTracks();
        tracks.forEach(track => track.stop());
        videoStream = null;
    }
}

async function startLive() {
    try {
        isLive = true;
        document.getElementById('liveIndicator').classList.remove('hidden');
        console.log('Diretta iniziata');
        
        // Qui si integrerebbe con l'API di YouTube per creare una diretta vera
        // Per ora è una simulazione
    } catch (error) {
        console.error('Errore nell\'avvio della diretta:', error);
        alert('Errore nell\'avvio della diretta');
        isLive = false;
    }
}

// ===== SCORE MANAGEMENT =====
function increaseScore(team) {
    if (team === 1) {
        team1Score++;
        document.getElementById('team1Score').textContent = team1Score;
    } else if (team === 2) {
        team2Score++;
        document.getElementById('team2Score').textContent = team2Score;
    }
    saveScores();
}

function decreaseScore(team) {
    if (team === 1 && team1Score > 0) {
        team1Score--;
        document.getElementById('team1Score').textContent = team1Score;
    } else if (team === 2 && team2Score > 0) {
        team2Score--;
        document.getElementById('team2Score').textContent = team2Score;
    }
    saveScores();
}

// ===== SET MANAGEMENT =====
function handleCloseSet() {
    const team1 = team1Score;
    const team2 = team2Score;
    
    if (team1 === 0 && team2 === 0) {
        alert('Almeno una squadra deve avere punti per chiudere il set');
        return;
    }

    const confirmed = confirm(`Set ${currentSet}: ${team1} - ${team2}\nChiudere il set e passare al prossimo?`);
    
    if (confirmed) {
        currentSet++;
        team1Score = 0;
        team2Score = 0;
        
        document.getElementById('setNumber').textContent = currentSet;
        document.getElementById('team1Score').textContent = '0';
        document.getElementById('team2Score').textContent = '0';
        
        saveScores();
        
        // Animazione di transizione
        showNotification(`Set ${currentSet} Iniziato!`);
    }
}

function handleEndStream() {
    const confirmed = confirm('Terminare la diretta? I dati verranno salvati.');
    
    if (confirmed) {
        isLive = false;
        stopCamera();
        handleLogout();
    }
}

// ===== UI MANAGEMENT =====
function showStreamingScreen() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('streamingScreen').classList.add('active');
}

function hideStreamingScreen() {
    document.getElementById('streamingScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 30px 50px;
        border-radius: 10px;
        font-size: 24px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 3s ease-in-out;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== LOCAL STORAGE =====
function saveScores() {
    const data = {
        currentSet,
        team1Score,
        team2Score,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('sportvideo_scores', JSON.stringify(data));
}

function loadStoredData() {
    const stored = localStorage.getItem('sportvideo_scores');
    if (stored) {
        const data = JSON.parse(stored);
        currentSet = data.currentSet || 1;
        team1Score = data.team1Score || 0;
        team2Score = data.team2Score || 0;
        
        updateScoreDisplay();
    }

    const token = localStorage.getItem('youtube_token');
    if (token) {
        accessToken = token;
        showStreamingScreen();
        initializeCamera();
        startLive();
    }
}

function resetScores() {
    currentSet = 1;
    team1Score = 0;
    team2Score = 0;
    
    document.getElementById('setNumber').textContent = '1';
    document.getElementById('team1Score').textContent = '0';
    document.getElementById('team2Score').textContent = '0';
    
    localStorage.removeItem('sportvideo_scores');
}

function updateScoreDisplay() {
    document.getElementById('setNumber').textContent = currentSet;
    document.getElementById('team1Score').textContent = team1Score;
    document.getElementById('team2Score').textContent = team2Score;
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (!isLive) return;
    
    switch(e.key) {
        case '1':
            increaseScore(1);
            break;
        case '2':
            increaseScore(2);
            break;
        case 'q':
            decreaseScore(1);
            break;
        case 'w':
            decreaseScore(2);
            break;
        case ' ':
            e.preventDefault();
            handleCloseSet();
            break;
    }
});

// ===== CHECK FOR AUTH CALLBACK =====
if (window.location.hash) {
    handleAuthCallback();
}

// ===== AUTO-SAVE =====
setInterval(saveScores, 10000); // Auto-save every 10 seconds
