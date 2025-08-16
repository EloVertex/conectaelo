// frontend/script.js
const API = 'http://localhost:3000';

// ---------- Helpers ----------
function el(id){ return document.getElementById(id); }
function setUserLabel(text){
  el('userLabel') && (el('userLabel').innerText = text);
  el('userLabelSmall') && (el('userLabelSmall').innerText = text);
  el('userLabelPanel') && (el('userLabelPanel').innerText = text);
}
function saveUserToken(t){ localStorage.setItem('user_token', t); }
function getUserToken(){ return localStorage.getItem('user_token'); }
function saveAdminToken(t){ localStorage.setItem('admin_token', t); }
function getAdminToken(){ return localStorage.getItem('admin_token'); }

// ---------- LOGIN (usuário) ----------
el('btnLogin')?.addEventListener('click', async () => {
  const username = el('inpUser').value.trim();
  const password = el('inpPass').value.trim();
  if(!username || !password) return el('loginMsg').innerText = 'Preencha usuário e senha';
  try{
    const res = await fetch(API + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password })});
    const j = await res.json();
    if(!j.ok) return el('loginMsg').innerText = j.message || 'Credenciais inválidas';
    saveUserToken(j.token);
    setUserLabel(j.user.nome || j.user.username);
    el('loginMsg').innerText = 'Login realizado! Você será redirecionado...';
    setTimeout(()=> location.href = 'dashboard.html', 800);
  }catch(e){ el('loginMsg').innerText = 'Erro de rede'; }
});

// entrar como admin
el('btnAdminLogin')?.addEventListener('click', async () => {
  const username = el('inpUser').value.trim();
  const password = el('inpPass').value.trim();
  if(!username || !password) return el('loginMsg').innerText = 'Preencha usuário e senha';
  try{
    const res = await fetch(API + '/auth/admin-login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password })});
    const j = await res.json();
    if(!j.ok) return el('loginMsg').innerText = j.message || 'Credenciais inválidas';
    saveAdminToken(j.token);
    el('loginMsg').innerText = 'Login admin realizado! Acessando painel...';
    setTimeout(()=> location.href = 'admin.html', 700);
  }catch(e){ el('loginMsg').innerText = 'Erro de rede'; }
});

// ---------- Load mentoria info ----------
async function loadMentoriaInfo(){
  try{
    const res = await fetch(API + '/mentoria/info');
    const j = await res.json();
    el('mTitulo') && (el('mTitulo').innerText = j.titulo);
    el('mDescricao') && (el('mDescricao').innerText = j.descricao);
    if (el('mBeneficios')) {
      el('mBeneficios').innerHTML = '';
      j.beneficios.forEach(b => { const li = document.createElement('li'); li.innerText = b; el('mBeneficios').appendChild(li); });
    }
  }catch(e){ console.error(e); }
}
loadMentoriaInfo();

// ---------- ASSINAR (usuário) ----------
el('btnAssinar')?.addEventListener('click', async () => {
  const token = getUserToken();
  if(!token) return alert('Faça login para assinar (usuário de teste: marcos / marcosteste)');
  // protótipo: registramos solicitação; admin ativa manualmente via /admin/usuarios/:username/assinatura
  try{
    const res = await fetch(API + '/api/assinar/solicitar', { method:'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }});
    const j = await res.json();
    if(j.ok) alert('Solicitação enviada. O admin ativará sua assinatura.');
    else alert('Erro: ' + (j.message || ''));
  }catch(e){ alert('Erro de rede'); }
});

// também botão para solicitar sem pagar
el('btnSolicitarAssinatura')?.addEventListener('click', async () => {
  const token = getUserToken();
  if(!token) return alert('Faça login para solicitar assinatura.');
  try{
    const res = await fetch(API + '/api/assinar/solicitar', { method:'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }});
    const j = await res.json();
    if(j.ok) alert('Solicitação enviada. Aguarde ativação pelo admin.');
  }catch(e){ alert('Erro'); }
});

// ---------- DASHBOARD (usuário) ----------
async function loadDashboard(){
  const token = getUserToken();
  if(!token){ setUserLabel('Visitante'); el('meInfo') && (el('meInfo').innerText = 'Faça login para ver seu painel.'); return; }
  try{
    const r = await fetch(API + '/api/me', { headers: { 'Authorization': 'Bearer ' + token }});
    if(!r.ok) { setUserLabel('Visitante'); el('meInfo') && (el('meInfo').innerText = 'Erro ao recuperar dados'); return; }
    const me = await r.json();
    setUserLabel(me.nome || me.username);
    el('btnLogout') && (el('btnLogout').style.display = 'inline-block');
    el('meInfo') && (el('meInfo').innerHTML = `<b>${me.nome || me.username}</b> — Assinatura: ${me.assinatura}`);
    // agendamentos
    const r2 = await fetch(API + '/api/agendamentos/me', { headers: { 'Authorization': 'Bearer ' + token }});
    const ags = await r2.json();
    const ul = el('myAgendamentos'); ul.innerHTML = '';
    if(!ags || ags.length === 0) ul.innerHTML = '<li>Nenhum agendamento</li>';
    else ags.forEach(a => { const li = document.createElement('li'); li.innerText = `${a.inicio} — ${a.mentor || ''}`; ul.appendChild(li); });
    // materiais
    const r3 = await fetch(API + '/api/materiais', { headers: { 'Authorization': 'Bearer ' + token }});
    const mats = await r3.json();
    const um = el('myMateriais'); um.innerHTML = '';
    if(!mats || mats.length === 0) um.innerHTML = '<li>Sem materiais disponíveis</li>';
    else mats.forEach(m => { const li = document.createElement('li'); li.innerHTML = `<b>${m.titulo}</b> — <a href="${m.link}" target="_blank" class="btn small">Abrir</a>`; um.appendChild(li); });
  }catch(e){ console.error(e); }
}
if (location.pathname.endsWith('dashboard.html')) loadDashboard();

// logout (salva token e limpa)
el('btnLogout')?.addEventListener('click', () => {
  localStorage.removeItem('user_token');
  setUserLabel('Visitante');
  el('btnLogout').style.display = 'none';
  location.href = 'index.html';
});

// agendar via painel
el('fAgendar')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = getUserToken();
  if(!token) return alert('Faça login');
  const data = el('fData').value;
  const hora = el('fHora').value;
  const mentor = el('fMentor').value.trim() || 'João Silva';
  if(!data || !hora) return alert('Preencha data e hora');
  const inicio = `${data}T${hora}`;
  try{
    const res = await fetch(API + '/api/agendar', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + token }, body: JSON.stringify({ inicio, mentor })});
    const j = await res.json();
    if(j.ok) { el('panelMsg').innerText = 'Agendado com sucesso'; loadDashboard(); } else el('panelMsg').innerText = 'Erro ao agendar';
  }catch(e){ el('panelMsg').innerText = 'Erro de rede'; }
});

// ---------- ON LOAD (UI) ----------
(function init(){
  const token = getUserToken();
  if(token) {
    fetch(API + '/api/me', { headers: { 'Authorization': 'Bearer ' + token }})
      .then(r => r.json()).then(j => { if(j && j.nome) setUserLabel(j.nome); });
  } else {
    setUserLabel('Visitante');
  }
})();
