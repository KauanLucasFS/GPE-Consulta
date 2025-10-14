let produtos = []; // dados brutos
let produtosFiltrados = []; // dados exibidos

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('cd1.json');
    produtos = await response.json();

    // Exibir JSON bruto se quiser
    const saida = document.getElementById('saidaJson');
    if (saida) saida.textContent = JSON.stringify(produtos, null, 2);

    // Assim que carregar, renderiza os produtos
    renderProdutos(produtos);
  } catch (erro) {
    console.error('❌ Erro ao carregar o JSON:', erro);
  }

  // Filtro de busca
  const inputBusca = document.getElementById('searchInput');
  if (inputBusca) {
    inputBusca.addEventListener('input', e => {
      const termo = e.target.value.toLowerCase();
      produtosFiltrados = produtos.filter(p =>
        (p.desc_curta?.toLowerCase() || '').includes(termo) ||
        (p.desc_longa?.toLowerCase() || '').includes(termo) || // 🔹 adiciona a busca pela descrição longa
        (p.id_item?.toLowerCase() || '').includes(termo)
      );
      renderProdutos(produtosFiltrados);
    });
  }

  // Menu inferior
  document.querySelector('.menu-bottom').innerHTML = `
    <a id="menuEstoque" class="active" title="Estoque" href="index.html">
      <img src="src/img/Home_Fill.png" alt="imagem-home">
    </a>
  `;
});

function adicionarAoCarrinho(sku, nome, id) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const itemExistente = carrinho.find(item => item.id === id);

  if (itemExistente) {
    itemExistente.qtd += 1;
  } else {
    carrinho.push({ id, sku, nome, qtd: 1 });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  alert(`${nome.trim()} adicionado ao carrinho!`);
}

function renderProdutos(lista) {
  const main = document.querySelector('main');
  if (!main) return;

  if (lista.length === 0) {
    main.innerHTML = `<p style="text-align:center; color:#888;">Nenhum produto encontrado.</p>`;
    return;
  }

  main.innerHTML = `
    <section class="grid-produtos">
      ${lista.map(prod => `
        <article class="produto-card">
          <div class="produto-info">
            <h3>${(prod.desc_curta || '').trim()}</h3>
            <p class="produto-id">SKU: ${prod.id_item}</p>
            <p class="produto-unid">Unidade: ${(prod.unid_pec || '').trim()}</p>
          </div>
          <button class="btn-add" onclick="adicionarAoCarrinho('${prod.id_item}', '${(prod.desc_curta || '').trim()}', '${prod.id_item}')">
            Adicionar +
          </button>
        </article>
      `).join('')}
    </section>
  `;
}
