(() => {
  let audioContext = null;
  let alarmTimer = null;
  let pollTimer = null;
  let pendingCount = 0;
  let latestId = 0;
  let alarmEnabled = false;
  let lastBeepAt = 0;

  function ensureUi() {
    if (document.getElementById('orderAlarmBar')) return;
    const bar = document.createElement('div');
    bar.id = 'orderAlarmBar';
    bar.className = 'order-alarm-bar';
    bar.innerHTML = '<span id="orderAlarmText">🔔 Order alarm: checking…</span><button type="button" id="enableAlarmBtn" class="btn btn-sm btn-light ms-2">Enable Sound</button>';
    document.body.prepend(bar);
    document.getElementById('enableAlarmBtn').addEventListener('click', async () => {
      await enableSound(true);
      updateUi();
      if (pendingCount > 0) beep(true);
    });
  }

  async function enableSound(userGesture = false) {
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      alarmEnabled = audioContext.state === 'running';
      if (userGesture && alarmEnabled) {
        beep(true);
      }
    } catch (_) {
      alarmEnabled = false;
    }
  }

  function beep(force = false) {
    if (!audioContext || audioContext.state !== 'running') return;
    const now = Date.now();
    if (!force && now - lastBeepAt < 900) return;
    lastBeepAt = now;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    osc.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
  }

  function startAlarm() {
    if (alarmTimer || pendingCount <= 0) return;
    alarmTimer = setInterval(() => {
      if (pendingCount > 0) beep();
      else stopAlarm();
    }, 1800);
    if (alarmEnabled) beep(true);
  }

  function stopAlarm() {
    if (alarmTimer) clearInterval(alarmTimer);
    alarmTimer = null;
  }

  function updateUi() {
    ensureUi();
    const bar = document.getElementById('orderAlarmBar');
    const text = document.getElementById('orderAlarmText');
    const btn = document.getElementById('enableAlarmBtn');
    if (pendingCount > 0) {
      bar.classList.add('active');
      text.textContent = `🔔 ${pendingCount} pending order${pendingCount > 1 ? 's' : ''} — alarm continues until accepted or cancelled.`;
      btn.textContent = alarmEnabled ? '🔊 Sound On' : 'Enable Sound';
      startAlarm();
    } else {
      bar.classList.remove('active');
      text.textContent = alarmEnabled ? '🔔 Order alarm ready — no pending orders.' : '🔔 Order alarm ready — enable sound for new orders.';
      btn.textContent = alarmEnabled ? '🔊 Sound On' : 'Enable Sound';
      stopAlarm();
    }
  }

  async function poll() {
    try {
      const r = await fetch('/api/admin/pending-count', {cache: 'no-store'});
      if (!r.ok) return;
      const d = await r.json();
      const oldCount = pendingCount;
      const oldLatest = latestId;
      pendingCount = Number(d.pending_count || 0);
      latestId = Number(d.latest_id || 0);
      updateUi();
      if (pendingCount > 0 && (pendingCount > oldCount || latestId > oldLatest) && alarmEnabled) beep(true);
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', async () => {
    ensureUi();
    // Browsers may block sound until the admin interacts with this page.
    document.addEventListener('pointerdown', () => enableSound(false), {once: true, passive: true});
    document.addEventListener('keydown', () => enableSound(false), {once: true, passive: true});
    await enableSound(false);
    await poll();
    pollTimer = setInterval(poll, 2000);
  });

  window.addEventListener('beforeunload', () => {
    stopAlarm();
    if (pollTimer) clearInterval(pollTimer);
  });
})();
