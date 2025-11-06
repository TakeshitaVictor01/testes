// // Função para formatar números como moeda brasileira (BRL)
// const formatarMoeda = (valor) => {
//     return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// };

// /**
//  * Renderiza os valores calculados nos elementos do dashboard.
//  * @param {object} valores - Um objeto contendo todos os totais calculados.
//  */
// function renderizarValores(valores) {
//     // Atualiza os cards de KPI
//     document.getElementById('receitas-mes').textContent = formatarMoeda(valores.totalReceitas);
//     document.getElementById('despesas-mes').textContent = formatarMoeda(valores.totalDespesas);
//     document.getElementById('contas-pendentes').textContent = formatarMoeda(valores.totalPendentes);

//     const saldoElement = document.getElementById('saldo-mes');
//     saldoElement.textContent = formatarMoeda(valores.saldoMes);

//     // Muda a cor do saldo com base no resultado (positivo ou negativo)
//     saldoElement.classList.remove('text-green-600', 'text-red-600');
//     if (valores.saldoMes >= 0) {
//         saldoElement.classList.add('text-green-600');
//     } else {
//         saldoElement.classList.add('text-red-600');
//     }

//     // Atualiza a barra de progresso e as legendas
//     const barraReceitas = document.getElementById('barra-receitas');
//     const barraDespesas = document.getElementById('barra-despesas');

//     barraReceitas.style.width = `${valores.percentualReceitas}%`;
//     barraReceitas.textContent = valores.percentualReceitas > 15 ? `${valores.percentualReceitas.toFixed(0)}%` : '';

//     barraDespesas.style.width = `${valores.percentualDespesas}%`;
//     barraDespesas.textContent = valores.percentualDespesas > 15 ? `${valores.percentualDespesas.toFixed(0)}%` : '';

//     document.getElementById('legenda-receitas').textContent = `Receitas: ${formatarMoeda(valores.totalReceitas)}`;
//     document.getElementById('legenda-despesas').textContent = `Despesas: ${formatarMoeda(valores.totalDespesas)}`;
// }


// /**
//  * Calcula os totais do dashboard com base em uma lista de lançamentos.
//  * @param {Array<object>} lancamentos - A lista de todos os lançamentos.
//  */
// function atualizarDashboard(lancamentos) {
//     const hoje = new Date();
//     const mesAtual = hoje.getMonth();
//     const anoAtual = hoje.getFullYear();

//     // 1. Filtra apenas os lançamentos com data de vencimento no mês atual
//     const lancamentosDoMes = lancamentos.filter(lancamento => {
//         const dataVencimento = new Date(lancamento.dueDate);
//         return dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual;
//     });

//     // 2. Calcula os totais
//     let totalReceitas = 0;
//     let totalDespesas = 0;
//     let totalPendentes = 0;

//     for (const lancamento of lancamentosDoMes) {
//         if (lancamento.type === 'receita') {
//             totalReceitas += lancamento.amount;
//         } else if (lancamento.type === 'despesa') {
//             totalDespesas += lancamento.amount;
//         }

//         if (lancamento.status === 'Pendente' || lancamento.status === 'Atrasado') {
//             totalPendentes += lancamento.amount;
//         }
//     }

//     const saldoMes = totalReceitas - totalDespesas;
//     const totalmovimentado = totalReceitas + totalDespesas;

//     // 3. Calcula os percentuais para a barra
//     let percentualReceitas = 0;
//     let percentualDespesas = 0;

//     if (totalmovimentado > 0) {
//         percentualReceitas = (totalReceitas / totalmovimentado) * 100;
//         percentualDespesas = (totalDespesas / totalmovimentado) * 100;
//     }

//     // 4. Chama a função para renderizar os valores na tela
//     renderizarValores({
//         totalReceitas,
//         totalDespesas,
//         totalPendentes,
//         saldoMes,
//         percentualReceitas,
//         percentualDespesas
//     });
// }

// // --- DADOS DE EXEMPLO (Simula o que viria da sua API) ---
// const mockLancamentos = [
//     // Lançamentos de Outubro 2025 (mês atual)
//     { amount: 8000.00, type: 'receita', status: 'Baixado', dueDate: '2025-10-02T10:00:00Z' },
//     { amount: 2500.00, type: 'despesa', status: 'Pendente', dueDate: '2025-10-10T10:00:00Z' },
//     { amount: 350.70,  type: 'despesa', status: 'Pendente', dueDate: '2025-10-20T10:00:00Z' },
//     { amount: 1500.50, type: 'receita', status: 'Pendente', dueDate: '2025-10-25T10:00:00Z' },

//     // Lançamento de outro mês (será ignorado pelo filtro)
//     { amount: 500.00, type: 'despesa', status: 'Baixado', dueDate: '2025-09-15T10:00:00Z' }
// ];


// // --- INICIALIZAÇÃO ---
// // Executa a função principal quando o conteúdo da página for carregado.
// document.addEventListener('DOMContentLoaded', () => {
//     // No seu projeto real, você faria a chamada para sua API aqui e passaria a resposta.
//     // Ex: fetch('sua-api/lancamentos').then(res => res.json()).then(dados => atualizarDashboard(dados));

//     atualizarDashboard(mockLancamentos);
// });




// --- Lógica para interatividade da UI ---
const addNewBtn = document.getElementById('add-new-btn');
const formContainer = document.getElementById('form-container');
const cancelBtn = document.getElementById('cancel-btn');
const baixaModal = document.getElementById('baixa-modal');
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.getElementById('user-menu');

// Abrir/Fechar formulário de novo lançamento
addNewBtn.addEventListener('click', () => formContainer.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => formContainer.classList.add('hidden'));

// Abrir/Fechar menu do usuário
userMenuButton.addEventListener('click', () => userMenu.classList.toggle('hidden'));

// Funções para controlar o Modal de Baixa
function openModal(entryId) {
    // Preenche o ID do lançamento no campo oculto do modal
    document.getElementById('entryId').value = entryId;
    // Preenche a data atual por padrão
    document.getElementById('paymentDate').valueAsDate = new Date();
    baixaModal.classList.remove('hidden');
}

function closeModal() {
    baixaModal.classList.add('hidden');
}

// Lógica de exemplo para o formulário de CRIAÇÃO
document.getElementById('item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Aqui você capturaria os dados e enviaria para sua API de criação
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Dados para CRIAR lançamento:', data);
    alert('Enviando para API de criação...');
    formContainer.classList.add('hidden');
    e.target.reset();
});

// Lógica de exemplo para o formulário de BAIXA
document.getElementById('baixa-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Aqui você capturaria os dados e enviaria para sua API de baixa
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Dados para REALIZAR BAIXA:', data);
    alert('Enviando para API de baixa...');
    closeModal();
    e.target.reset();
});


// ===================================================================================
//  SCRIPT PARA RENDERIZAÇÃO DOS CARDS DE LANÇAMENTO
// ===================================================================================

/**
 * Formata uma data (string ou objeto Date) para o formato DD/MM/AAAA.
 * @param {string | Date} data - A data a ser formatada.
 * @returns {string} A data formatada.
 */
const formatarData = (data) => {
    if (!data) return '';
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // UTC para evitar problemas de fuso
};

/**
 * Cria o HTML para um único card de lançamento.
 * @param {object} lancamento - O objeto de lançamento com todos os seus dados.
 * @returns {string} A string HTML do card.
 */
function criarCardHTML(lancamento) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
    const dataVencimento = new Date(lancamento.dueDate);

    // Determina o status, considerando se está atrasado
    let statusInfo = {};
    if (lancamento.status === 'Baixado') {
        statusInfo = {
            texto: 'Baixado',
            corBadge: 'bg-green-200 text-green-800',
            corBorda: ''
        };
    } else if (dataVencimento < hoje) {
        statusInfo = {
            texto: 'Atrasado',
            corBadge: 'bg-red-200 text-red-800',
            corBorda: 'border-2 border-red-400'
        };
    } else {
        statusInfo = {
            texto: 'Pendente',
            corBadge: 'bg-yellow-200 text-yellow-800',
            corBorda: ''
        };
    }

    // Determina a formatação do valor (receita ou despesa)
    const valorInfo = {
        cor: lancamento.type === 'receita' ? 'text-green-600' : 'text-red-600',
        sinal: lancamento.type === 'receita' ? '+' : '-'
    };

    // Determina o conteúdo do rodapé do card (botão de baixa ou info de pagamento)
    const footerHTML = lancamento.status === 'Baixado'
        ? `<div class="mt-auto pt-4 text-center">
             <p class="text-sm text-gray-500">Baixado em ${formatarData(lancamento.paymentDate)}</p>
           </div>`
        : `<div class="mt-auto pt-4 border-t border-gray-200">
             <button onclick="openModal(${lancamento.id})" class="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all">
               Realizar Baixa
             </button>
           </div>`;

    // Retorna o HTML completo do card usando template literals
    return `
        <div class="bg-white rounded-lg shadow-md p-4 flex flex-col ${statusInfo.corBorda}">
            <div class="flex justify-between items-start mb-2">
                <span class="px-2 py-1 text-xs font-semibold ${statusInfo.corBadge} rounded-full">${statusInfo.texto}</span>
                <span class="text-sm text-gray-500">Vence em: ${formatarData(lancamento.dueDate)}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 truncate">${lancamento.description}</h3>
            <p class="text-2xl font-bold ${valorInfo.cor} my-2">${valorInfo.sinal} ${formatarMoeda(lancamento.amount)}</p>
            ${footerHTML}
        </div>
    `;
}

/**
 * Renderiza a lista de cards de lançamento na tela.
 * @param {Array<object>} lancamentos - A lista de lançamentos a ser exibida.
 */
function renderizarCards(lancamentos) {
    const gridContainer = document.getElementById('items-grid');
    
    // 1. Limpa o container antes de adicionar novos cards
    gridContainer.innerHTML = '';

    // 2. Verifica se há lançamentos para exibir
    if (lancamentos.length === 0) {
        gridContainer.innerHTML = `
            <div class="col-span-1 md:col-span-2 xl:col-span-3 text-center py-10">
                <p class="text-gray-500">Nenhum lançamento encontrado para o período.</p>
            </div>
        `;
        return;
    }

    // 3. Cria e adiciona cada card ao container
    let cardsHTML = '';
    for (const lancamento of lancamentos) {
        cardsHTML += criarCardHTML(lancamento);
    }
    gridContainer.innerHTML = cardsHTML;
}




// ===================================================================================
//  SCRIPT PARA ATUALIZAÇÃO DO DASHBOARD (VERSÃO ATUALIZADA)
// ===================================================================================

const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function renderizarValoresDashboard(valores) {
    document.getElementById('receitas-mes').textContent = formatarMoeda(valores.totalReceitas);
    document.getElementById('despesas-mes').textContent = formatarMoeda(valores.totalDespesas);
    document.getElementById('contas-pendentes').textContent = formatarMoeda(valores.totalPendentes);
    
    const saldoElement = document.getElementById('saldo-mes');
    saldoElement.textContent = formatarMoeda(valores.saldoMes);

    saldoElement.classList.remove('text-green-600', 'text-red-600');
    if (valores.saldoMes >= 0) {
        saldoElement.classList.add('text-green-600');
    } else {
        saldoElement.classList.add('text-red-600');
    }

    const barraReceitas = document.getElementById('barra-receitas');
    const barraDespesas = document.getElementById('barra-despesas');
    barraReceitas.style.width = `${valores.percentualReceitas}%`;
    barraReceitas.textContent = valores.percentualReceitas > 15 ? `${valores.percentualReceitas.toFixed(0)}%` : '';
    barraDespesas.style.width = `${valores.percentualDespesas}%`;
    barraDespesas.textContent = valores.percentualDespesas > 15 ? `${valores.percentualDespesas.toFixed(0)}%` : '';
    
    document.getElementById('legenda-receitas').textContent = `Receitas: ${formatarMoeda(valores.totalReceitas)}`;
    document.getElementById('legenda-despesas').textContent = `Despesas: ${formatarMoeda(valores.totalDespesas)}`;
}

function atualizarTudo(lancamentos) {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const lancamentosDoMes = lancamentos.filter(lancamento => {
        const dataVencimento = new Date(lancamento.dueDate);
        return dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual;
    });

    // --- Cálculos para o Dashboard ---
    let totalReceitas = 0, totalDespesas = 0, totalPendentes = 0;
    for (const lancamento of lancamentosDoMes) {
        if (lancamento.type === 'receita') totalReceitas += lancamento.amount;
        else if (lancamento.type === 'despesa') totalDespesas += lancamento.amount;
        if (lancamento.status !== 'Baixado') totalPendentes += lancamento.amount;
    }
    const saldoMes = totalReceitas - totalDespesas;
    const totalMovimentado = totalReceitas + totalDespesas;
    let percentualReceitas = 0, percentualDespesas = 0;
    if (totalMovimentado > 0) {
        percentualReceitas = (totalReceitas / totalMovimentado) * 100;
        percentualDespesas = (totalDespesas / totalMovimentado) * 100;
    }

    // --- Chamada para as funções de renderização ---
    renderizarValoresDashboard({
        totalReceitas, totalDespesas, totalPendentes, saldoMes, percentualReceitas, percentualDespesas
    });
    
    // NOVA LINHA: Chama a função para renderizar os cards
    renderizarCards(lancamentosDoMes);
}

// --- DADOS DE EXEMPLO ATUALIZADOS ---
const mockLancamentos = [
    { id: 101, description: 'Recebimento projeto "Site XYZ"', amount: 8000.00, type: 'receita', status: 'Baixado', dueDate: '2025-10-01T10:00:00Z', paymentDate: '2025-10-02T10:00:00Z' },
    { id: 102, description: 'Pagamento aluguel de Outubro', amount: 2500.00, type: 'despesa', status: 'Pendente', dueDate: '2025-10-10T10:00:00Z', paymentDate: null },
    { id: 103, description: 'Compra de material de escritório', amount: 350.70,  type: 'despesa', status: 'Pendente', dueDate: '2025-10-20T10:00:00Z', paymentDate: null },
    { id: 104, description: 'Adiantamento Cliente Acme', amount: 1500.50, type: 'receita', status: 'Pendente', dueDate: '2025-10-25T10:00:00Z', paymentDate: null },
    { id: 105, description: 'Conta de Energia Elétrica', amount: 420.00, type: 'despesa', status: 'Pendente', dueDate: '2025-09-28T10:00:00Z', paymentDate: null }, // Mês passado, vai aparecer como atrasado se a função for geral
    { id: 106, description: 'Assinatura Software de Gestão', amount: 180.00, type: 'despesa', status: 'Baixado', dueDate: '2025-10-05T10:00:00Z', paymentDate: '2025-10-05T10:00:00Z'}
];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Renomeei a função principal para refletir que ela atualiza tudo (dashboard e cards)
    atualizarTudo(mockLancamentos); 
});

