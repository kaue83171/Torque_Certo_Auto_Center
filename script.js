/* ---------- 1. DADOS ----------
   min / max = faixa de preço da mão de obra (tabela 2.2 do PDF).
     - min e max iguais  -> preço fixo
     - max: null         -> "a partir de" (ex.: diagnóstico + serviço)
     - min: null         -> sem preço fixo, "sob consulta"                */
const PRODUTOS = [
    // Serviços (PDF, seção 2.2)
    { id: 1,  categoria: "servicos", nome: "Revisão preventiva",          imagem: "img/serv/serv-revisao.jpg",
      descricao: "Troca de óleo e filtros, inspeção de 25 itens e checklist por quilometragem.", tempo: "2 a 3 h", min: 150, max: 350 },
    { id: 2,  categoria: "servicos", nome: "Freios",                      imagem: "img/serv/serv-freio.png",
      descricao: "Troca de pastilhas, discos e fluido, com sangria do sistema.", tempo: "2 a 4 h", min: 120, max: 400 },
    { id: 3,  categoria: "servicos", nome: "Suspensão e direção",         imagem: "img/serv/serv-susp_dire.png",
      descricao: "Amortecedores, buchas, pivôs, terminais e barra estabilizadora.", tempo: "3 a 6 h", min: 200, max: 700 },
    { id: 4,  categoria: "servicos", nome: "Alinhamento e balanceamento", imagem: "img/serv/serv-alinha_balanc.png",
      descricao: "Serviço rápido, em pacote único.", tempo: "1 h", min: 120, max: 120 },
    { id: 5,  categoria: "servicos", nome: "Elétrica e injeção",          imagem: "img/serv/serv-eletr_inje.png",
      descricao: "Diagnóstico com scanner, bateria, alternador, velas e bicos. Diagnóstico R$ 80 + serviço.", tempo: "1 a 2 dias", min: 80, max: null },
    { id: 6,  categoria: "servicos", nome: "Motor e câmbio",              imagem: "img/serv/serv-motor_camb.png",
      descricao: "Correia dentada, junta do cabeçote, embreagem e retífica terceirizada.", tempo: "2 a 7 dias", min: 400, max: 2500 },
    { id: 7,  categoria: "servicos", nome: "Troca de óleo",               imagem: "img/serv/serv-troleo.png",
      descricao: "Valor confirmado no orçamento.", tempo: "", min: null, max: null },

    // Produtos (preço consultado no balcão)
    { id: 8,  categoria: "carros",   nome: "Câmbio manual / Cx de marcha Chevrolet Vectra 2.0 1998", imagem: "",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
    { id: 9,  categoria: "carros",   nome: "Turbocompressor Garrett GT2860RS (Disco Potato)",            imagem: "img/serv/turbocompressor.png",
      descricao: "Peças de reposição, lubrificantes, aditivos e acessórios.", tempo: "", min: null, max: null },
    { id: 10,  categoria: "carros",   nome: "Bloco de Motor Semifechado IAG / Subaru (EJ25)", imagem: "img/serv/bloco_de_motor.png",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
    { id: 11,  categoria: "carros",   nome: "Bielas Forjadas Eagle (Aço 4340 H-Beam)",            imagem: "img/serv/biela_forjada.png",
      descricao: "Peças de reposição, lubrificantes, aditivos e acessórios.", tempo: "", min: null, max: null },
    { id: 12,  categoria: "carros",   nome: "Pistões Forjados JE Pistons", imagem: "img/serv/pistoes_forjados.png",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
    { id: 13,  categoria: "carros",   nome: "Coletor de Admissão Skunk2 Pro Series",            imagem: "img/serv/coletor_de_admissao.png",
      descricao: "Peças de reposição, lubrificantes, aditivos e acessórios.", tempo: "", min: null, max: null },
    { id: 14,  categoria: "carros",   nome: "Comando de Válvulas Tomei Poncam (RB26DETT)", imagem: "img/serv/comando_de_valvulas.png",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
    { id: 15,  categoria: "carros",   nome: "Válvula Wastegate TiAL MVR (44mm)",            imagem: "img/serv/valvula_wastegate.png",
      descricao: "Peças de reposição, lubrificantes, aditivos e acessórios.", tempo: "", min: null, max: null },
    { id: 16, categoria: "motos",    nome: "Amortecedor CG Titan Fan 150 (par)", imagem: "",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
    { id: 17, categoria: "motos",    nome: "Peças para moto",             imagem: "",
      descricao: "Consulte disponibilidade e preço no balcão.", tempo: "", min: null, max: null },
];

// Nome que aparece na etiqueta do card, para cada categoria
const ROTULO = { carros: "Carro", motos: "Moto", servicos: "Serviço" };

const SECOES = [
    ["carros", "Carros"],
    ["motos", "Motos"],
    ["servicos", "Serviços"],
];

/* ----------  FUNÇÕES DO localStorage ----------
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

/* ---------- ESTADO  ---------- */
let abaAtual = "geral";
let usuarios = ler("tc_usuarios", []);  // [{ nome, telefone, senha }]
let sessao = ler("tc_sessao", null);    // usuário logado ou null

// Carrinho: [{ id, qtd }]. Descarta o que está corrompido ou que não existe mais na lista.
let carrinho = ler("tc_carrinho", []);
if (!Array.isArray(carrinho)) carrinho = [];
carrinho = carrinho.filter((i) => PRODUTOS.some((p) => p.id === i.id) && i.qtd > 0);

/* ---------- ELEMENTOS DA PÁGINA ---------- */
const catalogo = document.getElementById("catalogo");
const campoBusca = document.getElementById("busca");
const resultados = document.getElementById("resultados");
const qtdCarrinho = document.getElementById("qtd-carrinho");
const btnEntrar = document.getElementById("btn-entrar");
const btnAgenda = document.getElementById("btn-agenda");
const btnCarrinho = document.getElementById("btn-carrinho");
const modalConta = document.getElementById("modal-conta");
const modalCarrinho = document.getElementById("modal-carrinho");
const modalAgenda = document.getElementById("modal-agenda");
const itensCarrinho = document.getElementById("itens-carrinho");
const totalCarrinho = document.getElementById("total-carrinho");
const aviso = document.getElementById("aviso");

/* ---------- FUNÇÕES AUXILIARES ---------- */

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

// Texto do preço de UM produto
function textoPreco(p) {
    if (p.min == null) return "Sob consulta";
    if (p.max == null) return `A partir de ${brl(p.min)}`;
    if (p.min === p.max) return brl(p.min);
    return `${brl(p.min)} a ${brl(p.max)}`;
}

// Mensagem rápida que aparece embaixo da tela por 2,5 segundos
let temporizadorAviso;
function avisar(mensagem) {
    aviso.textContent = mensagem;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.textContent = ""), 2500);
}

/* ---------- CATÁLOGO ---------- */
const ICONE_FOTO = `<span class="foto-legenda">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>
    <span>Foto em breve</span></span>`;

function cardHTML(p) {
    // Peças ficam inteiras dentro do quadro ("conter"); fotos de serviço preenchem o quadro
    const classeFoto = p.categoria === "servicos" ? "foto" : "foto conter";
    const foto = p.imagem
        ? `<div class="${classeFoto}"><img src="${p.imagem}" alt="">`
        : `<div class="foto sem-foto">${ICONE_FOTO}`;
    const legenda = p.tempo ? `Mão de obra · ${p.tempo}` : p.categoria === "servicos" ? "Mão de obra" : "Preço";

    return `<article class="card">
        ${foto}<span class="card-etiqueta">${ROTULO[p.categoria]}</span></div>
        <div class="card-corpo">
            <h3 class="nome">${p.nome}</h3>
            <p class="card-descricao">${p.descricao}</p>
            <div class="card-rodape">
                <div><small>${legenda}</small><strong>${textoPreco(p)}</strong></div>
                <button type="button" class="adicionar" data-id="${p.id}" aria-label="Adicionar ${p.nome} ao carrinho">+</button>
            </div>
        </div>
    </article>`;
}

// Se a foto não carregar (arquivo ausente), troca pelo quadro "Foto em breve"
function tratarFotosQuebradas() {
    catalogo.querySelectorAll(".foto img").forEach((img) => {
        const semFoto = () => {
            const quadro = img.parentElement;
            quadro.classList.add("sem-foto");
            quadro.classList.remove("conter");
            img.outerHTML = ICONE_FOTO;
        };
        if (img.complete && img.naturalWidth === 0) semFoto();
        else img.addEventListener("error", semFoto, { once: true });
    });
}

function renderizar() {
    const termo = campoBusca.value.trim().toLowerCase();
    const itens = PRODUTOS.filter(
        (p) => (abaAtual === "geral" || p.categoria === abaAtual) && p.nome.toLowerCase().includes(termo)
    );
    catalogo.innerHTML = itens.length
        ? `<div class="grade">${itens.map(cardHTML).join("")}</div>`
        : `<p class="vazio">Nenhum item encontrado.</p>`;
    resultados.textContent = `${itens.length} ${itens.length === 1 ? "item" : "itens"}`;
    tratarFotosQuebradas();
}

// Troca de aba
document.querySelector(".abas-links").addEventListener("click", (e) => {
    const botao = e.target.closest(".aba");
    if (!botao) return;
    abaAtual = botao.dataset.aba;
    document.querySelectorAll(".aba").forEach((b) => {
        b.classList.toggle("ativa", b === botao);
        b.setAttribute("aria-pressed", b === botao);
    });
    renderizar();
});

// Pesquisa: filtra enquanto digita
campoBusca.addEventListener("input", renderizar);


/* ---------- . CARRINHO ----------
   Os cards são criados pelo JS, então usamos "delegação de eventos":
   um único listener no catálogo descobre qual botão "+" foi clicado. */
catalogo.addEventListener("click", (e) => {
    const botao = e.target.closest(".adicionar");
    if (!botao) return;
    adicionarAoCarrinho(Number(botao.dataset.id));
});

function guardarCarrinho() {
    salvar("tc_carrinho", carrinho);
    atualizarContador();
    renderCarrinho();
}

function adicionarAoCarrinho(id) {
    const item = carrinho.find((i) => i.id === id);
    if (item) item.qtd = Math.min(item.qtd + 1, 99);
    else carrinho.push({ id, qtd: 1 });
    guardarCarrinho();
    avisar(`${PRODUTOS.find((p) => p.id === id).nome} adicionado ao carrinho`);
}

// delta = +1 (aumentar) ou -1 (diminuir). Quando chega a 0, o item sai do carrinho.
function alterarQuantidade(id, delta) {
    const item = carrinho.find((i) => i.id === id);
    if (!item) return;
    item.qtd = Math.min(item.qtd + delta, 99);
    if (item.qtd <= 0) carrinho = carrinho.filter((i) => i.id !== id);
    guardarCarrinho();
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter((i) => i.id !== id);
    guardarCarrinho();
}

function atualizarContador() {
    qtdCarrinho.textContent = carrinho.reduce((total, i) => total + i.qtd, 0);
}

// Soma as faixas de preço de todos os itens e devolve o texto do total
function calcularTotal() {
    let min = 0, max = 0, temPreco = false, aberto = false, semPreco = false;
    for (const { id, qtd } of carrinho) {
        const p = PRODUTOS.find((x) => x.id === id);
        if (p.min == null) { semPreco = true; continue; }
        temPreco = true;
        min += p.min * qtd;
        if (p.max == null) aberto = true;   // sem teto: só dá para dizer "a partir de"
        else max += p.max * qtd;
    }
    let texto = "Sob consulta";
    if (temPreco) texto = aberto ? `A partir de ${brl(min)}` : min === max ? brl(min) : `${brl(min)} a ${brl(max)}`;
    return { texto, semPreco, temPreco };
}

// Desenha a lista dentro do modal do carrinho
function renderCarrinho() {
    if (carrinho.length === 0) {
        itensCarrinho.innerHTML = `<p class="vazio">Seu carrinho está vazio.</p>`;
        totalCarrinho.hidden = true;
        return;
    }
    itensCarrinho.innerHTML = carrinho
        .map(({ id, qtd }) => {
            const p = PRODUTOS.find((x) => x.id === id);
            return `<div class="item-carrinho" data-id="${id}">
                <div><strong>${p.nome}</strong><br><small>${ROTULO[p.categoria]} · ${textoPreco(p)}</small></div>
                <div class="item-acoes">
                    <div class="qtd-controle">
                        <button type="button" data-acao="menos" aria-label="Diminuir quantidade de ${p.nome}">−</button>
                        <span aria-label="Quantidade">${qtd}</span>
                        <button type="button" data-acao="mais" aria-label="Aumentar quantidade de ${p.nome}">+</button>
                    </div>
                    <button type="button" class="remover" data-acao="remover">Remover</button>
                </div>
            </div>`;
        })
        .join("");

    const { texto, semPreco, temPreco } = calcularTotal();
    totalCarrinho.hidden = false;
    totalCarrinho.innerHTML = `<div><span>Estimativa de mão de obra</span><strong>${texto}</strong></div>
        <small>${semPreco ? (temPreco ? "Itens sob consulta não entram no cálculo. " : "") : ""}Peças e valor final são confirmados no orçamento da oficina.</small>`;
}

itensCarrinho.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-acao]");
    if (!botao) return;
    const id = Number(botao.closest(".item-carrinho").dataset.id);
    if (botao.dataset.acao === "mais") alterarQuantidade(id, +1);
    else if (botao.dataset.acao === "menos") alterarQuantidade(id, -1);
    else removerDoCarrinho(id);
});

document.getElementById("limpar-carrinho").addEventListener("click", () => {
    if (carrinho.length === 0) return;
    if (!confirm("Remover todos os itens do carrinho?")) return;
    carrinho = [];
    guardarCarrinho();
});

btnCarrinho.addEventListener("click", () => {
    renderCarrinho();
    modalCarrinho.showModal();
});

/* ---------- CONTA (login e cadastro) ---------- */
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

/* ---------- MODAIS (fechar) ----------*/
document.addEventListener("click", (e) => {
    const fechar = e.target.closest("[data-fechar]");
    if (fechar) fechar.closest("dialog").close();
});
document.querySelectorAll("dialog").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target !== modal) return; // clicou dentro do conteúdo
        const r = modal.getBoundingClientRect();
        const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (fora) modal.close();
    });
});

btnAgenda.addEventListener("click", () => modalAgenda.showModal());

/* ----------INÍCIO ---------- */
renderizar();
atualizarContador();
atualizarConta();
