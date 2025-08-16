const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

//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
const configuration = new Configuration({
  apiKey: 'SUA_CHAVE_OPENAI_AQUI',
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
