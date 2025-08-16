document.getElementById("btnComparar").addEventListener("click", async () => {
  const c1 = document.getElementById("curso1").value.trim();
  const c2 = document.getElementById("curso2").value.trim();

  if (!c1 || !c2) {
    alert("Preencha os dois cursos!");
    return;
  }

  document.getElementById("resultado").innerHTML = "<p>⏳ Analisando cursos...</p>";

  try {
    const res = await fetch(`http://localhost:3001/comparar?curso1=${encodeURIComponent(c1)}&curso2=${encodeURIComponent(c2)}`);
    const dados = await res.json();

    if (dados.error) {
      document.getElementById("resultado").innerHTML = `<p>❌ ${dados.error}</p>`;
      return;
    }

    const html = `
      <div class="card"><h3>${dados.curso1.name}</h3><p>${dados.curso1.descricao}</p></div>
      <div class="card"><h3>${dados.curso2.name}</h3><p>${dados.curso2.descricao}</p></div>
      <div class="card">
        <h3>📊 Diferenças</h3>
        <p>${dados.analise.diferencas || "Não disponível."}</p>
      </div>
      <div class="card">
        <h3>💼 Empregabilidade</h3>
        <p>${dados.analise.empregabilidade || "Não disponível."}</p>
      </div>
      <div class="card">
        <h3>🎯 Sugestões</h3>
        <p>${dados.analise.sugestoes || "Não disponível."}</p>
      </div>
    `;

    document.getElementById("resultado").innerHTML = html;
  } catch (err) {
    document.getElementById("resultado").innerHTML = `<p>❌ Erro: ${err.message}</p>`;
  }
});

// Exemplos para chamadas individuais para cada aba:

async function buscarEmpregabilidade() {
  const curso = prompt("Digite o nome do curso para ver a empregabilidade:");
  if (!curso) return alert("Curso obrigatório");
  const res = await fetch("http://localhost:3001/api/empregabilidade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ curso })
  });
  const data = await res.json();
  alert("Empregabilidade:\n" + data.resposta);
}

async function buscarDiferencas() {
  const cursoA = prompt("Curso A:");
  const cursoB = prompt("Curso B:");
  if (!cursoA || !cursoB) return alert("Informe os dois cursos");
  const res = await fetch("http://localhost:3001/api/diferencas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cursoA, cursoB })
  });
  const data = await res.json();
  alert("Diferenças:\n" + data.resposta);
}

async function buscarSugestoes() {
  const area = prompt("Informe a área de interesse:");
  if (!area) return alert("Área obrigatória");
  const res = await fetch("http://localhost:3001/api/sugestoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ area })
  });
  const data = await res.json();
  alert("Sugestões:\n" + data.resposta);
}
