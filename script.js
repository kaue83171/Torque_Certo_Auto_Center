// produtos e serviços vêm do db.json (carregados em iniciar())
let PRODUTOS = [];

const ROTULO = { carros: "Carro", motos: "Moto", servicos: "Serviço" };

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

// regras do agendamento (PDF: capacidade de 12 veículos/dia e 4 baias)
const VAGAS_POR_DIA = 12;
const VAGAS_POR_HORARIO = 4;
const SINAL = 50;
// o PDF não informa o horário de funcionamento, então estes valores são suposição do grupo
const HORARIOS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const DIAS_FECHADOS = [0]; // 0 = domingo

const STATUS_AGENDA = {
    agendado: "Agendado",
    cancelado: "Cancelado",
    cancelado_tardio: "Cancelado fora do prazo"
};

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
let carrinho = [];
let usuarios = ler("tc_usuarios", []);
let sessao = ler("tc_sessao", null);
let agendamentos = ler("tc_agendamentos", []);

const catalogo = document.getElementById("catalogo");
const campoBusca = document.getElementById("busca");
const resultados = document.getElementById("resultados");
const btnMenu = document.getElementById("btn-menu");
const menuPrincipal = document.getElementById("menu-principal");
const modalCategoria = document.getElementById("modal-categoria");
const tituloCategoria = document.getElementById("titulo-categoria");
const descricaoCategoria = document.getElementById("descricao-categoria");
const catalogoCategoria = document.getElementById("catalogo-categoria");
const qtdCarrinho = document.getElementById("qtd-carrinho");
const btnEntrar = document.getElementById("btn-entrar");
const btnAgenda = document.getElementById("btn-agenda");
const btnCarrinho = document.getElementById("btn-carrinho");
const modalConta = document.getElementById("modal-conta");
const modalCarrinho = document.getElementById("modal-carrinho");
const modalAgenda = document.getElementById("modal-agenda");
const itensCarrinho = document.getElementById("itens-carrinho");
const totalCarrinho = document.getElementById("total-carrinho");
const formPagamento = document.getElementById("form-pagamento");
const erroPagamento = document.getElementById("erro-pagamento");
const resultadoPagamento = document.getElementById("resultado-pagamento");
const precisaTroco = document.getElementById("precisa-troco");
const valorRecebido = document.getElementById("valor-recebido");
let pagamentoConcluido = false;
const telaLista = document.getElementById("agenda-tela-lista");
const agendaLista = document.getElementById("agenda-lista");
const formAgenda = document.getElementById("form-agenda");
const agendaVagas = document.getElementById("agenda-vagas");
const agendaSinal = document.getElementById("agenda-sinal");
const erroAgenda = document.getElementById("erro-agenda");
const aviso = document.getElementById("aviso");

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

function textoPreco(p) {
    if (p.min == null) return "Sob consulta";
    if (p.max == null) return `A partir de ${brl(p.min)}`;
    if (p.min === p.max) return brl(p.min);
    return `${brl(p.min)} a ${brl(p.max)}`;
}

// evita que o que o usuário digita vire HTML quando for mostrado na tela
function esc(texto) {
    const troca = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto).replace(/[&<>"']/g, (c) => troca[c]);
}

let temporizadorAviso;
function avisar(mensagem) {
    // o <dialog> aberto fica por cima de tudo na tela, então o aviso precisa ir para dentro dele
    const aberto = document.querySelector("dialog[open]");
    (aberto || document.body).appendChild(aviso);
    aviso.textContent = mensagem;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.textContent = ""), 2500);
}

/* ---------- catálogo ---------- */

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

// se a imagem não existir, troca pelo quadro "Foto em breve"
function tratarFotosQuebradas(alvo) {
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
    tratarFotosQuebradas(catalogo);
}

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

// os cards são criados pelo JS, então um listener só no contêiner descobre qual "+" foi clicado
function cliqueNoCard(e) {
    const botao = e.target.closest(".adicionar");
    if (botao) adicionarAoCarrinho(Number(botao.dataset.id));
}
catalogo.addEventListener("click", cliqueNoCard);
catalogoCategoria.addEventListener("click", cliqueNoCard);

/* ---------- menu e janela de categoria ---------- */

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

function abrirCategoria(categoria) {
    const info = INFO_CATEGORIAS[categoria];
    if (!info) return;
    const itens = PRODUTOS.filter((p) => p.categoria === categoria);
    tituloCategoria.textContent = info.titulo;
    descricaoCategoria.textContent = info.descricao;
    catalogoCategoria.innerHTML = itens.length
        ? `<div class="grade">${itens.map(cardHTML).join("")}</div>`
        : `<p class="vazio">Ainda não há itens cadastrados nesta categoria.</p>`;
    tratarFotosQuebradas(catalogoCategoria);
    fecharMenu();
    modalCategoria.showModal();
}

menuPrincipal.addEventListener("click", (e) => {
    const opcao = e.target.closest(".menu-opcao");
    if (opcao) abrirCategoria(opcao.dataset.categoria);
});

/* ---------- carrinho ---------- */

function guardarCarrinho() {
    // Alterar os itens permite iniciar outro pedido.
    pagamentoConcluido = false;
    resultadoPagamento.hidden = true;
    erroPagamento.textContent = "";

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

// delta é +1 ou -1; quando a quantidade chega a 0 o item sai do carrinho
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
    let min = 0;
    let max = 0;
    let aberto = false;
    let comPreco = 0;

    for (const { id, qtd } of carrinho) {
        const p = PRODUTOS.find((x) => x.id === id);
        if (p.min == null) continue;
        comPreco++;
        min += p.min * qtd;
        if (p.max == null) aberto = true; // sem valor máximo, só dá para dizer "a partir de"
        else max += p.max * qtd;
    }

    let texto = "Sob consulta";
    if (comPreco > 0) {
        if (aberto) texto = `A partir de ${brl(min)}`;
        else texto = min === max ? brl(min) : `${brl(min)} a ${brl(max)}`;
    }
    const semPreco = comPreco < carrinho.length;

    // O total precisa ser único para permitir calcular o troco.
    const exato =
        carrinho.length > 0 &&
        !semPreco &&
        !aberto &&
        min === max;

    return {
        texto,
        semPreco,
        min,
        max,
        aberto,
        comPreco,
        exato
    };
}

function renderCarrinho() {
    itensCarrinho.hidden = pagamentoConcluido && carrinho.length === 0;

    formPagamento.hidden = carrinho.length === 0;

    document.getElementById("limpar-carrinho").disabled =
        carrinho.length === 0;

    atualizarPagamento();
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
                        <span>${qtd}</span>
                        <button type="button" data-acao="mais" aria-label="Aumentar quantidade de ${p.nome}">+</button>
                    </div>
                    <button type="button" class="remover" data-acao="remover">Remover</button>
                </div>
            </div>`;
        })
        .join("");

    const { texto, semPreco } = calcularTotal();
    totalCarrinho.hidden = false;
    totalCarrinho.innerHTML = `<div><span>Valor estimado</span><strong>${texto}</strong></div>
        <small>${semPreco ? "Itens sob consulta não entram na soma. " : ""}Os valores são de referência; o total final sai no orçamento da oficina.</small>`;
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

/* ---------- conta (cadastro e login) ---------- */

const soDigitos = (texto) => texto.replace(/\D/g, "");

function atualizarConta() {
    btnEntrar.textContent = sessao ? `Olá, ${sessao.nome.split(" ")[0]}` : "Entrar";
}

function mostrarPainel(nome) {
    document.querySelectorAll(".modal-aba").forEach((b) => {
        b.classList.toggle("ativa", b.dataset.painel === nome);
        b.setAttribute("aria-pressed", b.dataset.painel === nome);
    });
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

/* ---------- agendamento ---------- */

// "AAAA-MM-DD" é o formato do <input type="date">; o idioma sv-SE devolve a data de hoje nesse formato
function hoje() {
    return new Date().toLocaleDateString("sv-SE");
}

function dataBR(iso) {
    return iso.split("-").reverse().join("/");
}

function momentoDe(a) {
    return new Date(a.data + "T" + a.hora);
}

function nomeDoServico(id) {
    const servico = PRODUTOS.find((p) => p.id === id);
    return servico ? servico.nome : "Serviço indisponível";
}

// cancelamentos feitos com menos de 24 h contam como ocorrência
function contarOcorrencias() {
    return agendamentos.filter((a) => a.telefone === sessao.telefone && a.status === "cancelado_tardio").length;
}

function agendadosNoDia(data) {
    return agendamentos.filter((a) => a.data === data && a.status === "agendado");
}

function preencherServicos() {
    const servicos = PRODUTOS.filter((p) => p.categoria === "servicos");
    formAgenda.elements.servico.innerHTML =
        `<option value="">Escolha o serviço</option>` +
        servicos.map((s) => `<option value="${s.id}">${s.nome}</option>`).join("");
}

function mostrarLista() {
    formAgenda.hidden = true;
    telaLista.hidden = false;
    renderAgenda();
}

function renderAgenda() {
    const meus = agendamentos
        .filter((a) => a.telefone === sessao.telefone)
        .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    const ocorrencias = contarOcorrencias();

    let html = "";
    if (ocorrencias >= 2) {
        html += `<p class="agenda-alerta">Você tem ${ocorrencias} ocorrências de cancelamento fora do prazo. Novos agendamentos exigem sinal de R$ ${SINAL} (abatido do serviço).</p>`;
    } else if (ocorrencias === 1) {
        html += `<p class="agenda-alerta">Você tem 1 ocorrência de cancelamento fora do prazo. Na segunda, novos agendamentos exigem sinal de R$ ${SINAL}.</p>`;
    }

    if (meus.length === 0) {
        html += `<p class="vazio">Você ainda não tem agendamentos.</p>`;
    }

    for (const a of meus) {
        const futuro = momentoDe(a) > new Date();
        const status = a.status === "agendado" && !futuro ? "Data já passou" : STATUS_AGENDA[a.status];
        const botao = a.status === "agendado" && futuro
            ? `<button type="button" class="remover" data-cancelar="${a.id}">Cancelar</button>`
            : "";
        html += `<div class="agenda-item">
            <div>
                <strong>${nomeDoServico(a.servicoId)}</strong><br>
                <small>${dataBR(a.data)} às ${a.hora} · ${esc(a.modelo)} ${a.ano} · ${a.placa}</small>
            </div>
            <div class="agenda-lado">
                <span class="agenda-status status-${a.status}">${status}</span>
                ${botao}
            </div>
        </div>`;
    }
    agendaLista.innerHTML = html;
}

function cancelarAgendamento(id) {
    const a = agendamentos.find((x) => x.id === id);
    if (!a) return;

    const horasAteLa = (momentoDe(a) - new Date()) / 3600000;
    const tarde = horasAteLa < 24;
    const pergunta = tarde
        ? "Faltam menos de 24 h para o horário. O cancelamento será registrado como ocorrência. Cancelar mesmo assim?"
        : "Cancelar este agendamento?";
    if (!confirm(pergunta)) return;

    a.status = tarde ? "cancelado_tardio" : "cancelado";
    salvar("tc_agendamentos", agendamentos);
    renderAgenda();
    avisar(tarde ? "Agendamento cancelado. Ocorrência registrada." : "Agendamento cancelado.");
}

agendaLista.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-cancelar]");
    if (botao) cancelarAgendamento(Number(botao.dataset.cancelar));
});

// monta a lista de horários da data escolhida, já bloqueando os que estão cheios ou que já passaram
function atualizarHorarios() {
    const campos = formAgenda.elements;
    const data = campos.data.value;
    campos.hora.innerHTML = `<option value="">Escolha a data primeiro</option>`;
    agendaVagas.textContent = "";
    if (!data) return;

    if (DIAS_FECHADOS.includes(new Date(data + "T00:00").getDay())) {
        agendaVagas.textContent = "Não atendemos nesse dia da semana.";
        return;
    }

    const doDia = agendadosNoDia(data);
    const diaCheio = doDia.length >= VAGAS_POR_DIA;
    agendaVagas.textContent = diaCheio
        ? "Esse dia está lotado. Escolha outra data."
        : `Vagas no dia: ${VAGAS_POR_DIA - doDia.length} de ${VAGAS_POR_DIA}`;

    let opcoes = `<option value="">Escolha o horário</option>`;
    for (const h of HORARIOS) {
        const livres = VAGAS_POR_HORARIO - doDia.filter((a) => a.hora === h).length;
        const passou = new Date(data + "T" + h) <= new Date();
        const bloqueado = diaCheio || passou || livres <= 0;
        const nota = passou ? "indisponível" : livres <= 0 ? "lotado" : `${livres} ${livres === 1 ? "vaga" : "vagas"}`;
        opcoes += `<option value="${h}"${bloqueado ? " disabled" : ""}>${h} · ${nota}</option>`;
    }
    campos.hora.innerHTML = opcoes;
}

// devolve o texto do erro, ou "" se estiver tudo certo
function validarAgendamento(d) {
    if (!d.servicoId) return "Escolha o serviço.";
    if (!d.data) return "Escolha a data.";
    if (d.data < hoje()) return "Essa data já passou.";
    if (DIAS_FECHADOS.includes(new Date(d.data + "T00:00").getDay())) return "Não atendemos nesse dia da semana.";
    if (!HORARIOS.includes(d.hora)) return "Escolha o horário.";
    if (new Date(d.data + "T" + d.hora) <= new Date()) return "Esse horário já passou.";

    const doDia = agendadosNoDia(d.data);
    if (doDia.length >= VAGAS_POR_DIA) return "Esse dia está lotado. Escolha outra data.";
    if (doDia.filter((a) => a.hora === d.hora).length >= VAGAS_POR_HORARIO) return "Esse horário está lotado.";

    // aceita placa antiga (ABC1234) e Mercosul (ABC1D23)
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(d.placa)) return "Placa inválida. Use o formato ABC1234 ou ABC1D23.";
    if (doDia.some((a) => a.placa === d.placa)) return "Esse veículo já tem agendamento nesse dia.";
    if (d.modelo.length < 2) return "Informe o modelo do veículo.";
    if (!(d.ano >= 1980 && d.ano <= new Date().getFullYear() + 1)) return "Ano do veículo inválido.";
    if (contarOcorrencias() >= 2 && !d.sinalOk) return `Marque a caixa confirmando o sinal de R$ ${SINAL}.`;
    return "";
}

document.getElementById("btn-novo-agendamento").addEventListener("click", () => {
    formAgenda.reset();
    formAgenda.elements.data.min = hoje();
    agendaSinal.hidden = contarOcorrencias() < 2;
    erroAgenda.textContent = "";
    atualizarHorarios();
    telaLista.hidden = true;
    formAgenda.hidden = false;
});

document.getElementById("voltar-agenda").addEventListener("click", mostrarLista);
formAgenda.elements.data.addEventListener("change", atualizarHorarios);

formAgenda.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!sessao) return;
    const campos = formAgenda.elements;
    const dados = {
        servicoId: Number(campos.servico.value),
        data: campos.data.value,
        hora: campos.hora.value,
        placa: campos.placa.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        modelo: campos.modelo.value.trim(),
        ano: Number(campos.ano.value),
        km: campos.km.value,
        sinalOk: campos.sinal.checked
    };

    const erro = validarAgendamento(dados);
    erroAgenda.textContent = erro;
    if (erro) return;

    agendamentos.push({
        id: Date.now(),
        telefone: sessao.telefone,
        servicoId: dados.servicoId,
        data: dados.data,
        hora: dados.hora,
        placa: dados.placa,
        modelo: dados.modelo,
        ano: dados.ano,
        km: dados.km,
        status: "agendado"
    });
    salvar("tc_agendamentos", agendamentos);
    mostrarLista();
    avisar(`Agendado para ${dataBR(dados.data)} às ${dados.hora}.`);
});

btnAgenda.addEventListener("click", () => {
    if (!sessao) {
        mostrarPainel("entrar");
        modalConta.showModal();
        avisar("Entre na sua conta para ver e fazer agendamentos.");
        return;
    }
    mostrarLista();
    modalAgenda.showModal();
});

/* ---------- janelas (fechar) ---------- */

// qualquer elemento com data-fechar fecha a janela em que está
document.addEventListener("click", (e) => {
    const fechar = e.target.closest("[data-fechar]");
    if (fechar) fechar.closest("dialog").close();
});

// clicar no fundo escuro também fecha
document.querySelectorAll("dialog").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target !== modal) return;
        const r = modal.getBoundingClientRect();
        const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (fora) modal.close();
    });
});
/* ---------- pagamento demonstrativo ---------- */

// Descobre qual forma de pagamento está marcada.
function formaSelecionada() {
    const selecionado = formPagamento.querySelector(
        'input[name="forma"]:checked'
    );

    return selecionado ? selecionado.value : "";
}

// Mostra os campos da opção escolhida.
function atualizarPagamento() {
    const forma = formaSelecionada();
    const total = calcularTotal();

    formPagamento
        .querySelectorAll(".pagamento-detalhe")
        .forEach(painel => {
            painel.hidden = painel.dataset.forma !== forma;
        });

    const tipoCartao = document.getElementById("tipo-cartao");
    tipoCartao.disabled = forma !== "cartao";

    const estimativa = document.getElementById(
        "pagamento-estimativa"
    );

    estimativa.textContent = total.exato
        ? `Valor único de referência: ${total.texto}. A confirmação é apenas uma simulação.`
        : `Estimativa: ${total.texto}. O valor final depende do orçamento; sua forma de pagamento será registrada como preferência.`;

    // O troco só pode ser calculado com um total definido.
    precisaTroco.disabled =
        forma !== "dinheiro" || !total.exato;

    if (precisaTroco.disabled) {
        precisaTroco.checked = false;
    }

    document.getElementById("troco-orientacao").textContent =
        total.exato
            ? "Se precisar de troco, informe o valor que entregará no atendimento."
            : "O troco poderá ser calculado após a oficina definir um valor único para o orçamento.";

    const mostrarValor =
        forma === "dinheiro" &&
        total.exato &&
        precisaTroco.checked;

    document.getElementById("campo-valor-recebido").hidden =
        !mostrarValor;

    valorRecebido.disabled = !mostrarValor;
    valorRecebido.required = mostrarValor;
    valorRecebido.min = total.exato
        ? total.min.toFixed(2)
        : "0";

    if (!mostrarValor) {
        valorRecebido.value = "";
    }

    atualizarTroco();
}

// Calcula a previsão de troco enquanto a pessoa digita.
function atualizarTroco() {
    const saida = document.getElementById("troco-calculado");
    saida.textContent = "";

    if (valorRecebido.disabled || valorRecebido.value === "") {
        return;
    }

    const total = calcularTotal();
    const recebido = Number(valorRecebido.value);
    const centavos = Math.round(recebido * 100);

    if (
        !Number.isFinite(recebido) ||
        !Number.isSafeInteger(centavos)
    ) {
        return;
    }

    const diferenca =
        centavos - Math.round(total.min * 100);

    saida.textContent = diferenca >= 0
        ? `Troco previsto: ${brl(diferenca / 100)}`
        : `Informe pelo menos ${brl(total.min)}.`;
}

// Atualiza os campos quando uma opção é alterada.
formPagamento.addEventListener("change", () => {
    erroPagamento.textContent = "";
    atualizarPagamento();
});

// Atualiza o troco conforme o valor é digitado.
valorRecebido.addEventListener("input", () => {
    erroPagamento.textContent = "";
    atualizarTroco();
});

// Confere os dados antes de finalizar.
function validarPagamento() {
    if (carrinho.length === 0) {
        return "Adicione pelo menos um item ao carrinho.";
    }

    const forma = formaSelecionada();

    if (!["pix", "cartao", "dinheiro"].includes(forma)) {
        return "Escolha Pix, cartão ou dinheiro para continuar.";
    }

    const tipoCartao =
        document.getElementById("tipo-cartao").value;

    if (
        forma === "cartao" &&
        !["credito", "debito"].includes(tipoCartao)
    ) {
        return "Escolha crédito ou débito.";
    }

    const total = calcularTotal();

    if (
        forma === "dinheiro" &&
        total.exato &&
        precisaTroco.checked
    ) {
        const recebido = Number(valorRecebido.value);
        const centavos = Math.round(recebido * 100);

        if (
            valorRecebido.value.trim() === "" ||
            !Number.isFinite(recebido) ||
            recebido < 0 ||
            !Number.isSafeInteger(centavos)
        ) {
            return "Informe um valor válido para o pagamento em dinheiro.";
        }

        if (
            Math.abs(recebido * 100 - centavos) > 0.000001
        ) {
            return "Use no máximo duas casas decimais.";
        }

        if (centavos < Math.round(total.min * 100)) {
            return `O valor entregue deve ser de pelo menos ${brl(total.min)}.`;
        }
    }

    return "";
}

// Monta o resumo do pedido demonstrativo.
function mostrarConfirmacao(pedido) {
    const rotulos = {
        pix: "Pix",
        cartao: "Cartão",
        dinheiro: "Dinheiro"
    };

    let metodo = rotulos[pedido.pagamento.forma];

    if (pedido.pagamento.tipoCartao) {
        metodo += pedido.pagamento.tipoCartao === "credito"
            ? " · Crédito"
            : " · Débito";
    }

    // esc() já existe no seu projeto e protege o texto exibido.
    const linha = (rotulo, valor) => `
        <div class="pagamento-resumo-linha">
            <span>${rotulo}</span>
            <strong>${esc(valor)}</strong>
        </div>
    `;

    const quantidade = pedido.itens.reduce(
        (soma, item) => soma + item.qtd,
        0
    );

    let html =
        linha("Referência", pedido.id) +
        linha("Itens selecionados", quantidade) +
        linha("Forma de pagamento", metodo) +
        linha("Valor de referência", pedido.estimativa.texto);

    if (pedido.estimativa.semPreco) {
        html += linha(
            "Itens sob consulta",
            "Não incluídos na estimativa"
        );
    }

    if (pedido.pagamento.recebido != null) {
        html += linha(
            "Valor a entregar",
            brl(pedido.pagamento.recebido)
        );

        html += linha(
            "Troco previsto",
            brl(pedido.pagamento.troco)
        );
    }

    document.getElementById("resumo-pagamento").innerHTML =
        html;

    resultadoPagamento.hidden = false;

    document
        .getElementById("titulo-resultado-pagamento")
        .focus();
}

// Finalização do formulário.
formPagamento.addEventListener("submit", evento => {
    evento.preventDefault();

    // Evita finalizar o mesmo pedido novamente.
    if (pagamentoConcluido) {
        return;
    }

    const erro = validarPagamento();
    erroPagamento.textContent = erro;

    if (erro) {
        return;
    }

    const total = calcularTotal();
    const forma = formaSelecionada();
    const pagamento = { forma };

    if (forma === "cartao") {
        pagamento.tipoCartao =
            document.getElementById("tipo-cartao").value;
    }

    if (
        forma === "dinheiro" &&
        total.exato &&
        precisaTroco.checked
    ) {
        const recebidoCentavos = Math.round(
            Number(valorRecebido.value) * 100
        );

        pagamento.recebido = recebidoCentavos / 100;

        pagamento.troco =
            (
                recebidoCentavos -
                Math.round(total.min * 100)
            ) / 100;
    }

    const pedido = {
        id:
            "TC-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 5)
                .toUpperCase(),

        criadoEm: new Date().toISOString(),

        status: "demonstrativo",

        itens: carrinho.map(({ id, qtd }) => {
            const produto = PRODUTOS.find(
                p => p.id === id
            );

            return {
                id,
                qtd,
                nome: produto.nome,
                min: produto.min,
                max: produto.max
            };
        }),

        estimativa: {
            texto: total.texto,
            semPreco: total.semPreco,
            exato: total.exato
        },

        pagamento
    };

    const salvos = ler("tc_pedidos", []);
    const pedidos = Array.isArray(salvos) ? salvos : [];

    try {
        salvar("tc_carrinho", []);
        salvar("tc_pedidos", [...pedidos, pedido]);
    } catch {
        // Tenta restaurar os itens se o registro falhar.
        try {
            salvar("tc_carrinho", carrinho);
        } catch {
            // Os itens continuam disponíveis em memória.
        }

        erroPagamento.textContent =
            "Não foi possível salvar o pedido neste navegador. Seus itens continuam no carrinho.";

        return;
    }

    carrinho = [];
    pagamentoConcluido = true;

    formPagamento.reset();
    atualizarContador();
    renderCarrinho();
    mostrarConfirmacao(pedido);
});
/* ---------- início ---------- */

async function iniciar() {
    atualizarConta();
    try {
        const resposta = await fetch("db.json");
        if (!resposta.ok) throw new Error("Não foi possível carregar o db.json (erro " + resposta.status + ")");
        const dados = await resposta.json();
        PRODUTOS = dados.produtos || [];
    } catch (erro) {
        console.error(erro);
        catalogo.innerHTML = `<p class="vazio">Erro ao carregar o catálogo. Abra o site por um servidor local (Live Server) ou pelo GitHub Pages; abrir o arquivo direto no navegador bloqueia o db.json.</p>`;
        return;
    }

    // descarta do carrinho o que foi apagado do db.json
    const salvo = ler("tc_carrinho", []);
    carrinho = Array.isArray(salvo) ? salvo.filter((i) => PRODUTOS.some((p) => p.id === i.id) && i.qtd > 0) : [];

    preencherServicos();
    renderizar();
    atualizarContador();
}

iniciar();
