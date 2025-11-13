import { ApiService } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');
    const enterpriseId = localStorage.getItem('enterpriseId');; 

    // Se não tiver token, volta para login
    if (!token || !group) {
        alert('Você precisa estar logado para acessar o dashboard.');
        window.location.href = 'login.html';
        return;
    }


    // --- CONFIGURAÇÃO ---
    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora/account');
    let currentItems = []; // Armazena os itens buscados para usar no modal

    // --- ELEMENTOS DO DOM ---
    const itemsList = document.getElementById('items-ul');
    const itemForm = document.getElementById('item-form');
    const mainContent = document.querySelector('main');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const addNewBtn = document.getElementById('add-new-btn');
    const globalTransferBtn = document.getElementById('global-transfer-btn'); // + NOVO BOTÃO
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingIndicator = document.getElementById('loading');
    //const userMenuButton = document.getElementById('user-menu-button');
    //const userMenu = document.getElementById('user-menu');

    // --- ELEMENTOS DO MODAL DE TRANSFERÊNCIA ---
    const transferModal = document.getElementById('transfer-modal');
    const transferForm = document.getElementById('transfer-form');
    const cancelTransferBtn = document.getElementById('cancel-transfer-btn');
    const transferFromAccount = document.getElementById('transfer-from-account'); // (Agora é um <select>)
    const transferToAccountSelect = document.getElementById('transfer-to-account');
    // const transferFromIdInput = document.getElementById('transfer-from-id'); // - REMOVIDO
    const transferAmountInput = document.getElementById('transfer-amount');
    const transferTitle = document.getElementById('transfer-title');


    // --- LÓGICA DO MENU DE USUÁRIO ---
    //userMenuButton.addEventListener('click', () => {
      //  userMenu.classList.toggle('hidden');
    //});

    // Fecha o menu se clicar fora dele
//    window.addEventListener('click', (e) => {
  //      if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
    //        userMenu.classList.add('hidden');
      //  }
    //});

    // Função de mock para simular a API
    function getMockData() {
        // Retorna os dados mocados após uma pequena pausa (para simular a rede)
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockResponse = {
                    "status": 200,
                    "success": true,
                    "data": [
                        {
                            "Id": 101,
                            "Description": "Conta Corrente Principal",
                            "Balance": 15250.75,
                            "CreationDate": "2024-01-15T10:30:00Z",
                            "EnterpriseId": 24,
                            "State": "1",
                            "ContractEndDate": "2025-12-31T00:00:00Z"
                        },
                        {
                            "Id": 102,
                            "Description": "Conta Poupança (Reservas)",
                            "Balance": 84100.20,
                            "CreationDate": "2023-03-20T14:00:00Z",
                            "EnterpriseId": 24,
                            "State": "1",
                            "ContractEndDate": "2025-12-31T00:00:00Z"
                        },
                        {
                            "Id": 103,
                            "Description": "Conta Investimentos",
                            "Balance": 120000.00,
                            "CreationDate": "2024-11-10T08:00:00Z",
                            "EnterpriseId": 24,
                            "State": "1",
                            "ContractEndDate": "2025-12-31T00:00:00Z"
                        }
                    ],
                    "message": "Contas recuperadas com sucesso."
                };
                resolve(mockResponse);
            }, 500); // 500ms de atraso
        });
    }


    async function fetchItems() {
        loadingIndicator.style.display = 'block';
        itemsList.innerHTML = '';
        try {
            // --- SUBSTITUIÇÃO DA API ---
             const endpoint = "getEnterpriseAccounts";
             const itemData = { id: enterpriseId };
             const response = await apiService.generic(endpoint, itemData); // Linha original comentada

            //const response = await getMockData(); // Nova linha usando o MOCK
            // --- FIM DA SUBSTITUIÇÃO ---

            currentItems = response.data; // Salva os itens
            renderItems(currentItems); // Renderiza
        } catch (error) {
            itemsList.innerHTML = `<li class="text-red-500 text-center">${error.message}</li>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    // --- FUNÇÕES DA API (CRUD) ---
    // (Função fetchItems original comentada mantida, caso precise reverter)
    // async function fetchItems() {
    //     ...
    // }

    async function createItem(itemData) {
        handleFormSubmit(itemData, false);
    }

    async function updateItem(id, itemData) {
        handleFormSubmit(itemData, true);
    }

    async function handleFormSubmit(itemData, isEditing) {
        try {
            if (isEditing) {
                await apiService.update(itemData);
            } else {
                await apiService.create(itemData);
            }
            fetchItems(); // Recarrega a lista
            hideForm();   // Função específica da UI
        } catch (error) {
            alert(error.message);
        }
    }

    async function deleteItem(id, itemData) {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            await apiService.delete(itemData);
            fetchItems();
        } catch (error) {
            alert(error.message);
        }
    }

    // --- NOVA FUNÇÃO DE TRANSFERÊNCIA ---
    async function executeTransfer(transferData) {
        // **NOTA**: O endpoint "makeTransfer" é um placeholder.
        // Substitua pelo endpoint real da sua API para transferências.
        const endpoint = "makeTransfer";
        try {
            // Usando 'generic' pois 'transferência' não é um CRUD padrão
            await apiService.generic(endpoint, transferData);
            alert('Transferência realizada com sucesso!');
            hideTransferModal();
            fetchItems(); // Atualiza a lista com novos saldos
        } catch (error) {
            alert(`Erro ao transferir: ${error.message}`);
        }
    }


    // --- RENDERIZAÇÃO E MANIPULAÇÃO DO DOM ---
    function renderItems(items) {
        itemsList.innerHTML = '';
        if (items.length === 0) {
            itemsList.innerHTML = '<li class="text-center text-gray-500">Nenhum item encontrado.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300';

            const formattedBalance = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(item.Balance);

            let formattedCreationDate = 'Não informada';
            if (item.CreationDate) {
                const [year, month, day] = item.CreationDate.split('T')[0].split('-');
                formattedCreationDate = `${day}/${month}/${year}`;
            }

            // --- Lógica Auxiliar ---
            const isActive = item.State === '1';
            const statusText = isActive ? 'Ativo' : 'Inativo';
            const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            let formattedEndDate = 'Não definida';
            if (item.ContractEndDate) {
                const [year, month, day] = item.ContractEndDate.split('T')[0].split('-');
                formattedEndDate = `${day}/${month}/${year}`;
            }
            // --- Fim da Lógica Auxiliar ---

            li.innerHTML = `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div class="flex-grow">
                    <h3 class="font-bold text-lg text-gray-900 truncate">${item.Description}</h3>
                    <p class="text-sm text-gray-500">Criada em: ${formattedCreationDate}</p>
                </div>

                <div class="flex items-center gap-3">
                    <span class="font-semibold text-gray-800 balance-value" data-balance="${formattedBalance}">
                        R$ ****
                    </span>
                    <button data-id="${item.Id}" class="toggle-balance-btn p-1 text-gray-500 hover:text-gray-800 transition-colors">
                        <svg class="eye-open h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <svg class="eye-closed h-6 w-6 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
                        </svg>
                    </button>
                </div>

                <div class="flex-shrink-0 flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <button data-id="${item.Id}" class="edit-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                    <button data-id="${item.Id}" class="view-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Visualizar</button>
                </div>
            </div>
        `;
            itemsList.appendChild(li);
        });
    }

    function showForm(item = null) {
        if (item) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            formTitle.textContent = 'Editar Item';
            document.getElementById('id').value = item.Id;
            document.getElementById('description').value = item.Description;
            document.getElementById('balance').value = item.Balance;
        } else {
            formTitle.textContent = 'Adicionar Novo Item';
            itemForm.reset();
        }
        formContainer.classList.remove('hidden');
        addNewBtn.classList.add('hidden');
        globalTransferBtn.classList.add('hidden'); // Esconde o botão de transferir também
    }

    function hideForm() {
        formContainer.classList.add('hidden');
        addNewBtn.classList.remove('hidden');
        globalTransferBtn.classList.remove('hidden'); // Mostra o botão de transferir novamente
        itemForm.reset();
    }

    // --- FUNÇÕES DO MODAL DE TRANSFERÊNCIA (ATUALIZADA) ---
    function showTransferModal() {
        transferTitle.textContent = 'Realizar Transferência'; // Título genérico
        
        // Limpa ambos os selects
        transferFromAccount.innerHTML = '<option value="" disabled selected>Selecione uma conta de origem</option>';
        transferToAccountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta de destino</option>';

        // Preenche o select DE ORIGEM (transferFromAccount)
        currentItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Id;
            // Mostrar o saldo na origem é útil
            option.textContent = `${item.Description} (Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.Balance)})`;
            transferFromAccount.appendChild(option);
        });

        // Preenche o select DE DESTINO (transferToAccountSelect)
        // A lógica de filtro será aplicada pelo event listener 'change'
        currentItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Id;
            option.textContent = `${item.Description}`;
            transferToAccountSelect.appendChild(option);
        });
        
        transferModal.classList.remove('hidden');
    }

    function hideTransferModal() {
        transferForm.reset();
        transferModal.classList.add('hidden');
    }


    // --- EVENT LISTENERS ---
    addNewBtn.addEventListener('click', () => showForm());
    globalTransferBtn.addEventListener('click', () => showTransferModal()); // + ADICIONADO
    cancelBtn.addEventListener('click', hideForm);

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('id').value;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const itemData = {
            balance: data.balance,
            description: data.description,
            enterpriseId: enterpriseId
        };
        if (id) {
            itemData.id = id;
            updateItem(id, itemData);
        } else {
            createItem(itemData);
        }
    });

    itemsList.addEventListener('click', async (e) => {
        // Encontra o botão mais próximo que tenha um data-id
        const targetButton = e.target.closest('button[data-id]');
        if (!targetButton) return; // Sai se o clique não foi em um botão com data-id

        const id = targetButton.dataset.id;

        if (targetButton.classList.contains('delete-btn')) {
            const itemData = {
                id: id
            };
            deleteItem(id, itemData);
        }

        if (targetButton.classList.contains('edit-btn')) {
            try {
                const itemData = {
                    id: id
                };
                const response = await apiService.getById(itemData);
                showForm(response.data);
            } catch (error) {
                alert(error.message);
            }
        }

        if (targetButton.classList.contains('view-btn')) {
            try {
                window.location.href = `conta_detalhe.html?id=${id}`;
            } catch (error) {
                alert(error.message);
            }
        }
        
        // --- BLOCO DO 'transfer-btn' REMOVIDO DAQUI ---

        if (targetButton.classList.contains('toggle-balance-btn')) {
            try {
                const listItem = targetButton.closest('li');
                const balanceSpan = listItem.querySelector('.balance-value');
                const eyeOpenIcon = listItem.querySelector('.eye-open');
                const eyeClosedIcon = listItem.querySelector('.eye-closed');

                const isHidden = balanceSpan.textContent.includes('****');

                if (isHidden) {
                    balanceSpan.textContent = balanceSpan.dataset.balance;
                    eyeOpenIcon.classList.add('hidden');
                    eyeClosedIcon.classList.remove('hidden');
                } else {
                    balanceSpan.textContent = 'R$ ****';
                    eyeOpenIcon.classList.remove('hidden');
                    eyeClosedIcon.classList.add('hidden');
                }
            } catch (error) {
                alert(error.message);
            }
        }
    });

    // --- LISTENERS DO MODAL DE TRANSFERÊNCIA (ATUALIZADOS) ---
    cancelTransferBtn.addEventListener('click', hideTransferModal);

    // + NOVO LISTENER: Filtra o select "Para" quando "De" muda
    transferFromAccount.addEventListener('change', (e) => {
        const selectedFromId = e.target.value;
        
        // Salva o valor que estava selecionado no "Para" (se houver)
        const currentToValue = transferToAccountSelect.value;
        
        transferToAccountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta de destino</option>';
        
        currentItems.forEach(item => {
            // Só adiciona ao "Para" se for DIFERENTE do "De"
            if (item.Id != selectedFromId) { 
                const option = document.createElement('option');
                option.value = item.Id;
                option.textContent = item.Description;
                transferToAccountSelect.appendChild(option);
            }
        });

        // Tenta restaurar a seleção anterior do "Para", se ainda for válida
        if (currentToValue && currentToValue !== selectedFromId) {
            transferToAccountSelect.value = currentToValue;
        }
    });

    // ATUALIZADO: submit do formulário
    transferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Alterado: Pega o valor do select de origem
        const fromId = transferFromAccount.value; 
        const toId = transferToAccountSelect.value;
        const amount = parseFloat(transferAmountInput.value);

        // Adicionada validação para conta de origem
        if (!fromId) {
            alert('Por favor, selecione uma conta de origem.');
            return;
        }
        if (!toId) {
            alert('Por favor, selecione uma conta de destino.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        // Validação de saldo
        const fromItem = currentItems.find(item => item.Id == fromId);
        if (fromItem.Balance < amount) {
            alert('Saldo insuficiente para realizar a transferência.');
            return;
        }
        
        // Validação de conta (embora a UI já trave, é bom garantir)
        if (fromId === toId) {
            alert('A conta de origem e destino não podem ser as mesmas.');
            return;
        }

        const transferData = {
            fromAccountId: fromId,
            toAccountId: toId,
            amount: amount,
            enterpriseId: enterpriseId // A API pode precisar disso
        };

        executeTransfer(transferData);
    });

    // Fecha o modal se clicar no fundo escuro
    transferModal.addEventListener('click', (e) => {
        if (e.target.id === 'transfer-modal') {
            hideTransferModal();
        }
    });

    // --- INICIALIZAÇÃO ---
    fetchItems();
});