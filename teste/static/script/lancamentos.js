import { ApiService } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIG: Configurações iniciais e constantes.
    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');
    const enterpriseId = localStorage.getItem('enterpriseId');
    console.log(`Enterprise ID: ${enterpriseId}`);
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
    const categorySelect = document.getElementById('category-select');

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
                categoryId: categorySelect.value,
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

    let allCategories = [];
    // Configura os event listeners
    addNewBtn.addEventListener('click', () => {
        closeBaixaContainer();
        formContainer.classList.remove('hidden');
        loadCategories();
    })

    async function loadCategories() {
        try {
            // Ajuste a rota para onde busca as categorias
            const categoryService = new ApiService('https://megaware.incubadora.shop/incubadora/category');
            const response = await categoryService.generic("getAllByEnterprise", { enterpriseId: enterpriseId });
            
            allCategories = response.data;
            renderSingleSelectCategories();
        } catch (error) {
            console.error(error);
        }
    }

    function renderSingleSelectCategories() {
        categorySelect.innerHTML = '<option value="" disabled selected>Selecione a Categoria...</option>';
        allCategories.forEach(c => {
            const option = document.createElement('option');
            option.value = c.Id;
            option.textContent = `${c.Description}`;
            categorySelect.appendChild(option);
        });
    }


    cancelBtn.addEventListener('click', () => formContainer.classList.add('hidden'));

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


    function openBaixaContainer(entryId) {
        formContainer.classList.add('hidden');
        baixaForm.reset();
        settlementIdInput.value = entryId;
        baixaContainer.classList.remove('hidden');
        document.getElementById('paymentDate').value = getDataDeHoje();
    }
    
    function getDataDeHoje() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        // Os meses são baseados em zero, por isso somamos 1 e usamos padStart para ter sempre 2 dígitos
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    function closeBaixaContainer() {
        baixaContainer.classList.add('hidden');
        baixaForm.reset();
    }

    cancelBaixaBtn.addEventListener('click', closeBaixaContainer);

    baixaForm.addEventListener('submit', (event) => {
        try {
            event.preventDefault();
            handleBaixarLancamento(event);
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

    async function handleBaixarLancamento(event) {
        try {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            const itemData = {
                id: settlementIdInput.value,
                paymentDate: data.paymentDate,
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