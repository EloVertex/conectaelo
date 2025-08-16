const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rotas de exemplo do backend
// Você pode adicionar suas próprias rotas aqui (cadastro, cursos, etc.)

app.get('/', (req, res) => {
  res.send('Backend funcionando!'); // Teste inicial
});

// Exemplo de rota de cadastro de usuário
app.post('/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;
  // Aqui você faria lógica de salvar no banco de dados
  res.json({ mensagem: `Usuário ${nome} cadastrado com sucesso!` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
