// index.js - versão final de busca + filtro por unid_pec

let produtos = [];
let produtosFiltrados = [];

// Função pra normalizar strings (remove acentos, espaços e deixa tudo minúsculo)
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
    const response = await fetch("cd1.json");
    produtos = await response.json();

    gerarFiltroUnidades(produtos);
    renderProdutos(produtos);
  } catch (erro) {
    console.error("❌ Erro ao carregar o JSON:", erro);
    document.querySelector("main").innerHTML =
      `<p style="text-align:center;color:#900;">Erro ao carregar dados.</p>`;
  }

  document.getElementById("searchInput")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtroUnid")?.addEventListener("change", aplicarFiltros);

});

// Aplica busca e filtro
function aplicarFiltros() {
  const termo = normalizeStr(document.getElementById("searchInput")?.value || "");
  const tokens = termo.split(/\s+/).filter(Boolean);

  const unidSelecionada = normalizeStr(document.getElementById("filtroUnid")?.value || "todas");

  produtosFiltrados = produtos.filter(p => {
    const searchable = [
      p.id_item ?? "",
      p.desc_curta ?? "",
      p.desc_longa ?? "",
      p.unid_pec ?? ""
    ].map(normalizeStr).join(" ");

    const tokensMatch = tokens.every(t => searchable.includes(t));
    const unidProduto = normalizeStr(p.unid_pec);
    const unidMatch = unidSelecionada === "todas" || unidProduto === unidSelecionada;

    return tokensMatch && unidMatch;
  });

  renderProdutos(produtosFiltrados);
}

// Cria o dropdown de unidades automaticamente
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

// Renderiza os produtos na tela
function renderProdutos(lista) {
  const main = document.querySelector("main");
  if (!main) return;

  if (!Array.isArray(lista) || lista.length === 0) {
    main.innerHTML = `<p style="text-align:center; color:#888;">Nenhum produto encontrado.</p>`;
    return;
  }

  main.innerHTML = `
    <section class="grid-produtos">
      ${lista.map(prod => {
        const descCurta = prod.desc_curta?.trim() || "";
        const descLonga = prod.desc_longa?.trim() || "";
        const sku = prod.id_item ?? "";
        const unid = prod.unid_pec?.trim() || "";

        return `
          <article class="produto-card">
            <div class="produto-info">
              <h3>${escapeHtml(descCurta)}</h3>
              ${descLonga ? `<p class="desc-longa">${escapeHtml(descLonga)}</p>` : ""}
              <p class="produto-id"><strong>SKU:</strong> ${escapeHtml(String(sku))}</p>
              <p class="produto-unid"><strong>Unidade:</strong> ${escapeHtml(unid)}</p>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

// Protege contra caracteres especiais do JSON
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
