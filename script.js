/* ==========================================================
   TORQUE CERTO AUTO CENTER — script.js
   Tudo é salvo no localStorage (exigência da atividade).
   ========================================================== */

/* ---------- 1. DADOS ----------
   Cada produto/serviço é um objeto dentro de uma lista (array).
   O HTML dos cards é gerado a partir dela, então para adicionar
   um item novo basta incluir uma linha aqui.
   (Cada linha precisa terminar com "}," — vírgula e chave fechada!) */
const PRODUTOS = [
    { id: 1,  categoria: "carros",   nome: "Câmbio manual / Cx de marcha Chevrolet Vectra 2.0 1998", imagem: "" },
    { id: 2,  categoria: "carros",   nome: "Peças para carro",                imagem: "" },
    { id: 3,  categoria: "carros",   nome: "Troca de óleo",                   imagem: "" },
    { id: 4,  categoria: "motos",    nome: "Amortecedor CG Titan Fan 150 (par)", imagem: "" },
    { id: 5,  categoria: "motos",    nome: "Peças para moto",                 imagem: "" },

    // Serviços do PDF (seção 2.2)
    { id: 6,  categoria: "servicos", nome: "Revisão preventiva",              imagem: "" },
    { id: 7,  categoria: "servicos", nome: "Freios",                          imagem: "" },
    { id: 8,  categoria: "servicos", nome: "Suspensão e direção",             imagem: "" },
    { id: 9,  categoria: "servicos", nome: "Alinhamento e balanceamento",     imagem: "" },
    { id: 10, categoria: "servicos", nome: "Elétrica e injeção",              imagem: "" },
    { id: 11, categoria: "servicos", nome: "Motor e câmbio",                  imagem: "" },
];

// [chave usada em "categoria", título mostrado na tela]
const SECOES = [
    ["carros", "Carros"],
    ["motos", "Motos"],
    ["servicos", "Serviços"],
];

/* ---------- 2. FUNÇÕES DO localStorage ----------
   O localStorage só guarda texto, por isso usamos
   JSON.stringify (objeto -> texto) e JSON.parse (texto -> objeto). */
function ler(chave, padrao) {
    try {
        const valor = JSON.parse(localStorage.getItem(chave));
        return valor ?? padrao; // se não existir, usa o valor padrão
    } catch {
        return padrao;
    }
}
function salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

/* ---------- 3. ESTADO (o que muda enquanto o site é usado) ---------- */
let abaAtual = "geral";
let carrinho = ler("tc_carrinho", []);  // [{ id, qtd }]
let usuarios = ler("tc_usuarios", []);  // [{ nome, telefone, senha }]
let sessao = ler("tc_sessao", null);    // usuário logado ou null

/* ---------- 4. ELEMENTOS DA PÁGINA ---------- */
const catalogo = document.getElementById("catalogo");
const campoBusca = document.getElementById("busca");
const qtdCarrinho = document.getElementById("qtd-carrinho");
const btnEntrar = document.getElementById("btn-entrar");
const modalConta = document.getElementById("modal-conta");

/* ---------- 5. CATÁLOGO ---------- */
function cardHTML(p) {
    // Se a imagem não carregar, ela some e aparece o fundo com engrenagem do CSS
    const foto = p.imagem ? `<img src="${p.imagem}" alt="" onerror="this.remove()">` : "";
    return `<button class="card" data-id="${p.id}" title="Adicionar ao carrinho">
        <span class="foto">${foto}</span>
        <span class="nome">${p.nome}</span>
    </button>`;
}

function renderizar() {
    const termo = campoBusca.value.trim().toLowerCase();

    // Na aba "Geral" mostra todas as seções; nas outras, só a escolhida
    const secoes = SECOES.filter(([cat]) => abaAtual === "geral" || abaAtual === cat);

    const html = secoes
        .map(([cat, titulo]) => {
            const itens = PRODUTOS.filter(
                (p) => p.categoria === cat && p.nome.toLowerCase().includes(termo)
            );
            if (itens.length === 0) return "";
            return `<section>
                <h2 class="secao-titulo">${titulo}</h2>
                <div class="grade">${itens.map(cardHTML).join("")}</div>
            </section>`;
        })
        .join("");

    catalogo.innerHTML = html || `<p class="vazio">Nenhum item encontrado.</p>`;
}

// Troca de aba
document.querySelector(".abas-links").addEventListener("click", (e) => {
    const botao = e.target.closest(".aba");
    if (!botao) return;
    abaAtual = botao.dataset.aba;
    document.querySelectorAll(".aba").forEach((b) => b.classList.toggle("ativa", b === botao));
    renderizar();
});

// Pesquisa: filtra enquanto digita
campoBusca.addEventListener("input", renderizar);

/* ---------- 6. CARRINHO ----------
   Os cards são criados pelo JS, então usamos "delegação de eventos":
   um único listener no catálogo descobre qual card foi clicado. */
catalogo.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    adicionarAoCarrinho(Number(card.dataset.id));
});

function adicionarAoCarrinho(id) {
    const item = carrinho.find((i) => i.id === id);
    if (item) item.qtd++;
    else carrinho.push({ id, qtd: 1 });
    salvar("tc_carrinho", carrinho);
    atualizarContador();
}

function atualizarContador() {
    qtdCarrinho.textContent = carrinho.reduce((total, i) => total + i.qtd, 0);
}

/* ---------- 7. CONTA (login e cadastro) ---------- */
const soDigitos = (texto) => texto.replace(/\D/g, ""); // "(55) 9 1234" -> "5591234"

function atualizarConta() {
    btnEntrar.textContent = sessao ? `Olá, ${sessao.nome.split(" ")[0]}` : "Entrar";
}

function mostrarPainel(nome) {
    document.querySelectorAll(".modal-aba").forEach((b) => b.classList.toggle("ativa", b.dataset.painel === nome));
    document.querySelectorAll(".painel").forEach((p) => (p.hidden = p.dataset.painel !== nome));
}

btnEntrar.addEventListener("click", () => {
    if (sessao) {
        if (confirm("Deseja sair da conta?")) {
            sessao = null;
            localStorage.removeItem("tc_sessao");
            atualizarConta();
        }
        return;
    }
    mostrarPainel("entrar");
    modalConta.showModal(); // abre o <dialog>
});

modalConta.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) modalConta.close();
    const aba = e.target.closest(".modal-aba");
    if (aba) mostrarPainel(aba.dataset.painel);
});

function entrar(usuario) {
    sessao = { nome: usuario.nome, telefone: usuario.telefone };
    salvar("tc_sessao", sessao);
    atualizarConta();
    modalConta.close();
}

document.getElementById("form-criar").addEventListener("submit", (e) => {
    e.preventDefault(); // impede a página de recarregar
    const dados = new FormData(e.target);
    const telefone = soDigitos(dados.get("telefone"));
    const erro = document.querySelector('[data-erro="criar"]');

    if (usuarios.some((u) => u.telefone === telefone)) {
        erro.textContent = "Este telefone já tem conta. Use a aba Entrar.";
        return;
    }
    const novo = { nome: dados.get("nome").trim(), telefone, senha: dados.get("senha") };
    usuarios.push(novo);
    salvar("tc_usuarios", usuarios);
    erro.textContent = "";
    e.target.reset();
    entrar(novo);
});

document.getElementById("form-entrar").addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = new FormData(e.target);
    const telefone = soDigitos(dados.get("telefone"));
    const usuario = usuarios.find((u) => u.telefone === telefone && u.senha === dados.get("senha"));
    const erro = document.querySelector('[data-erro="entrar"]');

    if (!usuario) {
        erro.textContent = "Telefone ou senha inválidos.";
        return;
    }
    erro.textContent = "";
    e.target.reset();
    entrar(usuario);
});

/* ---------- 8. INÍCIO ---------- */
renderizar();
atualizarContador();
atualizarConta();
