(function () {
  'use strict';

  // ---------- DOM refs ----------
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const activationEl = document.getElementById('activation-display');
  const tempEl = document.getElementById('temp-display');
  const presEl = document.getElementById('pres-display');
  const safeEl = document.getElementById('safe-display');
  const hudRadEl = document.getElementById('hud-rad');
  const hudHeatEl = document.getElementById('hud-heat');
  const hudPresEl = document.getElementById('hud-pres');
  const valRadEl = document.getElementById('val-rad');
  const valHeatEl = document.getElementById('val-heat');
  const valPresEl = document.getElementById('val-pres');
  const barRadEl = document.getElementById('bar-rad');
  const barHeatEl = document.getElementById('bar-heat');
  const barPresEl = document.getElementById('bar-pres');
  const graphBody = document.getElementById('graph-body');
  const logEl = document.getElementById('log');
  const btnStart = document.getElementById('btn-start');
  const btnStablize = document.getElementById('btn-stablize');
  const btnSafety = document.getElementById('btn-safety');
  const btnReset = document.getElementById('btn-reset');

  // ---------- State ----------
  const state = {
    mode: 'idle',
    activation: 0,
    temperature: 20,
    pressure: 101.3,
    radiation: 0,
    graph: [],
    log: [],
    lastTick: 0,
    delta: 0,
    danger: 0
  };

  const MAX_BARS = 28;

  const SPEED = 1;
  const STABLITY = 0.04;
  const SAFETY_BOOST = 1.6;

  // ---------- Helpers ----------
  function now() { return performance.now(); }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function addLog(text, kind) {
    state.log.unshift({ text, kind: kind || 'info', time: now() });
    while (state.log.length > 60) state.log.pop();
    renderLog();
  }

  // ---------- Logging ----------
  function renderLog() {
    logEl.innerHTML = '';
    state.log.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry' + (entry.kind === 'warn' ? ' warn' : entry.kind === 'alert' ? ' alert' : '');
      div.textContent = entry.text;
      logEl.appendChild(div);
    });
    logEl.scrollTop = 0;
  }

  // ---------- UI update ----------
  function updateUI() {
    activationEl.textContent = Math.round(state.activation) + '%';
    tempEl.textContent = Math.round(state.temperature) + ' °C';
    presEl.textContent = state.pressure.toFixed(1) + ' kPa';
    const safe = state.activation < 40 && state.temperature < 90 && state.pressure < 140;
    safeEl.textContent = safe ? 'OK' : 'ALERT';
    safeEl.style.color = safe ? 'var(--green)' : 'var(--red)';

    hudRadEl.textContent = state.radiation.toFixed(1);
    hudHeatEl.textContent = state.temperature.toFixed(1);
    hudPresEl.textContent = state.pressure.toFixed(1);

    valRadEl.textContent = state.radiation.toFixed(1);
    valHeatEl.textContent = state.temperature.toFixed(1);
    valPresEl.textContent = state.pressure.toFixed(1);

    const hHeat = clamp(state.temperature / 140, 0, 1) * 100;
    const hPres = clamp(state.pressure / 150, 0, 1) * 100;
    barRadEl.style.height = (clamp(state.radiation / 200, 0, 1) * 100) + '%';
    barHeatEl.style.height = hHeat + '%';
    barPresEl.style.height = hPres + '%';

    drawGraph();
    drawWorld();
  }

  // ---------- Graph ----------
  function drawGraph() {
    if (!graphBody) return;
    const bars = state.graph;
    graphBody.innerHTML = '';
    const span = document.createElement('span');
    span.style.height = '100%';
    span.style.opacity = '0';
    graphBody.appendChild(span);
    for (let i = 0; i < bars.length; i++) {
      const b = document.createElement('span');
      const value = bars[i];
      b.style.height = (value * 100) + '%';
      b.style.background = i < bars.length - 1 ? 'rgba(255,221,0,0.65)' : 'rgba(255,221,0,1)';
      b.style.opacity = Math.min(1, value * 3 + 0.1);
      graphBody.appendChild(b);
    }
  }

  // ---------- World drawing ----------
  const PIXEL_W = 448;
  const PIXEL_H = 448;

  function drawWorld() {
    if (!ctx) return;
    ctx.clearRect(0, 0, PIXEL_W, PIXEL_H);

    const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
    grad.addColorStop(0, '#0c1016');
    grad.addColorStop(0.55, '#070a0f');
    grad.addColorStop(1, '#030609');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

    const a = state.activation / 100;
    const danger = state.danger;

    const radHeight = clamp(state.radiation / 180, 0, 1) * PIXEL_H * 0.7;
    const radX = PIXEL_W - 16;
    ctx.fillStyle = 'rgba(255, 221, 0, ' + (0.12 + a * 0.35) + ')';
    ctx.fillRect(radX, PIXEL_H - radHeight - 10, 16, radHeight);
    ctx.shadowColor = 'rgba(255, 221, 0, 0.35)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255, 221, 0, ' + (0.18 + a * 0.3) + ')';
    for (let i = 0; i < 6; i++) {
      const y = PIXEL_H - radHeight - 10 - (i * radHeight * 0.12);
      const w = 4 + Math.sin(i * 2.3) * 3;
      ctx.fillRect(radX, y, w, 6);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < PIXEL_W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, PIXEL_H);
      ctx.stroke();
    }
    for (let y = 0; y < PIXEL_H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(PIXEL_W, y);
      ctx.stroke();
    }

    const cx = PIXEL_W / 2;
    const cy = PIXEL_H / 2;
    const hx = cx;
    const hy = cy;

    ctx.fillStyle = 'rgba(30, 34, 44, 0.9)';
    ctx.fillRect(hx - 18, hy + 8, 36, 20);
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(hx - 18 + (i * 9), hy + 8, 8, 20);
    }

    ctx.fillStyle = 'rgba(48, 54, 68, 0.95)';
    ctx.fillRect(hx - 10, hy - 36, 20, 36);
    ctx.fillRect(hx - 10, hy - 36, 4, 36);

    ctx.fillStyle = 'rgba(70, 78, 96, 0.9)';
    ctx.beginPath();
    ctx.arc(hx, hy - 36, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(50, 56, 70, 0.9)';
    ctx.beginPath();
    ctx.arc(hx, hy - 36, 10, Math.PI, 0);
    ctx.fill();

    const glow = (danger > 0) ? danger * 0.08 : 0;
    ctx.shadowColor = 'rgba(255, 221, 0, ' + glow + ')';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255, 221, 0, ' + (0.25 + a * 0.4) + ')';
    ctx.beginPath();
    ctx.arc(hx, hy - 36, 5 + a * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const px = 32;
    const py = 40;
    ctx.fillStyle = 'rgba(14, 18, 26, 0.9)';
    ctx.fillRect(px, py, 44, 36);
    ctx.fillStyle = 'rgba(60, 68, 86, 0.9)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px + 4, py + 6 + (i * 8), 8, 6);
    }

    ctx.fillStyle = 'rgba(255, 221, 0, ' + (0.1 + a * 0.2) + ')';
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const r = 12 + Math.sin(a * 10) * 3;
      const x = px + 22 + Math.cos(ang) * r;
      const y = py + 22 + Math.sin(ang) * r;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,221,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, PIXEL_W - 8, PIXEL_H - 8);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TRINITY', cx, 16);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillText('ATOMO', cx, 32);
  }


  // ---------- Simulation logic ----------
  function tick() {
    state.delta = now() - state.lastTick;
    state.lastTick = now();

    const dt = clamp(state.delta / 1000, 0, 0.05);

    if (state.mode === 'running') {
      const targetAct = clamp(state.activation + rand(-2.5, 2.5) * dt * SPEED, 0, 100);
      state.activation = targetAct;
      state.temperature += rand(-0.6, 0.6) * dt * SPEED;
      state.pressure += rand(-0.3, 0.3) * dt * SPEED;
      state.radiation += rand(-1.2, 1.2) * dt * SPEED;
      state.danger += rand(-0.5, 0.5) * dt * SPEED;
    } else if (state.mode === 'stablized') {
      state.activation = lerp(state.activation, 70, STABLITY * dt);
      state.temperature = lerp(state.temperature, 60, STABLITY * dt * 1.4);
      state.pressure = lerp(state.pressure, 110, STABLITY * dt * 0.8);
      state.radiation = lerp(state.radiation, 25, STABLITY * dt * 1.6);
      state.danger = lerp(state.danger, 0.1, STABLITY * dt * 0.5);
    } else if (state.mode === 'safety') {
      state.activation = lerp(state.activation, 0, SAFETY_BOOST * dt);
      state.temperature = lerp(state.temperature, 15, SAFETY_BOOST * dt * 2);
      state.pressure = lerp(state.pressure, 100, SAFETY_BOOST * dt * 1.5);
      state.radiation = lerp(state.radiation, 0, SAFETY_BOOST * dt * 2.5);
      state.danger = lerp(state.danger, 0, SAFETY_BOOST * dt * 1.5);
    }

    state.radiation += rand(-0.3, 0.3) * dt;
    state.temperature += rand(-0.1, 0.1) * dt;
    state.pressure += rand(-0.05, 0.05) * dt;
    state.danger += rand(-0.08, 0.08) * dt;

    state.activation = clamp(state.activation, 0, 100);
    state.temperature = clamp(state.temperature, 10, 300);
    state.pressure = clamp(state.pressure, 80, 200);
    state.radiation = clamp(state.radiation, 0, 300);
    state.danger = clamp(state.danger, 0, 1);

    state.graph.push(state.radiation);
    if (state.graph.length > MAX_BARS) state.graph.shift();

    const danger = state.radiation > 120 || state.temperature > 130 || state.pressure > 160;
    state.danger = danger ? 0.7 + Math.random() * 0.3 : 0;

    if (state.mode === 'running' && state.radiation > 260) {
      modeSafety();
    }

    updateUI();
    logTick();
  }

  function logTick() {
    const entry = state.log[0];
    if (entry) {
      const now2 = now();
      if (now2 - entry.time > 2000) {
        // only show last entry timestamp
      }
    }
  }

  // ---------- Mode actions ----------
  function modeStart() {
    if (state.mode === 'running') return;
    state.mode = 'running';
    state.lastTick = now();
    btnStart.textContent = '⏹ Parar';
    btnStart.style.borderColor = 'var(--red)';
    addLog('Sistema ativado. Configurando controles...', 'alert');
    updateUI();
  }

  function modeStop() {
    if (state.mode === 'idle') return;
    state.mode = 'idle';
    btnStart.textContent = '▶ Ligar';
    btnStart.style.borderColor = 'var(--yellow)';
    addLog('Sistema parado. Pronto para reiniciar.', 'info');
    updateUI();
  }

  function modeStablize() {
    if (state.mode === 'stablized') return;
    state.mode = 'stablized';
    btnStablize.textContent = '✓ Estabilizado';
    addLog('Sistema estabilizado. Níveis aparecem no controle.', 'info');
    updateUI();
  }

  function modeSafety() {
    state.mode = 'safety';
    btnSafety.textContent = '⟳ Recarregar';
    addLog('CONTROLE SEGURANÇA ATIVADO. Encher o medição.', 'warn');
    updateUI();
    setTimeout(() => {
      if (state.mode === 'safety') modeStablize();
    }, 2200);
  }

  function modeReset() {
    state.mode = 'idle';
    state.activation = 0;
    state.temperature = 20;
    state.pressure = 101.3;
    state.radiation = 0;
    state.graph = [];
    state.danger = 0;
    btnStart.textContent = '▶ Ligar';
    btnStablize.textContent = '⟳ Estabilizar';
    btnSafety.textContent = '⏏ Segurança';
    addLog('Sistema reinicializado.', 'info');
    updateUI();
  }

  // ---------- Event listeners ----------
  btnStart.addEventListener('click', () => {
    if (state.mode === 'idle' || state.mode === 'safety') modeStart();
    else modeStop();
  });

  btnStablize.addEventListener('click', modeStablize);

  btnSafety.addEventListener('click', modeSafety);

  btnReset.addEventListener('click', modeReset);

  // ---------- Init ----------
  state.lastTick = now();
  addLog('Sistema inicializado. Licença de teste ativada.', 'info');
  updateUI();

  // Start loop
  function loop() {
    tick();
    requestAnimationFrame(loop);
  }
  loop();
})();
