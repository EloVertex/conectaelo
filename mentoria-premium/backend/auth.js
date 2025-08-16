// backend/auth.js
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const SECRET = process.env.JWT_SECRET || 'troque_por_uma_chave_secreta_mais_forte';

// leitura simples do users.json
const DB = path.join(process.cwd(), 'backend', 'users.json');
function readDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({ users: [], admins: [], agendamentos: [], materiais: [], chat: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

// middleware que valida token de usuário (user)
export function requireUser(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token) return res.status(401).json({ ok: false, message: 'Token ausente' });
  try {
    const payload = jwt.verify(token, SECRET);
    const db = readDB();
    const user = (db.users || []).find(u => u.username === payload.username);
    if (!user) return res.status(401).json({ ok: false, message: 'Usuário não encontrado' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}

// middleware que valida token admin
export const adminTokens = {}; // memória opcional para mapear tokens (não necessário aqui)

export function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token) return res.status(401).json({ ok: false, message: 'Token admin ausente' });
  try {
    const payload = jwt.verify(token, SECRET);
    const db = readDB();
    const admin = (db.admins || []).find(a => a.username === payload.username);
    if (!admin) return res.status(403).json({ ok: false, message: 'Admin não encontrado' });
    req.admin = admin;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}

export function signTokenForUser(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: '30d' }); // token com validade longa (salvo no localStorage)
}

export function signTokenForAdmin(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: '30d' });
}
