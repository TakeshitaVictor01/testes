import { ApiService } from './apiService.js';

// --- CONFIGURAÇÃO DE MOCK (LIGAR/DESLIGAR) ---
const USE_MOCK_DATA = false; // <--- Mude para FALSE quando quiser usar a API Real

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH CHECK (Simulado se estiver em Mock) ---
    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');

    // Se não estiver usando Mock, valida o login
    if (!USE_MOCK_DATA && (!token || group !== 'admin')) {
        alert('Acesso restrito a administradores.');
        window.location.href = '/';
        return;
    }

    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora');
    
    // --- DOM ELEMENTS ---
    const filterForm = document.getElementById('filter-form');
    const filterCompany = document.getElementById('filter-company');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const filterStatus = document.getElementById('filter-status');
    const addNewBtn = document.getElementById('add-new-btn');

    const transactionsGrid = document.getElementById('transactions-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const emptyState = document.getElementById('empty-state');

    let allTransactions = []; 

    // --- DADOS MOCK (DADOS DE TESTE) ---
    const MOCK_COMPANIES = [
        { Id: '1', TradeName: 'Tech Solutions Ltda', State: '1' },
        { Id: '2', TradeName: 'Padaria do João', State: '1' },
        { Id: '3', TradeName: 'Consultoria Alpha', State: '1' },
        { Id: '4', TradeName: 'Empresa Inativa XYZ', State: '0' }
    ];

    const MOCK_TRANSACTIONS = [
        { 
            Id: '101', 
            Description: 'Mensalidade Março/2025', 
            Amount: 1500.00, 
            DueDate: new Date().toISOString(), // Hoje
            Status: 'Pendente', 
            Type: 'Receita', 
            EnterpriseId: '1',
            TradeName: 'Tech Solutions Ltda',
            Category: 'Mensalidade'
        },
        { 
            Id: '102', 
            Description: 'Instalação de Servidor', 
            Amount: 450.50, 
            DueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // 5 dias atrás
            Status: 'Pago', 
            Type: 'Receita', 
            EnterpriseId: '1',
            TradeName: 'Tech Solutions Ltda',
            Category: 'Serviço Extra'
        },
        { 
            Id: '103', 
            Description: 'Aluguel do Espaço', 
            Amount: 2200.00, 
            DueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), // Daqui 10 dias
            Status: 'Pendente', 
            Type: 'Receita', 
            EnterpriseId: '2',
            TradeName: 'Padaria do João',
            Category: 'Aluguel'
        },
        { 
            Id: '104', 
            Description: 'Manutenção Ar Condicionado', 
            Amount: 350.00, 
            DueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 dias atrás
            Status: 'Pago', 
            Type: 'Despesa', // Exemplo de despesa
            EnterpriseId: '3',
            TradeName: 'Consultoria Alpha',
            Category: 'Manutenção'
        }
    ];

    // --- INITIALIZATION ---
    init();

    async function init() {
        // Define datas padrão (Início do mês até o final do mês atual)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último dia do mês
        
        filterStartDate.valueAsDate = firstDay;
        filterEndDate.valueAsDate = lastDay;

        await loadCompanies();
        await fetchTransactions();
    }

    // --- CARREGAR EMPRESAS ---
    async function loadCompanies() {
        try {
            let activeCompanies = [];

            if (USE_MOCK_DATA) {
                console.log("⚠️ Usando Empresas Mock");
                activeCompanies = MOCK_COMPANIES.filter(c => c.State === '1');
            } else {
                const entService = new ApiService('https://megaware.incubadora.shop/incubadora/enterprise');
                const response = await entService.getAll();
                activeCompanies = response.data.filter(c => c.State === '1');
            }

            activeCompanies.forEach(c => {
                const option = document.createElement('option');
                option.value = c.Id;
                option.textContent = c.TradeName;
                filterCompany.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar empresas", error);
        }
    }

    // --- BUSCAR LANÇAMENTOS ---
    async function fetchTransactions() {
        showLoading(true);
        transactionsGrid.innerHTML = '';
        emptyState.classList.add('hidden');

        try {
            if (USE_MOCK_DATA) {
                console.log("⚠️ Usando Transações Mock");
                // Simulando um delay de rede para ver o spinner
                await new Promise(resolve => setTimeout(resolve, 800));
                allTransactions = MOCK_TRANSACTIONS;
            } else {
                const filterPayload = buldFilterPayload();
                console.log("Payload de Filtro:", filterPayload);
                const financialService = new ApiService('https://megaware.incubadora.shop/incubadora/financial');
                const response = await financialService.generic("getByFilter", filterPayload); 
                allTransactions = response.data || [];
            }
            renderCards(allTransactions);
            //applyFilters(); 
        } catch (error) {
            console.error(error);
            transactionsGrid.innerHTML = `<p class="text-red-500 col-span-full text-center">Erro ao carregar dados: ${error.message}</p>`;
        } finally {
            showLoading(false);
        }
    }

    function buldFilterPayload() {
        const companyId = filterCompany.value;
        const statusValue = filterStatus.value;
        const startRaw = filterStartDate.value;
        const endRaw = filterEndDate.value;

        if (!startRaw || !endRaw) {
            alert("Selecione as datas");
            return null;
        }

        const payload = {
            enterpriseId: companyId ? parseInt(companyId) : 0,
            startDate: startRaw,
            endDate: endRaw,
            state: statusValue !== 'all' ? statusValue : '',
            groupUser: 'admin'
        };

        return payload;
    }

    // --- FILTRAGEM LOCAL ---
    function applyFilters() {
        const companyId = filterCompany.value;
        const statusValue = filterStatus.value;
        
        const startRaw = filterStartDate.value;
        const endRaw = filterEndDate.value;
        
        if (!startRaw || !endRaw) {
            alert("Selecione as datas");
            return;
        }

        const start = new Date(startRaw + 'T00:00:00');
        const end = new Date(endRaw + 'T23:59:59');

        const filtered = allTransactions.filter(item => {
            // 1. Filtro por Empresa
            if (companyId && item.EnterpriseId != companyId) return false;

            // 2. Filtro por Data
            const itemDate = new Date(item.DueDate);
            if (itemDate < start || itemDate > end) return false;

            // 3. NOVO: Filtro por Status
            if (statusValue !== 'all') {
                // Normaliza para comparar (tudo minúsculo)
                // Assumindo que seu backend retorna 'Pago', 'Pendente', 'pago', etc.
                const itemStatus = (item.Status || '').toLowerCase();
                
                if (statusValue === 'pago' && itemStatus !== 'pago') return false;
                if (statusValue === 'pendente' && itemStatus === 'pago') return false; 
                // Nota: Se status for 'atrasado' ou qualquer coisa diferente de 'pago', conta como pendente nesta lógica
            }

            return true;
        });

        renderCards(filtered);
    }

    // --- RENDERIZAÇÃO DOS CARDS ---
    function renderCards(items) {
        transactionsGrid.innerHTML = '';

        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        items.forEach(item => {
            const card = document.createElement('div');
            // Layout do Card
            card.className = 'bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100 relative overflow-hidden flex flex-col justify-between';
            
            // Lógica de Formatação
            const amountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.Amount);
            const dateFormatted = new Date(item.DueDate).toLocaleDateString('pt-BR');
            
            // Lógica de Status e Cores
            const isPaid = item.Status && item.Status.toLowerCase() === 'baixado'; 
            const statusText = isPaid ? 'Baixado' : 'Pendente';
            const statusColorClass = isPaid ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50';
            
            // Tenta pegar o nome da empresa (No mock já vem, na API talvez tenha que adaptar)
            const companyName = item.Enterprise.TradeName;

            // Estilo da borda esquerda
            card.style.borderLeft = isPaid ? '5px solid #10B981' : '5px solid #FBBF24';

            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold uppercase tracking-wide text-gray-400">${item.Category.Description || 'Geral'}</span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColorClass}">
                            ${statusText}
                        </span>
                    </div>
                    
                    <p class="text-lg font-bold text-gray-600 mb-4"><i class="fa-solid fa-building mr-1"></i> ${companyName}</p>
                    <h4 class="text-lg text-gray-800 mb-1 truncate" title="${item.Description}">${item.Description}</h4>
                </div>

                <div class="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Vencimento</p>
                        <p class="font-medium text-gray-700"><i class="fa-regular fa-calendar mr-1"></i> ${dateFormatted}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-500 mb-1">Valor</p>
                        <p class="text-xl font-bold text-gray-800">
                            ${amountFormatted}
                        </p>
                    </div>
                </div>
            `;

            transactionsGrid.appendChild(card);
        });
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            transactionsGrid.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            transactionsGrid.classList.remove('hidden');
        }
    }

    // --- EVENTS ---
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        //applyFilters();
        fetchTransactions();
    });

    addNewBtn.addEventListener('click', function() {
        window.location.href = '/lancamentos_adm'; 
    });
});