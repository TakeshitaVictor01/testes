import { ApiService } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIG: Configurações iniciais e constantes.
    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');
    const enterpriseId = localStorage.getItem('enterpriseId');
    console.log(`Enterprise ID: ${enterpriseId}`);
    // Se não tiver token, volta para login
    if (!token || !group) {
        alert('Você precisa estar logado para acessar o dashboard.');
        window.location.href = 'login.html';
        return;
    }

    // --- ELEMENTOS DO DOM ---
    const entryService = new ApiService('https://megaware.incubadora.shop/incubadora/entry');
    const financialService = new ApiService('https://megaware.incubadora.shop/incubadora/financial');
    const accountService = new ApiService('https://megaware.incubadora.shop/incubadora/account');
    // Formulário de Criação
    const addNewBtn = document.getElementById('add-new-btn');
    const formContainer = document.getElementById('form-container');
    const cancelBtn = document.getElementById('cancel-btn');
    const itemForm = document.getElementById('item-form');

    // Menu do Usuário
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');

    // Grid dos Cards
    const gridContainer = document.getElementById('items-grid');

    // Elementos do Dashboard
    const receitasMesEl = document.getElementById('receitas-mes');
    const despesasMesEl = document.getElementById('despesas-mes');
    const contasPendentesEl = document.getElementById('contas-pendentes');
    const saldoMesEl = document.getElementById('saldo-mes');
    const barraReceitasEl = document.getElementById('barra-receitas');
    const barraDespesasEl = document.getElementById('barra-despesas');
    const legendaReceitasEl = document.getElementById('legenda-receitas');
    const legendaDespesasEl = document.getElementById('legenda-despesas');

    // --- Container de Baixa ---
    const baixaModal = document.getElementById('baixa-modal');
    const baixaContainer = document.getElementById('baixa-container');
    const baixaForm = document.getElementById('baixa-form');
    const settlementIdInput = document.getElementById('settlementId');
    const cancelBaixaBtn = document.getElementById('cancel-baixa-btn');

    // --- Novos seletores para a lista de contas ---
    const hiddenAccountIdInput = document.getElementById('accountId');
    const accountsList = document.getElementById('accounts-list');

    function formatCurrency(value) {
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) {
            return "R$ 0,00";
        }
        return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // 3. UTILS: Funções de ajuda/utilitárias.
    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatarData(data) {
        if (!data) return '';
        const dataObj = new Date(data);
        return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    // 4. METHODS: Funções que controlam a lógica da aplicação.

    // --- Métodos de Renderização ---
    function criarCardHTML(lancamento) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataVencimento = new Date(lancamento.DueDate);
        let statusInfo = {};

        if (lancamento.Status === 'Baixado') {
            statusInfo = { texto: 'Baixado', corBadge: 'bg-green-200 text-green-800', corBorda: '' };
        } else if (dataVencimento < hoje) {
            statusInfo = { texto: 'Atrasado', corBadge: 'bg-red-200 text-red-800', corBorda: 'border-2 border-red-400' };
        } else {
            statusInfo = { texto: 'Pendente', corBadge: 'bg-yellow-200 text-yellow-800', corBorda: '' };
        }

        const valorInfo = {
            cor: lancamento.Type === 'Receita' ? 'text-green-600' : 'text-red-600',
            sinal: lancamento.Type === 'Receita' ? '+' : '-'
        };

        const footerHTML = lancamento.Status === 'Baixado'
            ? `<div class="mt-auto pt-4 text-center"><p class="text-sm text-gray-500">Baixado em ${formatarData(lancamento.PaymentDate)}</p></div>`
            : `<div class="mt-auto pt-4 border-t border-gray-200"><button data-id="${lancamento.Id}" class="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 btn-realizar-baixa">Realizar Baixa</button></div>`;

        return `
                <div class="bg-white rounded-lg shadow-md p-4 flex flex-col ${statusInfo.corBorda}">
                <div class="flex justify-between items-start mb-2">
                <span class="px-2 py-1 text-xs font-semibold ${statusInfo.corBadge} rounded-full">${statusInfo.texto}</span>
                <span class="text-sm text-gray-500">Vence em: ${formatarData(lancamento.DueDate)}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800 truncate">${lancamento.Description}</h3>
                <p class="text-2xl font-bold ${valorInfo.cor} my-2">${valorInfo.sinal} ${formatarMoeda(lancamento.Amount)}</p>
                ${footerHTML}
                </div>
                `;
    }

    function renderizarCards(lancamentos) {
        gridContainer.innerHTML = '';
        if (lancamentos.length === 0) {
            gridContainer.innerHTML = `<div class="col-span-1 md:col-span-2 xl:col-span-3 text-center py-10"><p class="text-gray-500">Nenhum lançamento encontrado.</p></div>`;
            return;
        }
        gridContainer.innerHTML = lancamentos.map(criarCardHTML).join('');
    }

    function renderizarDashboard(valores) {
        receitasMesEl.textContent = formatarMoeda(valores.totalReceitas);
        despesasMesEl.textContent = formatarMoeda(valores.totalDespesas);
        contasPendentesEl.textContent = formatarMoeda(valores.totalPendentes);
        saldoMesEl.textContent = formatarMoeda(valores.saldoMes);

        saldoMesEl.classList.toggle('text-green-600', valores.saldoMes >= 0);
        saldoMesEl.classList.toggle('text-red-600', valores.saldoMes < 0);

        barraReceitasEl.style.width = `${valores.percentualReceitas}%`;
        barraReceitasEl.textContent = valores.percentualReceitas > 15 ? `${valores.percentualReceitas.toFixed(0)}%` : '';
        barraDespesasEl.style.width = `${valores.percentualDespesas}%`;
        barraDespesasEl.textContent = valores.percentualDespesas > 15 ? `${valores.percentualDespesas.toFixed(0)}%` : '';

        legendaReceitasEl.textContent = `Receitas: ${formatarMoeda(valores.totalReceitas)}`;
        legendaDespesasEl.textContent = `Despesas: ${formatarMoeda(valores.totalDespesas)}`;
    }

    async function atualizarTudo() {
        try {
            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();

            const endpoint = "getByEnterprise";
            const itemData = { id: enterpriseId };
            const response = await financialService.generic(endpoint, itemData);

            //Filtra lançamentos do mês atual - Deve vir da API
            // const lancamentosDoMes = response.data.filter(lanc => {
            //     const dataVencimento = new Date(lanc.DueDate);
            //     return (dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual) || lanc.Status === 'Pendente';
            // });

            const lancamentosDoMes = response.data
                .filter(lanc => {
                    const dataVencimento = new Date(lanc.DueDate);
                    return (dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual) || lanc.Status === 'Pendente';
                })
                .sort((a, b) => {
                    const statusPriority = (b.Status === 'Pendente') - (a.Status === 'Pendente');
                    return statusPriority || new Date(a.DueDate) - new Date(b.DueDate);
                });

            let totalReceitas = 0.0, totalDespesas = 0.0;
            lancamentosDoMes.forEach(lanc => {
                if (lanc.Type === 'Receita') totalReceitas += lanc.Amount;
                else totalDespesas += lanc.Amount;
            });

            console.log(totalReceitas);
            console.log(totalDespesas);
            // Lógica de pendentes melhorada: considera TODOS os lançamentos não baixados.
            const totalPendentes = response.data
                .filter(lanc => lanc.Status !== 'Baixado')
                .reduce((acc, lanc) => acc + lanc.Amount, 0);

            const saldoMes = totalReceitas - totalDespesas;
            const totalMovimentado = totalReceitas + totalDespesas;
            const percentualReceitas = totalMovimentado > 0 ? (totalReceitas / totalMovimentado) * 100 : 0;
            const percentualDespesas = totalMovimentado > 0 ? (totalDespesas / totalMovimentado) * 100 : 0;

            renderizarDashboard({ totalReceitas, totalDespesas, totalPendentes, saldoMes, percentualReceitas, percentualDespesas });
            // Renderiza apenas os cards do mês atual por padrão
            renderizarCards(lancamentosDoMes);
        }
        catch (error) { alert(error.message); }
    }

    // --- Métodos de Manipulação de Dados ---

    // {
    //   "amount": 0,
    //   "category": "string",
    //   "description": "string",
    //   "dueDate": "2025-10-05",
    //   "enterpriseId": 0,
    //   "entryDate": "2025-10-05",
    //   "entryEmployeeId": 0,
    //   "type": "string"
    // }

    async function criarLancamento(event) {
        try {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            const endpoint = "createEntry";
            const itemData = {
                amount: data.amount,
                category: data.categoryId,
                description: data.description,
                dueDate: data.dueDate,
                enterpriseId: enterpriseId, // Valor fixo para testes
                entryUserId: userId,
                type: data.type
            }
            await financialService.generic(endpoint, itemData);
            atualizarTudo(); // Re-renderiza a tela com o novo dado
            formContainer.classList.add('hidden');
            event.target.reset();
        } catch (error) {
            alert(error.message);
        }
    }


    // Configura os event listeners
    addNewBtn.addEventListener('click', () => {
        closeBaixaContainer();
        formContainer.classList.remove('hidden');
    })
    cancelBtn.addEventListener('click', () => formContainer.classList.add('hidden'));
    userMenuButton.addEventListener('click', () => userMenu.classList.toggle('hidden'));

    itemForm.addEventListener('submit', criarLancamento);
    // baixaForm.addEventListener('submit', handleBaixarLancamento);

    gridContainer.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-realizar-baixa')) {
            console.log(`btn clicado ${id}`);
            baixaContainer.classList.add('hidden');
            addNewBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            openBaixaContainer(id);
        }
    });


    //Baixas

    async function populateAccountsList() {
        try {
            accountsList.innerHTML = '<li class="text-center text-gray-500 p-4">Carregando contas...</li>';

            const endpoint = "getEnterpriseAccounts";
            const itemData = { id: enterpriseId };
            const response = await accountService.generic(endpoint, itemData);
            const accounts = response.data;
            accountsList.innerHTML = ''; // Limpa a lista

            accounts.forEach(account => {
                const li = document.createElement('li');
                // Adiciona o ID da conta ao dataset do elemento para fácil acesso
                li.dataset.id = account.Id;
                li.className = 'border rounded-lg p-3 transition-all duration-200 cursor-pointer hover:bg-gray-50';

                li.innerHTML = `
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span class="font-semibold text-gray-800">${account.Description}</span>
                    </div>
                    <span class="font-mono text-sm text-green-700 font-medium">${formatCurrency(account.Balance)}</span>
                </div>
            `;
                accountsList.appendChild(li);
            });

        } catch (error) {
            console.error('Erro ao popular contas:', error);
            accountsList.innerHTML = '<li class="text-center text-red-500 p-4">Erro ao carregar contas.</li>';
        }
    }

    accountsList.addEventListener('click', (event) => {
        // Encontra o elemento <li> mais próximo que foi clicado
        const selectedLi = event.target.closest('li');

        // Se não clicou em um <li>, não faz nada
        if (!selectedLi || !selectedLi.dataset.id) return;

        // Pega o ID do dataset do elemento
        const selectedAccountId = selectedLi.dataset.id;

        // Atualiza o valor do input oculto que será enviado com o formulário
        hiddenAccountIdInput.value = selectedAccountId;

        // Lógica para o efeito visual de seleção
        // 1. Remove a classe de seleção de todos os irmãos
        const allItems = accountsList.querySelectorAll('li');
        allItems.forEach(item => item.classList.remove('selected-account'));

        // 2. Adiciona a classe de seleção apenas ao item clicado
        selectedLi.classList.add('selected-account');

        console.log(`Conta selecionada: ID ${hiddenAccountIdInput.value}`);
    });


    function openBaixaContainer(entryId) {
        formContainer.classList.add('hidden');
        baixaForm.reset();
        settlementIdInput.value = entryId;
        baixaContainer.classList.remove('hidden');
        populateAccountsList(); // Chama a nova função para popular a lista
    }

    function closeBaixaContainer() {
        baixaContainer.classList.add('hidden');
        hiddenAccountIdInput.value = ''; // Limpa o ID da conta selecionada
        baixaForm.reset();
    }

    cancelBaixaBtn.addEventListener('click', closeBaixaContainer);

    baixaForm.addEventListener('submit', (event) => {
        try {
            event.preventDefault();
            if (!hiddenAccountIdInput.value) {
                alert('Por favor, selecione uma conta.');
                return;
            }
            handleBaixarLancamento(event, hiddenAccountIdInput.value);
        }
        catch (error) {
            alert(error.message);
        }
    });

    //     {
    //   "accountId": 0,
    //   "id": 0,
    //   "paymentDate": "2025-10-05",
    //   "paymentMethod": "string",
    //   "settlementDescription": "string",
    //   "settlementEmployeeId": 0
    // }

    async function handleBaixarLancamento(event, accountId) {
        try {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            const itemData = {
                accountId: accountId,
                id: settlementIdInput.value,
                paymentDate: data.paymentDate,
                paymentMethod: data.paymentMethod,
                settlementDescription: data.settlementDescription,
                settlementEmployeeId: 1
            };
            await financialService.generic('settleEntry', itemData);
            baixaContainer.classList.add('hidden');
            atualizarTudo(); // Re-renderiza a tela com o dado atualizado
            event.target.reset();
        }
        catch (error) {
            alert(error.message);
            return;
        }
    }



    // Renderiza a tela pela primeira vez
    atualizarTudo();
    // }
});