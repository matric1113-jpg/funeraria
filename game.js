(() => {
  'use strict';

  const app = document.getElementById('app');
  const PEER_SCRIPT_AVAILABLE = typeof window.Peer === 'function';
  const SHIFT_LENGTH = 180;
  const DAY_COST = 35000;
  const serviceCatalog = {
    economico: {
      name: 'Plan "Pa la casa"', icon: '🪦', reward: 52000, tone: 'normal',
      steps: [
        { station: 'Recepción', name: 'Recibir a la familia', icon: '👋' },
        { station: 'Sala de velorio', name: 'Preparar sala sencilla', icon: '🕯️' },
        { station: 'Carroza', name: 'Despachar la carroza', icon: '🚗' }
      ]
    },
    clasico: {
      name: 'Último adiós clásico', icon: '🌹', reward: 82000, tone: 'normal',
      steps: [
        { station: 'Recepción', name: 'Recibir a la familia', icon: '👋' },
        { station: 'Sala de velorio', name: 'Preparar sala con flores', icon: '🌹' },
        { station: 'Despedida', name: 'Coordinar unas palabras', icon: '🎤' },
        { station: 'Carroza', name: 'Despachar la carroza', icon: '🚗' }
      ]
    },
    premium: {
      name: 'Plan "Patrón del más allá"', icon: '✨', reward: 138000, tone: 'vip',
      steps: [
        { station: 'Recepción', name: 'Recibir al clan VIP', icon: '🕴️' },
        { station: 'Sala de velorio', name: 'Abrir la sala presidencial', icon: '🕯️' },
        { station: 'Extras', name: 'Contratar un tenor dramático', icon: '🎼' },
        { station: 'Despedida', name: 'Activar humo ceremonial', icon: '🌫️' },
        { station: 'Carroza', name: 'Despedir con estilo', icon: '🚘' }
      ]
    }
  };

  const customers = [
    { name: 'Familia González del Maule', emoji: '👨‍👩‍👦' },
    { name: 'Los primos de San Javier', emoji: '🧑‍🤝‍🧑' },
    { name: 'Familia Pérez Parra', emoji: '👪' },
    { name: 'Don Hernán y sus 14 sobrinos', emoji: '🧓' },
    { name: 'Una influencer de Curicó', emoji: '🧢' },
    { name: 'Club de rayuela Los Titanes', emoji: '🧔' },
    { name: 'La familia del almacén de la esquina', emoji: '🛍️' },
    { name: 'Los Rojas (vinieron todos)', emoji: '👨‍👩‍👧‍👦' },
    { name: 'Un concejal sin agenda', emoji: '🤵' },
    { name: 'La comparsa de Villa Alegre', emoji: '🎭' },
    { name: 'Un grupo de ex compañeros', emoji: '👥' },
    { name: 'La tía que organiza todo', emoji: '👒' },
    { name: 'Familia "sin hacer escándalo"', emoji: '🤫' },
    { name: 'Los vecinos de toda la cuadra', emoji: '🏘️' }
  ];

  const upgradeCatalog = {
    sala: {
      name: 'Sala con calefacción emocional', icon: '🕯️', max: 3,
      description: 'Las familias aguantan más tiempo antes de perder la paciencia.',
      baseCost: 72000, effect: level => `+${level * 8} s de paciencia`
    },
    marketing: {
      name: 'Radio Funeral FM', icon: '📻', max: 3,
      description: 'Un jingle pegajoso atrae más clientes. El barrio no puede escapar.',
      baseCost: 85000, effect: level => `Llegan clientes más seguido (nivel ${level})`
    },
    carroza: {
      name: 'Carroza tuneada', icon: '🚘', max: 3,
      description: 'Llantas cromadas, respeto del barrio y facturas más grandes.',
      baseCost: 112000, effect: level => `+${level * 12}% de ingresos`
    },
    reputacion: {
      name: 'Diplomado en despedidas', icon: '🎓', max: 3,
      description: 'Servicio más fino. Incluso la competencia te saluda en la feria.',
      baseCost: 98000, effect: level => `+${level * 2} reputación inicial diaria`
    }
  };

  const headlines = [
    '<strong>Radio Paloma:</strong> "La única funeraria con estacionamiento para bicicletas y sentimientos".',
    '<strong>Último minuto:</strong> se agotaron las flores de plástico en todo el centro de Talca.',
    '<strong>Dato local:</strong> el GPS insiste en mandar todas las carrozas por la Alameda.',
    '<strong>Economía:</strong> sube el precio de la cinta negra; bajan las ganas de trabajar.',
    '<strong>Opinión del barrio:</strong> "Buena atención, el café sabía a despedida".',
    '<strong>Clima:</strong> 100% de probabilidad de drama, con chubascos aislados de lágrimas.',
    '<strong>Servicio al cliente:</strong> hoy aceptamos reclamos, flores y queques de la familia.',
    '<strong>Encuesta:</strong> 9 de cada 10 talquinos recomiendan tener un plan B y un buen toldo.'
  ];
  const tips = [
    'En Talca hasta las despedidas necesitan una buena logística. ¡No dejes que la carroza se quede sin bencina emocional!',
    'Consejo de gerencia: si la familia pide "algo piola", no actives el humo, el tenor ni las luces de estadio.',
    'La paciencia se acaba. La reputación también. Lo que nunca se acaba es la gente que llega 20 minutos tarde.',
    'Una mejora cara duele una vez. Una sucursal con goteras duele cada invierno.',
    'La clave del cooperativo: una persona atiende a los clientes y la otra resuelve el caos. Cambien de rol cuando quieran.'
  ];

  let screen = 'menu';
  let role = 'solo'; // solo | host | guest
  let playerName = 'Gerente';
  let partnerName = 'Socio/a';
  let peer = null;
  let connection = null;
  let connectionState = 'offline';
  let roomCode = '';
  let engineInterval = null;
  let toastTimeout = null;
  let shownReport = false;
  let state = freshState();

  function freshState() {
    return {
      day: 1,
      money: 185000,
      reputation: 48,
      timeLeft: SHIFT_LENGTH,
      orders: [],
      nextOrderId: 1,
      spawnIn: 2,
      completedToday: 0,
      failedToday: 0,
      grossToday: 0,
      streak: 0,
      bestStreak: 0,
      upgrades: { sala: 0, marketing: 0, carroza: 0, reputacion: 0 },
      running: true,
      report: null,
      logs: [
        { icon: '📋', text: 'Se abrió la sucursal de Talca. La municipalidad todavía no pregunta nada.', time: '09:00' },
        { icon: '☕', text: 'La cafetera hace un ruido preocupante. Se decidió llamarlo "ambiente".', time: '09:01' }
      ],
      notice: 'Primero se trabaja. Después vemos si era buena idea.'
    };
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function money(value) {
    return '$' + Math.round(Number(value) || 0).toLocaleString('es-CL');
  }
  function shortMoney(value) {
    const n = Math.round(Number(value) || 0);
    if (n >= 1000000) return '$' + (n / 1000000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'M';
    if (n >= 1000) return '$' + Math.round(n / 1000).toLocaleString('es-CL') + 'k';
    return money(n);
  }
  function clock() {
    // El turno comienza a las 09:00; el reloj es decorativo y cuenta hacia adelante.
    const passed = SHIFT_LENGTH - Math.max(0, state.timeLeft);
    const total = 9 * 60 + passed;
    return String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }
  function addLog(text, icon = '📌') {
    state.logs.unshift({ text, icon, time: clock() });
    state.logs = state.logs.slice(0, 6);
  }
  function toast(message) {
    let node = document.querySelector('.toast');
    if (node) node.remove();
    node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => node.remove(), 2800);
  }
  function notify(message, type = 'status') {
    if (role === 'host' || role === 'solo') {
      state.notice = message;
      if (type === 'log') addLog(message, '💬');
      broadcastState();
      render();
    } else {
      toast(message);
    }
  }
  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickService() {
    const r = Math.random();
    if (state.reputation >= 60 && r < 0.25) return 'premium';
    if (r < 0.25) return 'economico';
    if (r < 0.83) return 'clasico';
    return 'premium';
  }
  function spawnOrder() {
    if (state.orders.length >= 4) {
      addLog('Se formó fila hasta la esquina. Alguien dijo "esto en Curicó no pasa".', '🚶');
      state.spawnIn = 5;
      return;
    }
    const customer = randomFrom(customers);
    const serviceKey = pickService();
    const service = serviceCatalog[serviceKey];
    const patience = 39 + (state.upgrades.sala * 8) + (state.reputation >= 70 ? 4 : 0);
    const order = {
      id: state.nextOrderId++,
      customer: customer.name,
      emoji: customer.emoji,
      serviceKey,
      serviceName: service.name,
      reward: service.reward,
      steps: service.steps.map(step => ({ ...step })),
      stepIndex: 0,
      patience,
      maxPatience: patience,
      createdAt: clock()
    };
    state.orders.push(order);
    addLog(`${customer.name} pidió ${service.name.toLowerCase()}. Nadie sabe por qué trajeron una radio.`, '🚪');
    state.spawnIn = Math.max(7, 17 - state.upgrades.marketing * 2 - (state.reputation >= 75 ? 1 : 0));
  }
  function completeAction(orderId) {
    if (role === 'guest') {
      sendMessage({ type: 'ACTION', action: 'complete', orderId });
      return;
    }
    if (!state.running) return;
    const orderIndex = state.orders.findIndex(o => o.id === Number(orderId));
    if (orderIndex < 0) return toast('Esa familia ya se fue. Tal vez a otra funeraria.');
    const order = state.orders[orderIndex];
    const step = order.steps[order.stepIndex];
    if (!step) return;
    order.stepIndex++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const quips = [
      'Un trámite menos. La burocracia no duerme, pero hoy pestañeó.',
      'Perfecto. El Excel emocional quedó actualizado.',
      'Otro paso hacia la expansión del imperio de la despedida.',
      'Excelente coordinación: ni una reunión que pudo ser un correo.',
      'La familia asiente. El gerente también, aunque no entendió el formulario.'
    ];
    if (order.stepIndex >= order.steps.length) {
      const multiplier = 1 + (state.upgrades.carroza * 0.12);
      const reputationBonus = state.reputation >= 75 ? 1.08 : 1;
      const bonus = state.streak > 0 && state.streak % 5 === 0 ? 5000 : 0;
      const earned = Math.round(order.reward * multiplier * reputationBonus) + bonus;
      state.money += earned;
      state.grossToday += earned;
      state.completedToday++;
      state.reputation = Math.min(100, state.reputation + 2 + state.upgrades.reputacion);
      state.orders.splice(orderIndex, 1);
      state.notice = `¡Servicio terminado! Entraron ${money(earned)} a la caja.`;
      addLog(`Servicio completado: ${order.customer}. Caja +${money(earned)}.`, '💸');
    } else {
      state.notice = `${step.name}: listo. Siguiente estación: ${order.steps[order.stepIndex].station}.`;
      addLog(`${order.customer}: ${step.name.toLowerCase()} listo. ${randomFrom(quips)}`, step.icon);
    }
    broadcastState();
    render();
  }
  function failOrder(index) {
    const [order] = state.orders.splice(index, 1);
    if (!order) return;
    state.failedToday++;
    state.reputation = Math.max(0, state.reputation - 4);
    state.streak = 0;
    state.notice = 'Una familia perdió la paciencia. La reseña dice: "Mucho papeleo, poca despedida".';
    addLog(`${order.customer} se fue a la competencia. Reputación −4.`, '😤');
  }
  function purchaseUpgrade(key) {
    if (role === 'guest') {
      sendMessage({ type: 'ACTION', action: 'upgrade', key });
      return;
    }
    const item = upgradeCatalog[key];
    const level = state.upgrades[key];
    if (!item || level >= item.max) return;
    const cost = Math.round(item.baseCost * (1 + level * 0.72));
    if (state.money < cost) {
      toast('La caja no alcanza. La situación está en manos de Contabilidad.');
      return;
    }
    state.money -= cost;
    state.upgrades[key]++;
    const effect = item.effect(state.upgrades[key]);
    state.notice = `Mejora comprada: ${item.name}. ${effect}.`;
    addLog(`Inversión aprobada: ${item.name} (−${money(cost)}).`, '🛠️');
    broadcastState();
    render();
  }
  function performAction(action, payload = {}) {
    if (role === 'guest') {
      sendMessage({ type: 'ACTION', action, ...payload });
      return;
    }
    if (!state.running && action !== 'nextDay') return;
    if (action === 'complete') completeAction(payload.orderId);
    if (action === 'upgrade') purchaseUpgrade(payload.key);
    if (action === 'nextDay') nextDay();
    if (action === 'endGame') goToMenu();
  }
  function advanceHostEngine() {
    if (!state.running || role === 'guest' || screen !== 'game') return;
    state.timeLeft--;
    state.spawnIn--;
    for (let i = state.orders.length - 1; i >= 0; i--) {
      state.orders[i].patience--;
      if (state.orders[i].patience <= 0) failOrder(i);
    }
    if (state.spawnIn <= 0) spawnOrder();
    if (state.timeLeft <= 0) closeDay();
    broadcastState();
    render();
  }
  function startEngine() {
    stopEngine();
    engineInterval = setInterval(advanceHostEngine, 1000);
  }
  function stopEngine() {
    if (engineInterval) clearInterval(engineInterval);
    engineInterval = null;
  }
  function closeDay() {
    state.running = false;
    state.timeLeft = 0;
    const upgradesCount = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
    const costs = DAY_COST + upgradesCount * 3000;
    state.money -= costs;
    const net = state.grossToday - costs;
    state.report = {
      day: state.day,
      completed: state.completedToday,
      failed: state.failedToday,
      gross: state.grossToday,
      costs,
      net,
      balance: state.money
    };
    if (state.money < 0) {
      state.notice = 'La cuenta quedó en rojo. El banco ahora te llama por tu nombre de pila.';
      addLog(`Cierre en números rojos (${money(state.money)}). La gerencia evita contestar el teléfono.`, '📉');
    } else {
      state.notice = 'Turno cerrado. La sucursal sigue en pie y la cafetera también, por algún motivo.';
      addLog(`Cierre del día ${state.day}: gastos fijos ${money(costs)}.`, '🧾');
    }
    stopEngine();
    broadcastState();
    render();
  }
  function nextDay() {
    if (role === 'guest') {
      sendMessage({ type: 'ACTION', action: 'nextDay' });
      return;
    }
    state.day++;
    state.timeLeft = SHIFT_LENGTH;
    state.orders = [];
    state.completedToday = 0;
    state.failedToday = 0;
    state.grossToday = 0;
    state.streak = 0;
    state.spawnIn = 2;
    state.running = true;
    state.report = null;
    state.reputation = Math.min(100, Math.max(5, state.reputation + state.upgrades.reputacion));
    state.notice = `Día ${state.day}: nuevas familias, nuevos formularios, los mismos muebles.`;
    addLog(`Comienza el día ${state.day}. Alguien dejó sopaipillas en recepción.`, '🌤️');
    shownReport = false;
    startEngine();
    broadcastState();
    render();
  }

  function sendMessage(message) {
    if (connection && connection.open) {
      try { connection.send(message); } catch (error) { console.error(error); toast('No se pudo enviar la acción. Revisa la conexión.'); }
    } else if (role === 'guest') {
      toast('Se perdió la conexión con la sucursal anfitriona.');
    }
  }
  function broadcastState() {
    if (role === 'host' && connection && connection.open) {
      try {
        connection.send({ type: 'STATE', state, hostName: playerName, partnerName, connectionState });
      } catch (error) { console.warn('No se pudo sincronizar estado', error); }
    }
  }
  function handleHostMessage(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'JOIN') {
      partnerName = safeName(message.name || 'Socio/a');
      connectionState = 'connected';
      screen = 'game';
      state.notice = `${partnerName} se sumó a la gerencia. ¡Se acabó la excusa de que nadie contesta el teléfono!`;
      addLog(`${partnerName} se conectó desde otra sucursal (internet).`, '🤝');
      state.running = true;
      if (!engineInterval) startEngine();
      try { connection.send({ type: 'WELCOME', state, hostName: playerName, partnerName, connectionState }); } catch (_) {}
      broadcastState();
      render();
      toast(`${partnerName} se unió a la partida.`);
      return;
    }
    if (message.type === 'ACTION') {
      if (message.action === 'complete') performAction('complete', { orderId: message.orderId });
      if (message.action === 'upgrade') performAction('upgrade', { key: message.key });
      if (message.action === 'nextDay') performAction('nextDay');
      return;
    }
    if (message.type === 'PING_NAME') {
      partnerName = safeName(message.name || partnerName);
      broadcastState();
    }
  }
  function handleGuestMessage(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'WELCOME' || message.type === 'STATE') {
      if (message.state) state = message.state;
      if (message.hostName) partnerName = message.hostName;
      connectionState = 'connected';
      screen = 'game';
      if (state.running) shownReport = false;
      render();
      return;
    }
  }
  function safeName(value) {
    const cleaned = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 18);
    return cleaned || 'Gerente';
  }
  function generateRoomCode() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 7; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return 'fun-talca-' + result;
  }
  function createOnlineRoom() {
    if (!window.Peer) {
      showNotice('No se cargó la biblioteca de conexión. Revisa internet o juega en modo solo.', true);
      return;
    }
    playerName = safeName(document.getElementById('playerName')?.value || 'Gerente 1');
    role = 'host';
    connectionState = 'waiting';
    roomCode = generateRoomCode();
    showNotice('Creando sala segura-ish… ("ish" porque esto es una funeraria tycoon)', false);
    peer = new window.Peer(roomCode, { debug: 1 });
    peer.on('open', id => {
      roomCode = id;
      showRoomReady();
    });
    peer.on('connection', conn => {
      if (connection && connection.open) {
        conn.close();
        return;
      }
      connection = conn;
      connection.on('open', () => {});
      connection.on('data', handleHostMessage);
      connection.on('close', () => {
        connectionState = 'disconnected';
        partnerName = 'Socio/a desconectado';
        if (screen === 'game') { render(); toast('Tu socio/a se desconectó. La funeraria sigue operando.'); }
      });
      connection.on('error', err => console.warn('Error de conexión', err));
    });
    peer.on('error', err => {
      console.error(err);
      const message = err?.type === 'unavailable-id'
        ? 'Ese código ya existe. Vuelve atrás e intenta crear otra sala.'
        : 'No se pudo crear la sala. Revisa la conexión a internet e inténtalo de nuevo.';
      showNotice(message, true);
    });
  }
  function joinOnlineRoom() {
    if (!window.Peer) {
      showNotice('No se cargó la biblioteca de conexión. Revisa internet o juega en modo solo.', true);
      return;
    }
    playerName = safeName(document.getElementById('playerName')?.value || 'Gerente 2');
    const input = document.getElementById('joinRoomCode');
    const code = String(input?.value || '').trim().toLowerCase();
    if (!code) { showNotice('Pídele el código de sala a la persona que la creó.', true); return; }
    role = 'guest';
    connectionState = 'connecting';
    roomCode = code;
    showNotice('Llamando a Talca… si no contestan, insiste con elegancia.', false);
    peer = new window.Peer(undefined, { debug: 1 });
    peer.on('open', () => {
      connection = peer.connect(code, { reliable: true });
      connection.on('open', () => {
        connection.send({ type: 'JOIN', name: playerName });
        showNotice('Conectado al cable invisible. Esperando que la gerencia responda…', false);
      });
      connection.on('data', handleGuestMessage);
      connection.on('close', () => {
        connectionState = 'disconnected';
        if (screen === 'game') { render(); toast('Se cortó la conexión con la sucursal anfitriona.'); }
      });
      connection.on('error', err => {
        console.warn(err);
        showNotice('No se pudo conectar. Verifica el código y que la otra persona tenga la sala abierta.', true);
      });
    });
    peer.on('error', err => {
      console.warn(err);
      showNotice('No se pudo encontrar la sala. Revisa el código (incluidos los guiones).', true);
    });
  }
  function showRoomReady() {
    screen = 'room';
    render();
  }
  function startSolo() {
    playerName = safeName(document.getElementById('playerName')?.value || 'Gerente');
    cleanupNetwork();
    role = 'solo';
    partnerName = 'Asiento vacío';
    connectionState = 'offline';
    state = freshState();
    screen = 'game';
    startEngine();
    render();
  }
  function cleanupNetwork() {
    stopEngine();
    if (connection) { try { connection.close(); } catch (_) {} }
    if (peer) { try { peer.destroy(); } catch (_) {} }
    connection = null;
    peer = null;
  }
  function goToMenu() {
    cleanupNetwork();
    role = 'solo';
    screen = 'menu';
    connectionState = 'offline';
    state = freshState();
    roomCode = '';
    render();
  }
  function showNotice(text, error) {
    const notice = document.getElementById('menuNotice');
    if (notice) {
      notice.textContent = text;
      notice.className = 'notice show';
      if (error) notice.style.background = '#fae4df', notice.style.color = '#9b453a';
      else notice.style.background = '', notice.style.color = '';
    } else {
      render();
      const again = document.getElementById('menuNotice');
      if (again) { again.textContent = text; again.className = 'notice show'; if (error) again.style.background = '#fae4df', again.style.color = '#9b453a'; }
    }
  }

  function renderMenu() {
    app.innerHTML = `
      <div class="menu-wrap">
        <header class="menu-head">
          <div class="logo-mark">🪦</div>
          <div class="talca-stamp">📍 TALCA · REGIÓN DEL MAULE</div>
          <p class="eyebrow">UN TYCOON PARA DESCANSAR EN PAZ (LA CAJA NO)</p>
          <h1>El Último<br>Viaje</h1>
          <p class="subtitle">Administra la funeraria más ambiciosa del Maule. Atiende familias, invierte en mejoras y convierte el caos administrativo en un imperio… con respeto, pero no demasiado.</p>
        </header>
        <div class="menu-grid">
          <section class="menu-card panel">
            <p class="section-kicker">Antes de abrir</p>
            <h2>¿Quién toma el turno?</h2>
            <p class="muted tiny">La cooperación es opcional. Las cuentas por pagar no.</p>
            <label class="form-label" for="playerName">Tu nombre de gerente</label>
            <input class="text-input" id="playerName" maxlength="18" autocomplete="nickname" placeholder="Ej. Matías" value="">
            <div class="menu-actions">
              <button class="btn btn-primary full" data-action="create-room">🤝 Crear sala cooperativa</button>
              <div style="height:1px;background:var(--line);margin:4px 0"></div>
              <label class="form-label" for="joinRoomCode" style="margin-top:0">¿Te invitaron? Código de sala</label>
              <input class="text-input" id="joinRoomCode" maxlength="40" placeholder="fun-talca-xxxxxxx" autocomplete="off">
              <button class="btn btn-dark full" data-action="join-room">🔑 Unirme a una sala</button>
              <button class="btn btn-soft full" data-action="solo">🧾 Jugar en solitario</button>
            </div>
            <div id="menuNotice" class="notice" role="status"></div>
          </section>
          <aside class="menu-card panel">
            <p class="section-kicker">Manual de la gerencia</p>
            <h2>El negocio nunca descansa.</h2>
            <ul class="feature-list">
              <li><span class="feature-icon">👋</span><span><strong>Atiende por etapas.</strong><br>Recibe a cada familia, prepara la sala y coordina su despedida.</span></li>
              <li><span class="feature-icon">💸</span><span><strong>Haz crecer la caja.</strong><br>Cada servicio completo genera ingresos. Paga los gastos al cerrar el turno.</span></li>
              <li><span class="feature-icon">🛠️</span><span><strong>Invierte con cabeza.</strong><br>Mejora la sala, el marketing, la carroza y tu prestigio.</span></li>
              <li><span class="feature-icon">🤝</span><span><strong>Dos gerentes, una funeraria.</strong><br>Comparte el código de sala. Ambos pueden atender clientes y comprar mejoras; todo se sincroniza.</span></li>
            </ul>
          </aside>
        </div>
        <p class="menu-foot">VERSIÓN 0.1 · HECHO CON FLORES DE PLÁSTICO Y EXCEL · SIN NINGUNA GARANTÍA ESPIRITUAL</p>
      </div>`;
  }
  function renderRoom() {
    app.innerHTML = `
      <div class="menu-wrap">
        <header class="menu-head">
          <div class="logo-mark">🪦</div>
          <p class="eyebrow">SUCURSAL PREPARADA · TALCA</p>
          <h1>La sala está<br>abierta.</h1>
          <p class="subtitle">Comparte este código con tu socio/a. Cuando se conecte, parte el turno y la caja quedará compartida.</p>
        </header>
        <section class="menu-card panel" style="max-width:620px;margin:0 auto;text-align:center">
          <p class="section-kicker">Código de invitación</p>
          <div class="room-instructions" style="text-align:left;margin-top:10px">
            <strong>1. Copia el código</strong>
            <span class="muted tiny">Mándalo por WhatsApp, Discord o gritándolo desde recepción.</span>
            <div class="room-id-box"><div class="room-code" id="visibleRoomCode">${esc(roomCode)}</div><button class="btn btn-dark btn-small" data-action="copy-code">Copiar</button></div>
          </div>
          <div class="room-instructions" style="text-align:left">
            <strong>2. Espera al segundo gerente</strong>
            <span class="muted tiny">Deja esta pestaña abierta. El turno aún no ha comenzado.</span>
            <p class="connection-chip waiting" style="margin:12px 0 0"><span>●</span> Esperando conexión…</p>
          </div>
          <div id="menuNotice" class="notice show">Tu código está listo. La cooperativa empieza cuando llegue la otra persona.</div>
          <div class="menu-actions" style="margin-top:20px"><button class="btn btn-soft full" data-action="back-menu">← Volver al menú</button></div>
        </section>
        <p class="menu-foot">No cierres esta pestaña: aquí vive la caja compartida.</p>
      </div>`;
  }

  function upgradeHTML(key) {
    const item = upgradeCatalog[key];
    const level = state.upgrades[key] || 0;
    const cost = Math.round(item.baseCost * (1 + level * 0.72));
    const maxed = level >= item.max;
    const disabled = maxed || !state.running || (role !== 'guest' && state.money < cost);
    return `<div class="upgrade">
      <div class="upgrade-top"><div class="upgrade-name">${esc(item.name)}<div style="margin-top:4px"><span class="level-pill">NIVEL ${level}/${item.max}</span></div></div><span class="upgrade-emoji">${item.icon}</span></div>
      <div class="upgrade-desc">${esc(item.description)}</div>
      <div class="upgrade-bottom"><span class="upgrade-cost">${maxed ? 'COMPLETADO' : money(cost)}</span><button class="btn ${maxed ? 'btn-soft' : 'btn-orange'} btn-small" data-action="upgrade" data-key="${key}" ${disabled ? 'disabled' : ''}>${maxed ? '✓ Máx.' : 'Invertir'}</button></div>
    </div>`;
  }

  function orderHTML(order) {
    const service = serviceCatalog[order.serviceKey];
    const step = order.steps[order.stepIndex];
    const ratio = Math.max(0, Math.min(100, (order.patience / order.maxPatience) * 100));
    const isVip = order.serviceKey === 'premium';
    const doneCount = order.stepIndex;
    const disabled = role === 'host' || role === 'solo' ? !state.running : false;
    const stepsHTML = order.steps.map((s, i) => `<span class="step-dot ${i < order.stepIndex ? 'done' : ''}" title="${esc(s.name)}"></span>`).join('');
    return `<article class="order-card ${isVip ? 'vip' : ''}">
      <div class="order-top"><div style="display:flex;gap:10px;min-width:0"><div class="client-icon">${order.emoji}</div><div style="min-width:0"><div class="order-name">${esc(order.customer)}</div><div class="order-package">${service.icon} ${esc(order.serviceName)}</div></div></div><div class="order-price">${money(order.reward)}</div></div>
      <div class="patience" title="Paciencia de la familia"><div class="patience-fill ${ratio < 30 ? 'low' : ''}" style="width:${ratio}%"></div></div>
      ${step ? `<div class="next-task"><span class="task-icon">${step.icon}</span><div><div class="task-label">${esc(step.name)}</div><div class="task-step">PASO ${doneCount + 1} DE ${order.steps.length} · ${esc(step.station)}</div></div></div>
      <button class="btn btn-primary do-task" data-action="complete" data-order="${order.id}" ${disabled ? 'disabled' : ''}>${step.icon} Completar tarea</button>` : `<div class="next-task"><span class="task-icon">✅</span><div><div class="task-label">Servicio listo</div><div class="task-step">Cerrando cuenta…</div></div></div>`}
      <div class="progress-steps">${stepsHTML}</div>
      <div class="order-foot"><span>⏳ ${Math.max(0, order.patience)} s de paciencia</span><span>${doneCount}/${order.steps.length} tareas</span></div>
    </article>`;
  }
  function renderGame() {
    const connected = role === 'solo' ? false : connectionState === 'connected';
    const chip = role === 'solo'
      ? '<span class="connection-chip waiting">Modo solitario</span>'
      : connected ? '<span class="connection-chip">● Cooperativo conectado</span>' : '<span class="connection-chip waiting">● Esperando socio/a</span>';
    const queueHTML = state.orders.length
      ? state.orders.map(orderHTML).join('')
      : `<div class="empty-queue"><div class="empty-illustration">🪑🌹</div><strong>Recepción tranquila… sospechosamente tranquila.</strong><span class="muted tiny">Aprovecha para tomar agua. El próximo cliente viene en ${Math.max(0, state.spawnIn)} s.</span></div>`;
    const logHTML = state.logs.slice(0, 5).map(line => `<div class="log-line"><span>${line.icon}</span><span class="log-time">${esc(line.time)}</span><span>${esc(line.text)}</span></div>`).join('');
    const totalUpgradeLevels = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
    app.innerHTML = `
      <div class="game-layout">
        <aside class="sidebar">
          <section class="brand-card card">
            <div class="brand-row"><div class="brand-icon">🪦</div><div><p class="brand-title">El Último Viaje</p><p class="brand-sub">FUNERARIA & ASOCIADOS</p></div></div>
            <div class="branch-sketch"><div class="branch-sun"></div><span class="branch-flower left">🌿</span><div class="branch-building"><div class="branch-roof"></div><div class="branch-sign">EL ÚLTIMO VIAJE</div><div class="branch-door"></div></div><span class="branch-flower right">🌷</span></div>
            <p class="tiny muted" style="margin:12px 0 0">Sucursal Talca Centro · "Nos importa su pérdida y su presupuesto".</p>
          </section>
          <section class="upgrade-section card">
            <div class="section-heading"><h3>🛠️ Mejoras del negocio</h3><span class="level-pill">${totalUpgradeLevels} mejoras</span></div>
            <div class="upgrade-list">${Object.keys(upgradeCatalog).map(upgradeHTML).join('')}</div>
          </section>
          <section class="team-card card">
            <div class="team-title">🤝 EQUIPO DIRECTIVO</div>
            <div class="team-person"><span class="avatar">🧑‍💼</span><span><strong>${esc(playerName)}</strong><br><span class="muted tiny">${role === 'guest' ? 'Gerencia asociada' : 'Gerencia anfitriona'}</span></span><span class="online-dot"></span></div>
            ${role !== 'solo' ? `<div class="team-person"><span class="avatar">${connected ? '👨‍💼' : '🪑'}</span><span><strong>${esc(role === 'host' ? partnerName : (connected ? partnerName : 'Sucursal anfitriona'))}</strong><br><span class="muted tiny">${connected ? 'En línea' : 'Esperando conexión'}</span></span><span class="${connected ? 'online-dot' : 'online-dot offline-dot'}"></span></div>` : `<div class="team-person"><span class="avatar">🪑</span><span><strong>Segundo gerente</strong><br><span class="muted tiny">No se presentó al turno</span></span><span class="online-dot offline-dot"></span></div>`}
          </section>
          <div class="sidebar-actions"><button class="btn btn-soft full" data-action="menu-confirm">↩ Salir al menú</button></div>
        </aside>
        <section class="main-area">
          <header class="topbar"><div><div class="topbar-overline">REPORTE DE OPERACIONES · ${esc(clock())}</div><h2>Hay pega en la funeraria.</h2><div style="margin-top:9px">${chip}</div></div><div class="day-badge"><div class="day-num">DÍA ${state.day}</div><small>TURNO ${state.running ? 'EN CURSO' : 'CERRADO'}</small></div></header>
          <div class="stats-grid">
            <div class="stat card"><span class="stat-icon">💰</span><div class="stat-label">Caja disponible</div><div class="stat-value">${shortMoney(state.money)}</div><div class="stat-note">CLP · efectivo y esperanza</div></div>
            <div class="stat card"><span class="stat-icon">⭐</span><div class="stat-label">Reputación</div><div class="stat-value">${Math.round(state.reputation)}<span style="font-size:12px;color:var(--muted)">/100</span></div><div class="stat-note">${state.reputation >= 75 ? 'El barrio habla bien de ti' : state.reputation >= 45 ? 'Más o menos confiables' : 'Hay reseñas que duelen'}</div></div>
            <div class="stat card"><span class="stat-icon">🧑‍🤝‍🧑</span><div class="stat-label">En atención</div><div class="stat-value">${state.orders.length}<span style="font-size:12px;color:var(--muted)">/4</span></div><div class="stat-note">${state.completedToday} servicios cerrados hoy</div></div>
            <div class="stat card"><span class="stat-icon">⏱️</span><div class="stat-label">Tiempo de turno</div><div class="stat-value">${Math.floor(state.timeLeft / 60)}:${String(state.timeLeft % 60).padStart(2, '0')}</div><div class="stat-note">Termina el turno y paga gastos</div></div>
          </div>
          <div class="ticker"><span class="ticker-symbol">📢</span><div>${headlines[state.day % headlines.length]}<br><span class="tiny" style="opacity:.8">${esc(state.notice || 'La caja sigue abierta.')}</span></div></div>
          <section class="orders-panel card">
            <div class="orders-head"><div><h3>Familias en recepción</h3><p>Completa la siguiente tarea para mover cada servicio.</p></div><div class="queue-count">${state.orders.length} EN FILA</div></div>
            <div class="orders-grid">${queueHTML}</div>
          </section>
          <div class="bottom-grid">
            <section class="log-panel card"><div class="log-title"><h3>📒 Libro de novedades</h3><span class="tiny muted">${state.completedToday} cerrados · ${state.failedToday} fugados</span></div><div class="log-list">${logHTML}</div></section>
            <section class="tip-panel card"><h3>💡 Consejo de la gerencia</h3><p class="tip-quote">“${esc(tips[state.day % tips.length])}”</p><p style="margin-top:11px;font-size:9px;opacity:.75">LA ADMINISTRACIÓN NO SE HACE SOLA, PERO LOS PROBLEMAS SÍ.</p></section>
          </div>
          ${state.report && !state.running ? renderReport() : ''}
        </section>
      </div>`;
  }
  function renderReport() {
    const r = state.report;
    const positive = r.net >= 0;
    return `<div class="end-overlay"><section class="end-modal panel"><div class="logo-mark">${positive ? '📊' : '🧯'}</div><p class="eyebrow">INFORME DEL CONTADOR · TALCA</p><h2>Se cerró el turno.</h2><p class="muted tiny">Día ${r.day}. La caja rindió cuentas; la cafetera se negó a declarar.</p>
      <div class="report-stats"><div class="report-stat"><span>Servicios completados</span><strong>${r.completed}</strong></div><div class="report-stat"><span>Familias que se fueron</span><strong>${r.failed}</strong></div><div class="report-stat"><span>Ingresos brutos</span><strong>${money(r.gross)}</strong></div><div class="report-stat"><span>Gastos del turno</span><strong>${money(r.costs)}</strong></div></div>
      <div style="border-radius:13px;padding:13px;background:${positive ? '#e4eee1' : '#fae4df'};margin-bottom:18px"><span class="muted tiny">Resultado después de gastos</span><div class="mono" style="font-size:23px;font-weight:600;color:${positive ? '#3d6849' : '#a3483f'};margin-top:5px">${r.net >= 0 ? '+' : '−'}${money(Math.abs(r.net))}</div><div class="tiny" style="margin-top:4px">Saldo actual: ${money(r.balance)}</div></div>
      <div class="game-over-actions"><button class="btn btn-primary full" data-action="next-day">🌤️ Abrir al día siguiente</button><button class="btn btn-soft full" data-action="menu-confirm">Volver al menú</button></div>
    </section></div>`;
  }
  function render() {
    if (screen === 'menu') renderMenu();
    else if (screen === 'room') renderRoom();
    else renderGame();
  }

  app.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'create-room') createOnlineRoom();
    if (action === 'join-room') joinOnlineRoom();
    if (action === 'solo') startSolo();
    if (action === 'back-menu') goToMenu();
    if (action === 'copy-code') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(roomCode).then(() => toast('Código copiado. Que llegue el segundo gerente.')).catch(() => fallbackCopy(roomCode));
      } else fallbackCopy(roomCode);
    }
    if (action === 'complete') performAction('complete', { orderId: button.dataset.order });
    if (action === 'upgrade') performAction('upgrade', { key: button.dataset.key });
    if (action === 'next-day') performAction('nextDay');
    if (action === 'menu-confirm') {
      if (confirm('¿Salir al menú? El turno actual se perderá.')) goToMenu();
    }
  });
  function fallbackCopy(text) {
    const temp = document.createElement('textarea');
    temp.value = text; temp.style.position = 'fixed'; temp.style.opacity = '0';
    document.body.appendChild(temp); temp.select();
    try { document.execCommand('copy'); toast('Código copiado.'); } catch (_) { toast('Copia el código manualmente: ' + text); }
    temp.remove();
  }

  // Un huésped puede ver el estado que manda el anfitrión, pero no simula el reloj.
  // La autoridad de la partida vive en la pestaña anfitriona para evitar estados divergentes.
  window.addEventListener('beforeunload', () => {
    stopEngine();
    if (peer) { try { peer.destroy(); } catch (_) {} }
  });

  render();
})();
