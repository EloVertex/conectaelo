// cadastro.js
import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.getElementById("cadastroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  if (!email || !senha || !nome) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Conta criada com sucesso!");
    window.location.href = "dashboard.html"; // redireciona ao painel
  } catch (error) {
    console.error("Erro ao criar conta:", error.message);
    alert("Erro ao criar conta. Verifique os dados e tente novamente.");
  }
});


