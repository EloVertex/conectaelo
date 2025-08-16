1) Pré-requisitos:
   - Node.js (>= 14). Recomendo Node 18+.
   - Terminal / cmd.

2) Estrutura:
   - frontend/  -> index.html, favorites.html, sw.js, styles.css
   - backend/   -> server.js, package.json, generate_vapid.js

3) Passos para rodar localmente:

# Backend
cd backend
npm install

# Gere as chaves VAPID (gera e imprime no terminal)
npm run gen-vapid
# Copie os valores impressos: VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY

# Configure variáveis de ambiente (exemplo Linux/macOS):
export VAPID_PUBLIC_KEY="SUA_PUBLICA_AQUI"
export VAPID_PRIVATE_KEY="SUA_PRIVADA_AQUI"
# (Opcional) SMTP para envio de emails (Nodemailer):
export SMTP_HOST="smtp.seuprovedor.com"
export SMTP_PORT="587"
export SMTP_USER="usuario@dominio"
export SMTP_PASS="senha"
export ADMIN_EMAIL="seu-email@dominio.com"

# Inicie o backend:
node server.js
# O backend vai servir a pasta frontend automaticamente: acesse http://localhost:3000/index.html

4) Frontend
- Abra http://localhost:3000/index.html no navegador.
- Selecione um UF (ex: sp) e clique Pesquisar para carregar concursos (dados da API pública).
- Clique "Ativar Alertas" para registrar Web Push (será solicitada permissão pelo navegador).
- Salve Favoritos e veja em favorites.html.

5) Testes
- Para forçar uma verificação e envio de notificações, POST para:
  http://localhost:3000/api/trigger
  (pode usar curl: curl -X POST http://localhost:3000/api/trigger)

6) Observações
- Web Push requer HTTPS em produção. Localmente, alguns navegadores permitem em localhost.
- Ajuste POLL_MINUTES via env se quiser checar mais ou menos frequentemente.
- O backend salva subscriptions em backend/data/subs.json e últimos itens vistos em backend/data/lastSeen.json.

7) Próximos passos (opcional):
- Integrar autenticação (Firebase Auth) para usuários;
- Salvar favoritos no backend para sincronização multi-device;
- Melhorar UI, adding modals, dark theme switch, e página admin para moderar alertas.


