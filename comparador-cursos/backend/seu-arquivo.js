require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function teste() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você é um assistente.' },
      { role: 'user', content: 'Diga olá' }
    ],
  });

  console.log(response.choices[0].message.content);
}

teste();
