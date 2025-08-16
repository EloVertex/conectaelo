const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: 'SUA_CHAVE_OPENAI_AQUI', // 🔑 Coloque aqui sua API Key
});
const openai = new OpenAIApi(configuration);

app.post('/perguntar', async (req, res) => {
  const pergunta = req.body.pergunta;

  try {
    const resposta = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: pergunta }],
    });

    const mensagem = resposta.data.choices[0].message.content;
    res.json({ resposta: mensagem });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao acessar a IA.' });
  }
});

app.listen(3000, () => {
  console.log('Servidor IA rodando em http://localhost:3000');
});

