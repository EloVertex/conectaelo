import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import webpush from 'web-push';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const SUBS_FILE = path.join(DATA_DIR, 'subs.json');
const LAST_FILE = path.join(DATA_DIR, 'lastSeen.json');

// Configurações fixas
const PORT = process.env.PORT || 3000;

// 🔹 Chaves VAPID fixas (removendo "=" do final, formato URL Safe)
const VAPID_PUBLIC = 'BBXUP9KMTkkEaHc20fsMrBMCe5bbmY5KHyOHNvV2dlTHVjZlB5cAB-LHMYre_PqZpvxjhkufd6weQDnHAQn4HTg';
const VAPID_PRIVATE = '-bQa6tMPdyv-L61X329hW9uC6dGJ6ySBYxSyojoh7jA';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// Configuração do Web Push
webpush.setVapidDetails('mailto:contato@elo-vertex.local', VAPID_PUBLIC, VAPID_PRIVATE);
console.log('VAPID configurado com sucesso');

// Funções auxiliares para salvar/ler arquivos
function loadSubs() {
  try { return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8') || '[]'); } catch (e) { return []; }
}
function saveSubs(arr) { fs.writeFileSync(SUBS_FILE, JSON.stringify(arr, null, 2)); }

function loadLast() {
  try { return JSON.parse(fs.readFileSync(LAST_FILE, 'utf8') || '{}'); } catch (e) { return {}; }
}
function saveLast(obj) { fs.writeFileSync(LAST_FILE, JSON.stringify(obj, null, 2)); }

// Configuração opcional de e-mail
let transporter = null;
if (SMTP_HOST && SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  console.log('SMTP configurado');
} else {
  console.log('SMTP não configurado (emails desativados)');
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rota para concursos por UF
app.get('/api/concursos/:uf', async (req, res) => {
  const uf = req.params.uf;
  try {
    const apiUrl = `https://concursos-api.deno.dev/${uf}`;
    const r = await fetch(apiUrl);
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar API externa' });
  }
});

// Assinar notificações
app.post('/api/subscribe', (req, res) => {
  const { subscription, filters } = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).send('Invalid subscription');
  const subs = loadSubs();
  if (!subs.find(s => s.subscription.endpoint === subscription.endpoint)) {
    subs.push({ subscription, filters: filters || {} });
    saveSubs(subs);
    console.log('Nova inscrição salva:', subscription.endpoint);
  }
  res.json({ ok: true });
});

// Cancelar inscrição
app.post('/api/unsubscribe', (req, res) => {
  const endpoint = req.body.endpoint;
  if (!endpoint) return res.status(400).send('missing endpoint');
  let subs = loadSubs();
  subs = subs.filter(s => s.subscription.endpoint !== endpoint);
  saveSubs(subs);
  res.json({ ok: true });
});

// Teste manual de envio
app.post('/api/trigger', async (req, res) => {
  try {
    const uf = req.body.uf || null;
    const result = await checkAndNotify(uf);
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Intervalo de verificação
const POLL_MINUTES = parseInt(process.env.POLL_MINUTES || '10');
setInterval(() => {
  checkAndNotify().catch(err => console.error('Erro no polling', err));
}, Math.max(1, POLL_MINUTES) * 60 * 1000);

// Verificação inicial
checkAndNotify().catch(() => { });

// Função de verificação e envio
async function checkAndNotify(onlyUf = null) {
  const last = loadLast();
  const subs = loadSubs();
  const ufsToCheck = onlyUf ? [onlyUf] : ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to'];
  const newItems = [];

  for (const uf of ufsToCheck) {
    try {
      const r = await fetch(`https://concursos-api.deno.dev/${uf}`);
      if (!r.ok) continue;
      const j = await r.json();
      const arr = j.concursos_abertos || [];
      for (const c of arr) {
        const key = (c.link || c.id || (c.Órgão + c.localidade)).toString();
        if (!last[key]) {
          last[key] = { seenAt: Date.now(), uf };
          newItems.push({ key, item: c, uf });
        }
      }
    } catch (e) { console.warn('Erro ao buscar', uf, e); }
  }

  saveLast(last);

  if (newItems.length === 0) return { new: 0 };

  for (const s of subs) {
    const subFilters = s.filters || {};
    const sub = s.subscription;
    for (const ni of newItems) {
      if (subFilters.uf && subFilters.uf !== ni.uf) continue;
      const payload = JSON.stringify({
        title: `${ni.item.Órgão || 'Novo concurso'}`,
        body: `${ni.item['Cargo'] || ni.item['Descrição'] || ''} — ${ni.item.localidade || ''}`,
        url: ni.item.link || '/'
      });
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Erro no push, removendo inscrição se inválida', err.statusCode || err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          let subsAll = loadSubs();
          subsAll = subsAll.filter(x => x.subscription.endpoint !== sub.endpoint);
          saveSubs(subsAll);
        }
      }
    }
  }

  if (transporter && ADMIN_EMAIL) {
    try {
      const html = newItems.slice(0, 10).map(n => `<li><a href="${n.item.link}">${n.item.Órgão} — ${n.item.localidade}</a></li>`).join('');
      await transporter.sendMail({
        from: SMTP_USER,
        to: ADMIN_EMAIL,
        subject: `Novos concursos: ${newItems.length}`,
        html: `<p>Foram encontrados ${newItems.length} novos concursos:</p><ul>${html}</ul>`
      });
    } catch (e) { console.error('Erro ao enviar e-mail', e); }
  }

  return { new: newItems.length };
}

app.listen(PORT, () => console.log('Backend rodando na porta', PORT));
