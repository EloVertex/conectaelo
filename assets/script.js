// Redirecionar para qualquer página
function redirecionar(destino) {
  window.location.href = destino;
}

// Função de login
function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();

  const usuarioCorreto = "admin";
  const senhaCorreta = "1234";

  if (usuario === usuarioCorreto && senha === senhaCorreta) {
    redirecionar("dashboard.html");
  } else {
    alert("Usuário ou senha inválidos.");
  }
}

// Intercepta o submit do formulário
document.getElementById("form-login").addEventListener("submit", function(e) {
  e.preventDefault();
  login();
});

// Função para copiar chave PIX
function copiarPIX() {
  const pix = "chavepix@elovertex.org";
  navigator.clipboard.writeText(pix)
    .then(() => alert("Chave PIX copiada!"))
    .catch(() => alert("Erro ao copiar a chave PIX."));
}
const chatContainer = document.getElementById("chatbot-container");
const messagesDiv = document.getElementById("chatbot-messages");
const input = document.getElementById("chatbot-input");

// Abre ou fecha o chat
function toggleChat() {
  const btn = document.getElementById("chatbot-button");

  if (chatContainer.classList.contains("hidden")) {
    chatContainer.classList.remove("hidden");
    btn.innerHTML = "✖"; // botão de fechar
  } else {
    chatContainer.classList.add("hidden");
    btn.innerHTML = "💬"; // volta pro ícone de chat
  }
}
// Envia mensagem do usuário e gera resposta automática
function sendMessage() {
  const userMsg = input.value.trim();
  if (userMsg === "") return;

  addMessage("Você", userMsg);
  input.value = "";

  const botReply = getBotResponse(userMsg.toLowerCase());
  setTimeout(() => addMessage("Conecta Elo", botReply), 600);
}

// Adiciona mensagem no chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Respostas simples
function getBotResponse(msg) {
  if (msg.includes("teste")) {
    return "Você pode acessar o Teste Vocacional clicando na aba 'Teste' do painel.";
  } else if (msg.includes("trilhas")) {
    return "As Trilhas de Cursos estão disponíveis na aba 'Trilhas' com certificados ao final.";
  } else if (msg.includes("certificado")) {
    return "Você ganha certificados ao concluir mentorias ou trilhas de cursos.";
  } else if (msg.includes("vagas")) {
    return "Na aba 'Vagas Reais' você encontra oportunidades personalizadas.";
  } else if (msg.includes("quem é você") || msg.includes("conecta elo")) {
    return "Somos uma plataforma que ajuda jovens a encontrar sua vocação com testes, cursos e mentorias!";
  } else {
    return "Desculpe, ainda estou aprendendo. Tente reformular sua pergunta!";
  }
}
