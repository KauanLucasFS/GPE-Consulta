// index.js - busca + filtro + paginação + unificação de JSONs
let produtos = [];
let produtosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 20;

// Normaliza strings
function normalizeStr(value) {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Carrega ambos os arquivos
    const [cd1Res, zmmRes] = await Promise.all([
      fetch("cd1.json"),
      fetch("zmm045.json")
    ]);

    const [cd1Data, zmmData] = await Promise.all([
      cd1Res.json(),
      zmmRes.json()
    ]);

    // Padroniza os dois formatos de JSON
    const padronizadosCd1 = cd1Data.map(p => ({
      id_item: p.id_item ?? "",
      desc_curta: p.desc_curta ?? "",
      desc_longa: p.desc_longa ?? "",
      unid_pec: p.unid_pec ?? "",
      origem: "cd1"
    }));

    const padronizadosZmm = zmmData.map(p => ({
      id_item: p.material?.trim() ?? "",
      desc_curta: p.descricao?.trim() ?? "",
      desc_longa: p.texto_completo?.trim() ?? "",
      unid_pec: "ZMM045", // define uma unidade padrão
      origem: "zmm045"
    }));

    // Junta tudo
    produtos = [...padronizadosCd1, ...padronizadosZmm];

    gerarFiltroUnidades(produtos);
    aplicarFiltros();
  } catch (erro) {
    console.error("❌ Erro ao carregar os arquivos:", erro);
    document.querySelector("main").innerHTML =
      `<p style="text-align:center;color:#900;">Erro ao carregar dados.</p>`;
  }

  document.getElementById("searchInput")?.addEventListener("input", () => {
    paginaAtual = 1;
    aplicarFiltros();
  });

  document.getElementById("filtroUnid")?.addEventListener("change", () => {
    paginaAtual = 1;
    aplicarFiltros();
  });
});

// Aplica busca e filtro
function aplicarFiltros() {
  const termo = normalizeStr(document.getElementById("searchInput")?.value || "");
  const tokens = termo.split(/\s+/).filter(Boolean);
  const unidSelecionada = normalizeStr(document.getElementById("filtroUnid")?.value || "todas");

  produtosFiltrados = produtos.filter(p => {
    const searchable = [
      p.id_item,
      p.desc_curta,
      p.desc_longa,
      p.unid_pec
    ].map(normalizeStr).join(" ");

    const tokensMatch = tokens.every(t => searchable.includes(t));
    const unidProduto = normalizeStr(p.unid_pec);
    const unidMatch = unidSelecionada === "todas" || unidProduto === unidSelecionada;

    return tokensMatch && unidMatch;
  });

  renderProdutos();
}

// Cria o dropdown de unidades
function gerarFiltroUnidades(lista) {
  const container = document.getElementById("filtroContainer");
  if (!container) return;

  const mapa = new Map();
  lista.forEach(p => {
    const raw = p.unid_pec ?? "";
    const norm = normalizeStr(raw);
    if (norm && !mapa.has(norm)) mapa.set(norm, raw.trim());
  });

  const unidades = Array.from(mapa.values()).sort();

  const select = document.createElement("select");
  select.id = "filtroUnid";

  select.innerHTML = `
    <option value="todas">Todas as Unidades</option>
    ${unidades.map(u => `<option value="${u}">${u}</option>`).join("")}
  `;

  container.innerHTML = "";
  container.appendChild(select);
  select.addEventListener("change", aplicarFiltros);
}

// Renderiza produtos e paginação
function renderProdutos() {
  const main = document.querySelector("main");
  if (!main) return;

  const lista = produtosFiltrados.length ? produtosFiltrados : produtos;

  if (!Array.isArray(lista) || lista.length === 0) {
    main.innerHTML = `<p style="text-align:center; color:#888;">Nenhum produto encontrado.</p>`;
    return;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = lista.slice(inicio, fim);

  main.innerHTML = `
    <section class="grid-produtos">
      ${pagina.map(prod => `
        <article class="produto-card">
          <div class="produto-info">
            <h3>${escapeHtml(prod.desc_curta)}</h3>
            ${prod.desc_longa ? `<p class="desc-longa">${escapeHtml(prod.desc_longa)}</p>` : ""}
            <p class="produto-id"><strong>SKU:</strong> ${escapeHtml(String(prod.id_item))}</p>
            <p class="produto-unid"><strong>Unidade:</strong> ${escapeHtml(prod.unid_pec)}</p>
            <p class="produto-origem"><em>Fonte: ${prod.origem.toUpperCase()}</em></p>
          </div>
        </article>
      `).join("")}
    </section>
  `;

  renderPaginacao(lista.length);
}

// Paginação
function renderPaginacao(totalItens) {
  let paginacaoContainer = document.getElementById("paginacao");

  if (!paginacaoContainer) {
    paginacaoContainer = document.createElement("div");
    paginacaoContainer.id = "paginacao";
    paginacaoContainer.style.textAlign = "center";
    paginacaoContainer.style.margin = "1.5rem 0";
    document.body.appendChild(paginacaoContainer);
  }

  const totalPaginas = Math.ceil(totalItens / itensPorPagina);

  const btnAnterior = `<button ${paginaAtual === 1 ? "disabled" : ""} onclick="mudarPagina(${paginaAtual - 1})">⬅ Anterior</button>`;
  const btnProxima = `<button ${paginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPagina(${paginaAtual + 1})">Próxima ➡</button>`;

  paginacaoContainer.innerHTML = `
    <div class="paginacao-botoes">
      ${btnAnterior}
      <span>Página ${paginaAtual} de ${totalPaginas}</span>
      ${btnProxima}
    </div>
  `;
}

function mudarPagina(novaPagina) {
  paginaAtual = novaPagina;
  renderProdutos();
}

// Protege contra caracteres especiais
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
