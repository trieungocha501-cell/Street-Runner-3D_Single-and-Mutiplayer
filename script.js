const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainOverlay = document.getElementById('mainOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const adOverlay = document.getElementById('adOverlay');
const menuCard = document.getElementById('menuCard');
const deathCard = document.getElementById('deathCard');

let gameActive = false, isPaused = false, mode = 'single';
let difficulty = 1, speed = 7, objects = [], frame = 0;
let players = [
    { id: 1, lane: 0, x: 0, z: 0, vY: 0, jump: false, score: 0, lives: 1, color: '#00e5ff', alive: true, invul: 0 },
    { id: 2, lane: 0, x: 0, z: 0, vY: 0, jump: false, score: 0, lives: 5, color: '#ff007b', alive: false, invul: 0 }
];

const diffSettings = [{s:6, r:60}, {s:10, r:40}, {s:15, r:25}];

window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (key === 'p') {
        if (gameActive) togglePause();
        return;
    }
    if (!gameActive || isPaused) return;
    if (players[0].alive) {
        if (key === 'a' && players[0].lane > -1) players[0].lane--;
        if (key === 'd' && players[0].lane < 1) players[0].lane++;
        if ((key === ' ' || key === 'w') && !players[0].jump) { players[0].vY = -14; players[0].jump = true; }
    }
    if (mode === 'multi' && players[1].alive) {
        if (e.key === 'ArrowLeft' && players[1].lane > -1) players[1].lane--;
        if (e.key === 'ArrowRight' && players[1].lane < 1) players[1].lane++;
        if (e.key === 'ArrowUp' && !players[1].jump) { players[1].vY = -14; players[1].jump = true; }
    }
});

function togglePause() {
    if (adOverlay.style.display === 'flex' || mainOverlay.style.display === 'flex') return;
    isPaused = !isPaused;
    pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    if (!isPaused) requestAnimationFrame(gameLoop);
}

function startMode(m) {
    mode = m;
    gameActive = true; isPaused = false;
    speed = diffSettings[difficulty].s;
    objects = []; frame = 0;
    players[0].alive = true; players[0].lives = (m === 'multi') ? 5 : 1;
    players[0].score = 0; players[0].lane = 0; players[0].x = 0; players[0].z = 0; players[0].invul = 0;
    players[1].alive = (m === 'multi'); players[1].lives = 5;
    players[1].score = 0; players[1].lane = 0; players[1].x = 0; players[1].z = 0; players[1].invul = 0;
    document.getElementById('p2Stat').style.display = (m === 'multi') ? 'block' : 'none';
    updateUI();
    mainOverlay.style.display = 'none';
    pauseOverlay.style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('p1Score').innerText = players[0].score;
    document.getElementById('p1LivesUI').innerText = (mode === 'multi') ? ` | ❤️ ${players[0].lives}` : "";
    if(mode === 'multi') {
        document.getElementById('p2Score').innerText = players[1].score;
        document.getElementById('p2LivesUI').innerText = ` | ❤️ ${players[1].lives}`;
    }
}

function handleCollision(p) {
    if (mode === 'single') {
        gameActive = false; p.alive = false;
        showDeathScreen();
    } else {
        p.lives--; updateUI();
        if (p.lives <= 0) {
            gameActive = false;
            showDeathScreen(p.id === 1 ? "PLAYER 2" : "PLAYER 1");
        } else { p.invul = 80; p.z = 0; }
    }
}

function showDeathScreen(winner) {
    mainOverlay.style.display = 'flex';
    menuCard.style.display = 'none';
    deathCard.style.display = 'block';
    if (mode === 'multi') {
        document.getElementById('vsResult').style.display = 'block';
        document.getElementById('singleStatus').style.display = 'none';
        document.getElementById('winnerText').innerText = winner + " THẮNG!";
        document.getElementById('loserText').innerText = (winner === "PLAYER 1" ? "PLAYER 2" : "PLAYER 1") + " THUA";
        document.getElementById('btnRevive').style.display = 'none';
    } else {
        document.getElementById('vsResult').style.display = 'none';
        document.getElementById('singleStatus').style.display = 'block';
        document.getElementById('btnRevive').style.display = 'block';
    }
}

function startAd() {
    mainOverlay.style.display = 'none';
    adOverlay.style.display = 'flex';
    let t = 5;
    const timer = setInterval(() => {
        t--; document.getElementById('adTimer').innerText = t;
        if (t <= 0) { clearInterval(timer); revive(); }
    }, 1000);
}

function revive() {
    adOverlay.style.display = 'none';
    gameActive = true; isPaused = false;
    players[0].alive = true; players[0].invul = 100;
    objects = objects.filter(o => o.d > 600);
    requestAnimationFrame(gameLoop);
}

function backToHome() {
    gameActive = false; isPaused = false;
    mainOverlay.style.display = 'flex';
    menuCard.style.display = 'block';
    deathCard.style.display = 'none';
    pauseOverlay.style.display = 'none';
    ctx.clearRect(0,0,800,500);
}

function setDiff(lv) {
    difficulty = lv;
    document.querySelectorAll('.diff-btn').forEach((b, i) => b.classList.toggle('active', i === lv));
}

function gameLoop() {
    if (!gameActive || isPaused) return;
    frame++; speed += 0.001;
    if (frame % diffSettings[difficulty].r === 0) {
        objects.push({ type: Math.random() > 0.4 ? 'coin' : 'obs', lane: Math.floor(Math.random()*3)-1, d: 1000 });
    }
    players.forEach(p => {
        if (!p.alive) return;
        if (p.invul > 0) p.invul--;
        p.x += (p.lane * 180 - p.x) * 0.15;
        if (p.jump) { p.z += p.vY; p.vY += 0.8; if (p.z >= 0) { p.z = 0; p.jump = false; } }
    });
    for (let i = objects.length - 1; i >= 0; i--) {
        let o = objects[i]; o.d -= speed;
        players.forEach(p => {
            if (p.alive && o.d < 30 && o.d > -30 && Math.round(p.lane) === o.lane) {
                if (o.type === 'coin') { p.score++; updateUI(); objects.splice(i, 1); }
                else if (p.z > -40 && p.invul <= 0) handleCollision(p);
            }
        });
    }
    objects = objects.filter(o => o.d > -50);
    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0,0,800,500);
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(390,150); ctx.lineTo(410,150); ctx.lineTo(800,500); ctx.lineTo(0,500); ctx.fill();
    objects.forEach(o => {
        let s = 150/(o.d+150); let x = 400+(o.lane*220*s); let y = 150+(s*350); let sz = 90*s;
        if(o.type === 'coin') {
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = "gold"; ctx.fillStyle = "gold";
            ctx.beginPath(); ctx.arc(x, y-sz/2, sz/2.5, 0, Math.PI*2); ctx.fill(); ctx.restore();
        } else { ctx.fillStyle = '#ff3333'; ctx.fillRect(x-sz/2, y-sz, sz, sz); }
    });
    players.forEach(p => {
        if (!p.alive || (p.invul > 0 && Math.floor(frame/5)%2===0)) return;
        ctx.fillStyle = p.color; ctx.fillRect(400+p.x-20, 460+p.z-40, 40, 40);
    });
}
