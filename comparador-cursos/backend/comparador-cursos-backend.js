/*
Comparador de Cursos - Backend (Node.js + Express)
Arquivo: comparador-cursos-backend.js
Descrição: API simples que recebe dois cursos, coleta dados (via APIs/serviços) e usa a OpenAI para gerar
uma análise comparativa estruturada com JSON.

Como usar:
1. Instale dependências: npm init -y && npm install express axios node-cache cors dotenv openai
2. Defina variáveis de ambiente no .env (veja abaixo).
3. Rode: node comparador-cursos-backend.js

Variáveis de ambiente necessárias (.env):
OPENAI_API_KEY=sk-...        # sua chave OpenAI
PORT=3001                   # opcional
CACHE_TTL=3600              # opcional (segundos)
*/

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');
const OpenAI = require('openai');    // <<< Importação necessária
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const cacheTTL = parseInt(process.env.CACHE_TTL || '3600', 10);
const cache = new NodeCache({ stdTTL: cacheTTL });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------- Helpers (exemplos) --------------------

async function fetchCourseDescriptionFromWikipedia(courseName) {
  try {
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(courseName)}`;
    const res = await axios.get(url, { timeout: 8000 });
    if (res.data && res.data.extract) return res.data.extract;
    return `Descrição não encontrada na Wikipédia para: ${courseName}`;
  } catch (err) {
    return `Descrição não encontrada (erro ao buscar Wikipédia).`;
  }
}

async function fetchUniversitiesOffering(courseName) {
  return [
    { name: 'Universidade Exemplo A', type: 'Presencial', city: 'Fortaleza', mensalidade_media: 800 },
    { name: 'Universidade Exemplo B', type: 'EAD', city: 'Brasília', mensalidade_media: 450 }
  ];
}

async function estimateTuition(courseName) {
  const map = {
    'Engenharia Civil': 1200,
    'Arquitetura': 1100
  };
  return map[courseName] || Math.round(600 + Math.random() * 1200);
}

async function fetchJobListings(courseName, limit = 10) {
  return Array.from({ length: limit }).map((_, i) => ({
    title: `${courseName} - Vaga ${i + 1}`,
    company: `Empresa ${['Alpha','Beta','Gama','Delta'][i % 4]}`,
    city: ['São Paulo','Recife','Fortaleza','Belo Horizonte'][i % 4],
    salary_estimate: Math.round(2000 + Math.random() * 7000),
    url: null
  }));
}

async function fetchEmployabilityStats(courseName) {
  return {
    employability_index: Math.round(40 + Math.random() * 60),
    average_salary: Math.round(2000 + Math.random() * 6000),
    growth_5y_pct: Math.round(-10 + Math.random() * 50)
  };
}

// -------------------- OpenAI integration --------------------

async function callOpenAIAnalyze(courseAData, courseBData) {
  const systemPrompt = `Você é um assistente especialista em educação e mercado de trabalho no Brasil. Compare dois cursos e gere uma análise objetiva e prática.`;

  const userPrompt = `
Compare os seguintes cursos detalhadamente:

CURSO A:
${JSON.stringify(courseAData, null, 2)}

CURSO B:
${JSON.stringify(courseBData, null, 2)}

Por favor, responda **em JSON** com as seguintes chaves:

{
  "diferencas": "Texto curto e claro sobre as diferenças principais entre os cursos",
  "empregabilidade": "Informações objetivas sobre a empregabilidade dos cursos",
  "sugestoes": "Sugestões práticas para quem está escolhendo entre esses cursos"
}

Apenas retorne o JSON, sem texto extra.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const text = response.choices[0].message.content;

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Resposta da OpenAI não é JSON válido:', text);
      return {
        diferencas: "Erro ao gerar diferenças.",
        empregabilidade: "Erro ao gerar dados de empregabilidade.",
        sugestoes: "Erro ao gerar sugestões."
      };
    }
  } catch (err) {
    console.error('Erro OpenAI:', err?.response?.data || err.message);
    throw new Error('Falha ao contatar OpenAI');
  }
}

// -------------------- Endpoint principal --------------------

app.get('/comparar', async (req, res) => {
  const curso1 = req.query.curso1 || req.query.course1;
  const curso2 = req.query.curso2 || req.query.course2;

  if (!curso1 || !curso2) return res.status(400).json({ error: 'Informe curso1 e curso2' });

  const cacheKey = `comparar:${curso1.toLowerCase()}::${curso2.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [desc1, desc2] = await Promise.all([
      fetchCourseDescriptionFromWikipedia(curso1),
      fetchCourseDescriptionFromWikipedia(curso2)
    ]);

    const [unis1, unis2] = await Promise.all([
      fetchUniversitiesOffering(curso1),
      fetchUniversitiesOffering(curso2)
    ]);

    const [mens1, mens2] = await Promise.all([
      estimateTuition(curso1),
      estimateTuition(curso2)
    ]);

    const [jobs1, jobs2, stats1, stats2] = await Promise.all([
      fetchJobListings(curso1, 5),
      fetchJobListings(curso2, 5),
      fetchEmployabilityStats(curso1),
      fetchEmployabilityStats(curso2)
    ]);

    const courseAData = {
      name: curso1,
      descricao: desc1,
      universidades: unis1,
      mensalidade_media: mens1,
      jobs: jobs1,
      stats: stats1
    };

    const courseBData = {
      name: curso2,
      descricao: desc2,
      universidades: unis2,
      mensalidade_media: mens2,
      jobs: jobs2,
      stats: stats2
    };

    const analysis = await callOpenAIAnalyze(courseAData, courseBData);

    const responsePayload = {
      curso1: courseAData,
      curso2: courseBData,
      analise: analysis,
      generated_at: new Date().toISOString()
    };

    cache.set(cacheKey, responsePayload);
    return res.json(responsePayload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

// Healthcheck
app.get('/ping', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Comparador de Cursos rodando na porta ${PORT}`);
});
