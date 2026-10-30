
let PRODUTOS = [];


const ROTULO = { carros: "Carro", motos: "Moto", servicos: "Serviço" };

const SECOES = [
    ["carros", "Carros"],
    ["motos", "Motos"],
    ["servicos", "Serviços"],
];


function ler(chave, padrao) {
    try {
        const valor = JSON.parse(localStorage.getItem(chave));
        return valor ?? padrao; 
    } catch {
        return padrao;
    }
}
function salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}


let abaAtual = "geral";
let usuarios = ler("tc_usuarios", []);  
let sessao = ler("tc_sessao", null);    


let carrinho = ler("tc_carrinho", []);
if (!Array.isArray(carrinho)) carrinho = [];
carrinho = carrinho.filter((i) => PRODUTOS.some((p) => p.id === i.id) && i.qtd > 0);


const catalogo = document.getElementById("catalogo");
const btnMenu = document.getElementById("btn-menu");
const menuPrincipal = document.getElementById("menu-principal");
const catalogoCategoria = document.getElementById("catalogo-categoria");
const modalCategoria = document.getElementById("modal-categoria");
const tituloCategoria = document.getElementById("titulo-categoria");
const descricaoCategoria = document.getElementById("descricao-categoria");
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



const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });


function textoPreco(p) {
    if (p.min == null) return "Sob consulta";
    if (p.max == null) return `A partir de ${brl(p.min)}`;
    if (p.min === p.max) return brl(p.min);
    return `${brl(p.min)} a ${brl(p.max)}`;
}


let temporizadorAviso;
function avisar(mensagem) {
    aviso.textContent = mensagem;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.textContent = ""), 2500);
}


const ICONE_FOTO = `<span class="foto-legenda">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>
    <span>Foto em breve</span></span>`;

function cardHTML(p) {
    
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


function tratarFotosQuebradas(alvo = catalogo) {
    alvo.querySelectorAll(".foto img").forEach((img) => {
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


function fecharMenu() {
    menuPrincipal.hidden = true;
    btnMenu.setAttribute("aria-expanded", "false");
}

btnMenu.addEventListener("click", () => {
    const vaiAbrir = menuPrincipal.hidden;
    menuPrincipal.hidden = !vaiAbrir;
    btnMenu.setAttribute("aria-expanded", String(vaiAbrir));
});


document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-container")) fecharMenu();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharMenu();
});

const INFO_CATEGORIAS = {
    carros: {
        titulo: "Peças para carros",
        descricao: "Confira as peças e os componentes automotivos cadastrados no catálogo."
    },
    motos: {
        titulo: "Peças para motos",
        descricao: "Confira as peças e os componentes para motocicletas cadastrados no catálogo."
    },
    servicos: {
        titulo: "Serviços automotivos",
        descricao: "Confira os serviços de manutenção e os valores de mão de obra disponíveis."
    }
};

function abrirCategoria(categoria) {
    const informacoes = INFO_CATEGORIAS[categoria];
    if (!informacoes) return;

    const itens = PRODUTOS.filter((produto) => produto.categoria === categoria);
    tituloCategoria.textContent = informacoes.titulo;
    descricaoCategoria.textContent = informacoes.descricao;
    catalogoCategoria.innerHTML = itens.length
        ? `<div class="grade">${itens.map(cardHTML).join("")}</div>`
        : `<p class="vazio">Ainda não há itens cadastrados nesta categoria.</p>`;

    tratarFotosQuebradas(catalogoCategoria);
    fecharMenu();
    modalCategoria.showModal();
}

menuPrincipal.addEventListener("click", (e) => {
    const opcao = e.target.closest(".menu-opcao");
    if (!opcao) return;
    abrirCategoria(opcao.dataset.categoria);
});


catalogoCategoria.addEventListener("click", (e) => {
    const botao = e.target.closest(".adicionar");
    if (!botao) return;
    adicionarAoCarrinho(Number(botao.dataset.id));
});


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


campoBusca.addEventListener("input", renderizar);



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


function calcularTotal() {
    let min = 0, max = 0, temPreco = false, aberto = false, semPreco = false;
    for (const { id, qtd } of carrinho) {
        const p = PRODUTOS.find((x) => x.id === id);
        if (p.min == null) { semPreco = true; continue; }
        temPreco = true;
        min += p.min * qtd;
        if (p.max == null) aberto = true;   
        else max += p.max * qtd;
    }
    let texto = "Sob consulta";
    if (temPreco) texto = aberto ? `A partir de ${brl(min)}` : min === max ? brl(min) : `${brl(min)} a ${brl(max)}`;
    return { texto, semPreco, temPreco };
}


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


const soDigitos = (texto) => texto.replace(/\D/g, ""); 

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
    modalConta.showModal(); 
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
    e.preventDefault(); 
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


document.addEventListener("click", (e) => {
    const fechar = e.target.closest("[data-fechar]");
    if (fechar) fechar.closest("dialog").close();
});
document.querySelectorAll("dialog").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target !== modal) return; 
        const r = modal.getBoundingClientRect();
        const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (fora) modal.close();
    });
});

btnAgenda.addEventListener("click", () => modalAgenda.showModal());


async function inicializarApp() {
    try {
        const resposta = await fetch('db.json');
        if (!resposta.ok) throw new Error('Erro ao carregar o banco de dados fake.');
        
        const dados = await resposta.json();
        PRODUTOS = dados.produtos || [];

        
        carrinho = ler("tc_carrinho", []);
        if (!Array.isArray(carrinho)) carrinho = [];
        carrinho = carrinho.filter((i) => PRODUTOS.some((p) => p.id === i.id) && i.qtd > 0);

        renderizar();
        atualizarContador();
        atualizarConta();
    } catch (erro) {
        console.error(erro);
        catalogo.innerHTML = `<p class="vazio">Erro ao carregar os dados do catálogo. Certifique-se de estar rodando em um servidor local (Live Server).</p>`;
    }
}

inicializarApp();


renderizar();
atualizarContador();
atualizarConta();
