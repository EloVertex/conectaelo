// backend/server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { requireUser, requireAdmin, signTokenForUser, signTokenForAdmin } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());

// DB file
const DB_FILE = path.join(process.cwd(), 'backend', 'users.json');

// helpers DB
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], admins: [], agendamentos: [], materiais: [], chat: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ------------------- AUTH ------------------- */
/**
 * POST /auth/login
 * body: { username, password }
 * returns: { ok, token, user }
 */
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDB();
  const user = (db.users || []).find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ ok: false, message: 'Credenciais inválidas' });
  const token = signTokenForUser(username);
  return res.json({ ok: true, token, user: { username: user.username, nome: user.nome, assinatura: user.assinatura } });
});

/**
 * POST /auth/admin-login
 * body: { username, password }
 */
app.post('/auth/admin-login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDB();
  const admin = (db.admins || []).find(a => a.username === username && a.password === password);
  if (!admin) return res.status(401).json({ ok: false, message: 'Credenciais admin inválidas' });
  const token = signTokenForAdmin(username);
  return res.json({ ok: true, token, admin: { username: admin.username, nome: admin.nome } });
});

/* ------------------- PUBLIC ------------------- */
// info da mentoria
app.get('/mentoria/info', (req, res) => {
  res.json({
    titulo: 'Mentoria Premium Elo Vertex',
    descricao: 'Orientação profissional, teste vocacional inteligente, acompanhamento individual, materiais exclusivos e indicações de cursos.',
    beneficios: [
      'Sessões 1:1 com mentores experientes',
      'Materiais exclusivos e templates',
      'Apoio para ENEM e vestibulares',
      'Mapeamento de cursos e bolsas',
      'Acompanhamento mensal'
    ],
    preco: 'R$ 19,90 / mês (exemplo)'
  });
});

/* ------------------- USER ROUTES (requer token user) ------------------- */

// criar agendamento
app.post('/api/agendar', requireUser, (req, res) => {
  const db = readDB();
  const { inicio, mentor } = req.body;
  const ag = { id: 'a' + Date.now(), username: req.user.username, nome: req.user.nome, inicio, mentor, criadoEm: new Date().toISOString() };
  db.agendamentos = db.agendamentos || [];
  db.agendamentos.push(ag);
  writeDB(db);
  res.json({ ok: true, agendamento: ag });
});

// listar agendamentos do usuário
app.get('/api/agendamentos/me', requireUser, (req, res) => {
  const db = readDB();
  const list = (db.agendamentos || []).filter(a => a.username === req.user.username);
  res.json(list);
});

// listar materiais (se premium, devolve todos)
app.get('/api/materiais', requireUser, (req, res) => {
  const db = readDB();
  if (req.user.assinatura === 'premium') return res.json(db.materiais || []);
  // não premium => só materiais não premium
  return res.json((db.materiais || []).filter(m => !m.premium));
});

// ver dados do usuário
app.get('/api/me', requireUser, (req, res) => {
  res.json({ username: req.user.username, nome: req.user.nome, assinatura: req.user.assinatura });
});

// solicitar assinatura (usuário pede; admin ativa)
app.post('/api/assinar/solicitar', requireUser, (req, res) => {
  // nesse protótipo apenas registra o pedido em DB (admin verifica e ativa manualmente)
  const db = readDB();
  db.assinaturaPedidos = db.assinaturaPedidos || [];
  db.assinaturaPedidos.push({ username: req.user.username, solicitadoEm: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true, message: 'Solicitação de assinatura registrada. Aguarde ativação pelo admin.' });
});

/* ------------------- ADMIN ROUTES (requer admin token) ------------------- */

// listar agendamentos (admin)
app.get('/admin/agendamentos', requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.agendamentos || []);
});

// criar material (admin)
app.post('/admin/materiais', requireAdmin, (req, res) => {
  const db = readDB();
  db.materiais = db.materiais || [];
  const id = 'm' + Date.now();
  const item = { id, ...req.body, criadoEm: new Date().toISOString() };
  db.materiais.push(item);
  writeDB(db);
  res.json({ ok: true, id });
});

// ativar assinatura de um usuário (admin)
app.post('/admin/usuarios/:username/assinatura', requireAdmin, (req, res) => {
  const db = readDB();
  const { username } = req.params;
  const { status } = req.body;
  const u = (db.users || []).find(us => us.username === username);
  if (!u) return res.status(404).json({ ok: false, message: 'Usuário não encontrado' });
  u.assinatura = status;
  writeDB(db);
  res.json({ ok: true, username, assinatura: u.assinatura });
});

// enviar mensagem no chat (admin para aluno)
app.post('/admin/chat/send', requireAdmin, (req, res) => {
  const db = readDB();
  const { targetUsername, mensagem } = req.body;
  db.chat = db.chat || [];
  db.chat.push({ from: 'Mentor', to: targetUsername || null, mensagem, criadoEm: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true });
});

/* ------------------- CHAT (usuário) ------------------- */

// usuário envia mensagem (pública ou privada via target)
app.post('/api/chat', requireUser, (req, res) => {
  const db = readDB();
  db.chat = db.chat || [];
  db.chat.push({ from: req.user.username, to: req.body.to || null, mensagem: req.body.mensagem, criadoEm: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true });
});

// listar chat visível para user (públicas + dirigidas ao user + do próprio)
app.get('/api/chat', requireUser, (req, res) => {
  const db = readDB();
  const chat = db.chat || [];
  const visible = chat.filter(m => !m.to || m.to === req.user.username || m.from === req.user.username);
  res.json(visible);
});

/* ------------------- UTIL ------------------- */

// rota pública para listar pedidos de assinatura (admin)
app.get('/admin/assinaturas/pedidos', requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.assinaturaPedidos || []);
});

/* ------------------- START ------------------- */
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});

