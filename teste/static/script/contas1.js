// static/script/contas.js
// (Script extraído do contas.html original)

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS ---
    let allItems = []; 
    let currentFilter = 'todas'; 
    let currentSort = 'modificacao'; 
    let currentEmpresaFilter = 'todas'; // NOVO FILTRO DE EMPRESA

    // --- MOCK DE EMPRESAS (Para simular o Dropdown de Busca) ---
    const mockEmpresas = [
        { id: 100, nome: 'Incubadora Central (Geral)' }, // ID Central para despesas da Incubadora
        { id: 1, nome: 'Tech Solutions Ltda.' },
        { id: 2, nome: 'E-Commerce Rápido' },
        { id: 3, nome: 'Agência Criativa Alpha' },
    ];

    // --- ELEMENTOS DO DOM ---
    const itemsList = document.getElementById('items-ul');
    const itemForm = document.getElementById('item-form');
    const formContainer = document.getElementById('form-container');
    const addNewBtn = document.getElementById('add-new-btn');
    const sortBySelect = document.getElementById('sort-by');
    const statusFilterSelect = document.getElementById('status-filter');
    const empresaSelect = document.getElementById('id-empresa');
    const empresaFilterSelect = document.getElementById('empresa-filter'); // NOVO ELEMENTO DE FILTRO
    
    // --- UTILITÁRIOS E SETUP INICIAL ---

    // Popula o campo de seleção de Empresa no formulário e no filtro
    function populateEmpresaSelects() {
        const optionsHTML = mockEmpresas.map(empresa => 
            `<option value="${empresa.id}">${empresa.nome} (ID: ${empresa.id})</option>`
        ).join('');

        empresaSelect.innerHTML = optionsHTML;
        empresaFilterSelect.innerHTML = '<option value="todas">Empresa: Todas</option>' + optionsHTML;
    }
    populateEmpresaSelects();


    // Obtém o nome da empresa pelo ID (útil para exibição na lista)
    function getEmpresaNome(id) {
        const empresa = mockEmpresas.find(e => e.id == id);
        return empresa ? empresa.nome : 'Empresa Desconhecida';
    }

    // [Outras funções utilitárias (formatDate, getStatusInfo) mantidas...]
    const today = new Date();
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getStatusInfo = (vencimentoStr, statusPagamento, isArchived) => {
        const vencimento = new Date(vencimentoStr + 'T00:00:00');
        const todayMidnight = new Date(today.toISOString().split('T')[0] + 'T00:00:00'); 
        
        let text = '';
        let borderClass = '';
        let textColor = '';

        if (isArchived) {
            text = 'CONTA ARQUIVADA';
            borderClass = 'status-gray';
            textColor = 'gray';
        } else if (statusPagamento === 'paga') {
            text = 'Conta Paga';
            borderClass = 'status-green';
            textColor = 'green';
        } else if (vencimento < todayMidnight) {
            text = 'CONTA VENCIDA';
            borderClass = 'status-red';
            textColor = 'red';
        } else {
            text = 'Conta Não Paga (Aberto)';
            borderClass = 'status-yellow';
            textColor = 'yellow';
        }
        
        return { text, borderClass, textColor, rawStatus: isArchived ? 'arquivada' : (statusPagamento === 'paga' ? 'paga' : (vencimento < todayMidnight ? 'vencida' : 'a_pagar')) };
    };
    // [Fim das funções utilitárias]


    // --- FUNÇÕES DA API (CRUD MOCK) ---
    async function fetchItems() {
        // ... (Lógica de fetchItems com dados mockados e IDs de Empresa)
        
        const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

        const mockItems = [
            { 
                id: 1, 
                descricao: 'Conta de Energia (Repasse)', 
                vencimento: tomorrow.toISOString().split('T')[0],
                saldo: 150.75, 
                status: 'nao_paga',
                arquivada: false,
                idEmpresa: 1, // Empresa 1
                modificadoEm: new Date().getTime() 
            },
            { 
                id: 2, 
                descricao: 'Aluguel do Escritório (Geral)', 
                vencimento: yesterday.toISOString().split('T')[0],
                saldo: 2500.00, 
                status: 'nao_paga', 
                arquivada: false,
                idEmpresa: 100, // Incubadora Central
                modificadoEm: new Date().getTime() - 60000 
            },
            { 
                id: 3, 
                descricao: 'Conta de Internet', 
                vencimento: '2025-09-05',
                saldo: 99.90, 
                status: 'paga',
                arquivada: false,
                idEmpresa: 2, // Empresa 2
                modificadoEm: new Date().getTime() - 120000 
            },
            { 
                id: 4, 
                descricao: 'Consultoria de Marketing', 
                vencimento: '2025-10-30',
                saldo: 4500.00, 
                status: 'nao_paga', 
                arquivada: true, 
                idEmpresa: 1, // Empresa 1 (Arquivada)
                modificadoEm: new Date().getTime() - 180000
            },
            { 
                id: 5, 
                descricao: 'Taxa de Condomínio', 
                vencimento: yesterday.toISOString().split('T')[0],
                saldo: 350.00, 
                status: 'paga', 
                arquivada: false,
                idEmpresa: 3, // Empresa 3
                modificadoEm: new Date().getTime() - 240000
            },
        ];

        setTimeout(() => {
            allItems = mockItems;
            applyFiltersAndSort();
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }

    // ... (Funções archiveItem e updateItem mantidas, mas usando idEmpresa)
    function archiveItem(id) {
        if (!confirm('Tem certeza que deseja ARQUIVAR esta conta? Ela será oculta da lista principal.')) return;
        
        const itemIndex = allItems.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            allItems[itemIndex].arquivada = true;
            allItems[itemIndex].modificadoEm = new Date().getTime(); 
            
            alert(`Conta ID ${id} arquivada com sucesso (Simulado).`);
            applyFiltersAndSort();
        }
    }

    function updateItem(id, itemData) {
        const itemIndex = allItems.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            allItems[itemIndex] = { ...allItems[itemIndex], ...itemData, modificadoEm: new Date().getTime() };
        } else {
            const newItem = {
                id: allItems.length + 1,
                ...itemData,
                arquivada: false,
                modificadoEm: new Date().getTime()
            };
            allItems.push(newItem);
        }
        alert(`Conta ${id ? 'Atualizada' : 'Cadastrada'} com Sucesso (Simulado)!`);
        document.getElementById('form-container').classList.add('hidden');
        addNewBtn.classList.remove('hidden');
        itemForm.reset();
        applyFiltersAndSort();
    }

    // --- FILTROS E RENDERIZAÇÃO ---
    function applyFiltersAndSort() {
        let filteredItems = [...allItems];
        
        // 1. Filtragem por Status e Arquivadas
        filteredItems = filteredItems.filter(item => {
            const { rawStatus } = getStatusInfo(item.vencimento, item.status, item.arquivada);
            
            if (currentFilter === 'arquivadas') {
                return item.arquivada;
            }
            
            // Exclui arquivadas dos demais filtros
            if (item.arquivada) return false; 
            
            if (currentFilter === 'a_pagar') return rawStatus === 'a_pagar';
            if (currentFilter === 'vencidas') return rawStatus === 'vencida';
            if (currentFilter === 'pagas') return rawStatus === 'paga';
            
            return true;
        });
        
        // 2. Filtragem por Empresa (NOVO)
        if (currentEmpresaFilter !== 'todas') {
            filteredItems = filteredItems.filter(item => item.idEmpresa == currentEmpresaFilter);
        }

        // 3. Ordenação (mantida)
        filteredItems.sort((a, b) => {
            if (currentSort === 'nome') return a.descricao.localeCompare(b.descricao);
            if (currentSort === 'vencimento') return new Date(a.vencimento) - new Date(b.vencimento);
            if (currentSort === 'valor_desc') return b.saldo - a.saldo;
            if (currentSort === 'valor_asc') return a.saldo - b.saldo;
            if (currentSort === 'modificacao') return b.modificadoEm - a.modificadoEm;
            return 0;
        });

        renderItems(filteredItems);
    }

    function renderItems(items) {
        itemsList.innerHTML = '';
        if(items.length === 0) {
            itemsList.innerHTML = '<li class="loading-indicator">Nenhuma conta encontrada com este filtro.</li>';
            return;
        }
        
        items.forEach(item => {
            const { text, borderClass, textColor } = getStatusInfo(item.vencimento, item.status, item.arquivada);
            const li = document.createElement('li');
            
            // Usando as novas classes do global.css
            li.className = `item-list-entry account-list-item ${borderClass}`;
            
            const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.saldo);
            const vencimentoFormatado = formatDate(item.vencimento);
            const nomeEmpresa = getEmpresaNome(item.idEmpresa); // Pega o nome da empresa
            
            li.innerHTML = `
                <div class="account-item-layout">
                    <div class="account-item-content">
                        <h3 class="account-item-title">${item.descricao}</h3>
                        <div class="account-item-details">
                            <p>Empresa: <span>${nomeEmpresa} (ID: ${item.idEmpresa})</span></p>
                            <p>Vencimento: <span>${vencimentoFormatado}</span></p>
                            <p>Valor: <span style="font-weight: 700;">${valorFormatado}</span></p>
                        </div>
                    </div>
                    <div class="account-item-footer">
                        <span class="account-status ${textColor}">${text}</span>
                        <div class="account-item-actions">
                            <button data-id="${item.id}" class="action-button edit">Editar</button>
                            ${item.arquivada 
                                ? `<button data-id="${item.id}" class="action-button unarchive" style="color: #eab308;">Desarquivar</button>`
                                : `<button data-id="${item.id}" class="action-button archive" style="color: #64748b;">Arquivar</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
            itemsList.appendChild(li);
        });
    }

    // --- FUNÇÕES DO FORMULÁRIO (showForm ajustada para carregar idEmpresa) ---
    function showForm(item = null) {
        if (item) {
            document.getElementById('form-title').textContent = 'Editar Conta';
            document.getElementById('item-id').value = item.id;
            document.getElementById('id-empresa').value = item.idEmpresa; // Define a empresa
            document.getElementById('item-description').value = item.descricao;
            document.getElementById('vencimento').value = item.vencimento;
            document.getElementById('saldo').value = item.saldo;
            document.getElementById('status').value = item.status;
        } else {
            document.getElementById('form-title').textContent = 'Cadastrar Nova Conta';
            itemForm.reset();
            document.getElementById('item-id').value = '';
            document.getElementById('id-empresa').value = mockEmpresas[0].id; // Padrão: Incubadora Central
            document.getElementById('vencimento').valueAsDate = new Date(); 
        }
        formContainer.classList.remove('hidden');
        addNewBtn.classList.add('hidden');
    }

    // --- EVENT LISTENERS ---
    
    // Ações de Filtro e Ordenação
    sortBySelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });

    statusFilterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        applyFiltersAndSort();
    });
    
    empresaFilterSelect.addEventListener('change', (e) => { // NOVO LISTENER DE FILTRO
        currentEmpresaFilter = e.target.value;
        applyFiltersAndSort();
    });

    // Botões de Form
    addNewBtn.addEventListener('click', () => showForm());
    document.getElementById('cancel-btn').addEventListener('click', () => {
        document.getElementById('form-container').classList.add('hidden');
        addNewBtn.classList.remove('hidden');
        itemForm.reset();
    });

    // Submissão do Formulário
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('item-id').value;
        const itemData = {
            idEmpresa: parseInt(document.getElementById('id-empresa').value), 
            descricao: document.getElementById('item-description').value,
            vencimento: document.getElementById('vencimento').value,
            saldo: parseFloat(document.getElementById('saldo').value),
            status: document.getElementById('status').value
        };
        
        updateItem(id, itemData);
    });

    // Ações na Lista (Editar/Arquivar/Desarquivar)
    itemsList.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        
        const item = allItems.find(i => i.id == id);

        if (e.target.classList.contains('archive-btn')) {
            archiveItem(id);
        }

        if (e.target.classList.contains('unarchive-btn')) {
            if (!confirm('Deseja realmente desarquivar esta conta?')) return;
            item.arquivada = false;
            item.modificadoEm = new Date().getTime();
            alert(`Conta ID ${id} desarquivada com sucesso (Simulado).`);
            applyFiltersAndSort();
        }

        if (e.target.classList.contains('edit-btn') && item) {
            showForm(item);
        }
    });
    
    // Lógica do Menu de Usuário (mantida)
    document.getElementById('user-menu-button').addEventListener('click', () => document.getElementById('user-menu').classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (!document.getElementById('user-menu-button').contains(e.target) && !document.getElementById('user-menu').contains(e.target)) {
            document.getElementById('user-menu').classList.add('hidden');
        }
    });

    // --- INICIALIZAÇÃO ---
    fetchItems();
});