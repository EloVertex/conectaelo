async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userMessage = input.value.trim();

  if (!userMessage) return;

  appendMessage("Você", userMessage, "user");
  input.value = "";
  input.disabled = true;

  appendMessage("Conecta Elo", "Pensando...", "bot");

  try {
    const response = await fetch('http://localhost:3000/perguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: userMessage })
    });

    const data = await response.json();
    removeLastBotMessage();
    appendMessage("Conecta Elo", data.resposta, "bot");
  } catch (error) {
    removeLastBotMessage();
    appendMessage("Conecta Elo", "Erro ao se conectar. Verifique o servidor.", "bot");
  }

  input.disabled = false;
}

function appendMessage(sender, text, className) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  messageDiv.textContent = `${sender}: ${text}`;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLastBotMessage() {
  const chatBox = document.getElementById("chat-box");
  const messages = chatBox.querySelectorAll(".message.bot");
  if (messages.length > 0) {
    chatBox.removeChild(messages[messages.length - 1]);
  }
}
function toggleChat() {
  if (chatContainer.classList.contains("hidden")) {
    chatContainer.classList.remove("hidden"); // abre
  } else {
    chatContainer.classList.add("hidden"); // fecha
  }
}
