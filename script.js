/* ============================================================
   TORQUE CERTO AUTO CENTER — script.js
   Vanilla JS didático: arrays, DOM, localStorage, roteamento simples
   ============================================================ */

// ===== 1. DADOS MOCK + localStorage =====
const USUARIOS_KEY = 'tc_usuarios';
const SESSAO_KEY = 'tc_sessao';

// Usuários padrão (senha: 123)
const usuariosIniciais = [
    { id: 1, nome: 'João Silva', email: 'cliente@teste.com', senha: '123', perfil: 'cliente' },
    { id: 2, nome: 'Maria Santos', email: 'recepcao@teste.com', senha: '123', perfil: 'recepcionista' },
    { id: 3, nome: 'Carlos Lima', email: 'gerente@teste.com', senha: '123', perfil: 'gerente' },
    { id: 4, nome: 'Pedro Alves', email: 'mecanico@teste.com', senha: '123', perfil: 'mecanico' },
    { id: 5, nome: 'Ana Costa', email: 'balconista@teste.com', senha: '123', perfil: 'balconista' },
    { id: 6, nome: 'Roberto Torres', email: 'dono@teste.com', senha: '123', perfil: 'proprietario' }
];

// Inicializa localStorage se vazio
function initUsuarios() {
    if (!localStorage.getItem(USUARIOS_KEY)) {
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosIniciais));
    }
}
function getUsuarios() {
    return JSON.parse(localStorage.getItem(USUARIOS_KEY) || '[]');
}
function saveUsuarios(usuarios) {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

// ===== 2. PERFIS E MENUS =====
const menusPorPerfil = {
    cliente: [
        { label: 'Meus Agendamentos', acao: 'renderMeusAgendamentos' },
        { label: 'Meus Veículos', acao: 'renderMeusVeiculos' },
        { label: 'Histórico de OS', acao: 'renderHistoricoOS' },
        { label: 'Aprovar Orçamentos', acao: 'renderAprovarOrcamentos' }
    ],
    recepcionista: [
        { label: 'Agenda do Dia', acao: 'renderAgendaDia' },
        { label: 'Novo Agendamento', acao: 'renderNovoAgendamento' },
        { label: 'Check-in / OS', acao: 'renderCheckinOS' },
        { label: 'Caixa / Pagamentos', acao: 'renderCaixa' },
        { label: 'Clientes', acao: 'renderClientes' }
    ],
    gerente: [
        { label: 'Orçamentos Pendentes', acao: 'renderOrcamentosPendentes' },
        { label: 'Aprovar Descontos', acao: 'renderAprovarDescontos' },
        { label: 'Controle de Qualidade', acao: 'renderQualidade' },
        { label: 'Relatórios', acao: 'renderRelatoriosGerente' }
    ],
    mecanico: [
        { label: 'Minhas OS Designadas', acao: 'renderMinhasOS' },
        { label: 'Diagnóstico / Laudo', acao: 'renderDiagnostico' },
        { label: 'Apontar Horas', acao: 'renderApontarHoras' },
        { label: 'Requisitar Peças', acao: 'renderRequisitarPecas' }
    ],
    balconista: [
        { label: 'Estoque Atual', acao: 'renderEstoque' },
        { label: 'Entrada de Nota', acao: 'renderEntradaNota' },
        { label: 'Pedido de Compra', acao: 'renderPedidoCompra' },
        { label: 'Inventário', acao: 'renderInventario' },
        { label: 'Venda Balcão', acao: 'renderVendaBalcao' }
    ],
    proprietario: [
        { label: 'Dashboard Geral', acao: 'renderDashboardDono' },
        { label: 'Faturamento', acao: 'renderFaturamento' },
        { label: 'Giro de Estoque', acao: 'renderGiroEstoque' },
        { label: 'Comissões', acao: 'renderComissoes' },
        { label: 'Inadimplência', acao: 'renderInadimplencia' }
    ]
};

// ===== 3. ESTADO GLOBAL =====
let usuarioAtual = null;      // {id, email, nome, perfil}
let menuAtivo = null;         // string: ação do menu clicado

// ===== 4. SESSÃO =====
function salvarSessao(user) {
    const { senha: _, ...safe } = user; // remove senha
    localStorage.setItem(SESSAO_KEY, JSON.stringify(safe));
    usuarioAtual = safe;
}
function carregarSessao() {
    const data = localStorage.getItem(SESSAO_KEY);
    if (data) {
        usuarioAtual = JSON.parse(data);
        return true;
    }
    return false;
}
function limparSessao() {
    localStorage.removeItem(SESSAO_KEY);
    usuarioAtual = null;
    menuAtivo = null;
}

// ===== 5. MODAL LOGIN =====
const modal = document.getElementById('modal-login');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const btnFechar = document.getElementById('btn-fechar-login');

function abrirModal() {
    modal.showModal();
    // Foca no primeiro input visível
    setTimeout(() => {
        const input = modal.querySelector('.tab-panel:not([hidden]) input');
        if (input) input.focus();
    }, 50);
}
function fecharModal() {
    modal.close();
    // Limpa erros e forms
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    document.querySelectorAll('form').forEach(f => f.reset());
}

// Troca de abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Atualiza botões
        tabBtns.forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-selected', b === btn);
        });
        
        // Atualiza painéis
        tabPanels.forEach(panel => {
            const show = panel.dataset.panel === tab;
            panel.hidden = !show;
            if (show) panel.setAttribute('role', 'tabpanel');
        });
        
        // Foca no primeiro input da aba
        setTimeout(() => {
            const input = modal.querySelector('.tab-panel:not([hidden]) input');
            if (input) input.focus();
        }, 10);
    });
});

btnFechar.addEventListener('click', fecharModal);
modal.addEventListener('click', e => {
    if (e.target === modal) fecharModal(); // clique no backdrop
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.open) fecharModal();
});

// ===== 6. LOGIN POR PERFIL =====
const perfis = ['cliente', 'recepcionista', 'gerente', 'mecanico', 'balconista', 'proprietario'];

perfis.forEach(perfil => {
    const form = document.getElementById(`form-login-${perfil}`);
    const erroEl = document.getElementById(`erro-${perfil}`);
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        const email = form.querySelector('[name="email"]').value.trim().toLowerCase();
        const senha = form.querySelector('[name="senha"]').value;
        
        const usuarios = getUsuarios();
        const user = usuarios.find(u => u.email === email && u.senha === senha && u.perfil === perfil);
        
        if (user) {
            salvarSessao(user);
            fecharModal();
            entrarNoSistema();
        } else {
            erroEl.textContent = 'Credenciais inválidas para este perfil.';
        }
    });
});

// ===== 7. CRIAR CONTA =====
document.getElementById('form-criar-conta').addEventListener('submit', e => {
    e.preventDefault();
    const erroEl = document.getElementById('erro-criar');
    
    const nome = document.getElementById('criar-nome').value.trim();
    const email = document.getElementById('criar-email').value.trim().toLowerCase();
    const perfil = document.getElementById('criar-perfil').value;
    const senha = document.getElementById('criar-senha').value;
    
    if (!nome || !email || !perfil || !senha) {
        erroEl.textContent = 'Preencha todos os campos.';
        return;
    }
    if (senha.length < 4) {
        erroEl.textContent = 'Senha deve ter pelo menos 4 caracteres.';
        return;
    }
    
    const usuarios = getUsuarios();
    if (usuarios.some(u => u.email === email)) {
        erroEl.textContent = 'Este e-mail já está cadastrado.';
        return;
    }
    
    const novoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const novoUser = { id: novoId, nome, email, senha, perfil };
    usuarios.push(novoUser);
    saveUsuarios(usuarios);
    
    // Loga automaticamente
    salvarSessao(novoUser);
    fecharModal();
    entrarNoSistema();
});

document.getElementById('btn-cancelar-criar').addEventListener('click', () => {
    // Volta para aba cliente
    document.querySelector('.tab-btn[data-tab="cliente"]').click();
});

// ===== 8. ENTRADA NO SISTEMA =====
function entrarNoSistema() {
    // Esconde modal, mostra app
    document.getElementById('tela-principal').hidden = false;
    
    document.getElementById('usuario-logado').textContent = usuarioAtual.perfil;
    renderizarMenu();
    
    const primeiro = menusPorPerfil[usuarioAtual.perfil]?.[0];
    if (primeiro) {
        menuAtivo = primeiro.acao;
        renderizarMenu();
        window[menuAtivo]();
    }
    
    atualizarRelogio();
}

// ===== 9. LOGOUT =====
function logout() {
    limparSessao();
    document.getElementById('tela-principal').hidden = true;
    abrirModal(); // abre modal de login novamente
}

// ===== 10. RENDERIZAÇÃO DO MENU LATERAL =====
function renderizarMenu() {
    const menu = document.getElementById('menu-lateral');
    const itens = menusPorPerfil[usuarioAtual.perfil] || [];
    
    menu.innerHTML = `
        <h3>${usuarioAtual.perfil.toUpperCase()}</h3>
        ${itens.map(item => `
            <button class="menu-item ${menuAtivo === item.acao ? 'ativo' : ''}" 
                    data-acao="${item.acao}">
                ${item.label}
            </button>
        `).join('')}
    `;

    // Event listeners nos botões do menu
    menu.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            menuAtivo = btn.dataset.acao;
            renderizarMenu(); // re-renderiza para atualizar .ativo
            window[menuAtivo](); // chama a função correspondente
        });
    });
}

// ===== 11. RENDERIZAÇÃO DO CONTEÚDO (placeholders) =====
function renderPlaceholder(titulo, descricao = 'Em construção...') {
    const container = document.getElementById('conteudo-principal');
    container.innerHTML = `
        <div class="card">
            <h3>${titulo}</h3>
            <p>${descricao}</p>
            <p class="badge badge-info">Módulo a ser implementado</p>
        </div>
    `;
}

// Placeholders para cada ação do menu (evita erro "function not defined")
function renderMeusAgendamentos() { renderPlaceholder('Meus Agendamentos'); }
function renderMeusVeiculos() { renderPlaceholder('Meus Veículos'); }
function renderHistoricoOS() { renderPlaceholder('Histórico de OS'); }
function renderAprovarOrcamentos() { renderPlaceholder('Aprovar Orçamentos'); }

function renderAgendaDia() { renderPlaceholder('Agenda do Dia'); }
function renderNovoAgendamento() { renderPlaceholder('Novo Agendamento'); }
function renderCheckinOS() { renderPlaceholder('Check-in / OS'); }
function renderCaixa() { renderPlaceholder('Caixa / Pagamentos'); }
function renderClientes() { renderPlaceholder('Clientes'); }

function renderOrcamentosPendentes() { renderPlaceholder('Orçamentos Pendentes'); }
function renderAprovarDescontos() { renderPlaceholder('Aprovar Descontos'); }
function renderQualidade() { renderPlaceholder('Controle de Qualidade'); }
function renderRelatoriosGerente() { renderPlaceholder('Relatórios'); }

function renderMinhasOS() { renderPlaceholder('Minhas OS Designadas'); }
function renderDiagnostico() { renderPlaceholder('Diagnóstico / Laudo'); }
function renderApontarHoras() { renderPlaceholder('Apontar Horas'); }
function renderRequisitarPecas() { renderPlaceholder('Requisitar Peças'); }

function renderEstoque() { renderPlaceholder('Estoque Atual'); }
function renderEntradaNota() { renderPlaceholder('Entrada de Nota'); }
function renderPedidoCompra() { renderPlaceholder('Pedido de Compra'); }
function renderInventario() { renderPlaceholder('Inventário'); }
function renderVendaBalcao() { renderPlaceholder('Venda Balcão'); }

function renderDashboardDono() { renderPlaceholder('Dashboard Geral'); }
function renderFaturamento() { renderPlaceholder('Faturamento'); }
function renderGiroEstoque() { renderPlaceholder('Giro de Estoque'); }
function renderComissoes() { renderPlaceholder('Comissões'); }
function renderInadimplencia() { renderPlaceholder('Inadimplência'); }

// ===== 12. RELÓGIO =====
function atualizarRelogio() {
    const agora = new Date().toLocaleTimeString('pt-BR');
    const el = document.getElementById('ultima-atualizacao');
    if (el) el.textContent = `Última sincronização: ${agora}`;
}

// ===== 13. INICIALIZAÇÃO =====
function init() {
    initUsuarios();
    
    if (carregarSessao()) {
        // Já logado
        document.getElementById('tela-principal').hidden = false;
        document.getElementById('usuario-logado').textContent = usuarioAtual.perfil;
        renderizarMenu();
        const primeiro = menusPorPerfil[usuarioAtual.perfil]?.[0];
        if (primeiro) {
            menuAtivo = primeiro.acao;
            renderizarMenu();
            window[menuAtivo]();
        }
    } else {
        // Não logado - abre modal
        document.getElementById('tela-principal').hidden = true;
        // Aguarda um tick para o DOM estar pronto
        setTimeout(abrirModal, 100);
    }
    
    // Botão sair na topbar
    document.getElementById('btn-sair').addEventListener('click', logout);
    
    // Relógio
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);
}

document.addEventListener('DOMContentLoaded', init);