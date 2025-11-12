import { ApiService } from './apiService.js';

//python3 -m http.server 5500
document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');

    // Se não tiver token, volta para login
    if (!token || !group) {
        alert('Você precisa estar logado para acessar o dashboard.');
        window.location.href = 'login';
        return;
    }

    // --- CONFIGURAÇÃO ---
    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora/enterprise');
    // --- ELEMENTOS DO DOM ---
    const itemsList = document.getElementById('items-ul');
    const itemForm = document.getElementById('item-form');
    const mainContent = document.querySelector('main');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const addNewBtn = document.getElementById('add-new-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingIndicator = document.getElementById('loading');
    const userMenu = document.getElementById('user-menu');

     if (group !== 'admin') {
        addNewBtn.style.display = 'none';
    }

    // // Fecha o menu se clicar fora dele
    // window.addEventListener('click', (e) => {
    //     if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
    //         userMenu.classList.add('hidden');
    //     }
    // });

    // --- FUNÇÕES DA API (CRUD) ---
    async function fetchItems() {
        loadingIndicator.style.display = 'block';
        itemsList.innerHTML = '';
        try {
            const response = (group !== 'admin') ? await apiService.generic("getByAssociateUser", { id: userId }) : await apiService.getAll();
            renderItems(response.data);
        } catch (error) {
            itemsList.innerHTML = `<li class="text-red-500 text-center">${error.message}</li>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

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

    // --- RENDERIZAÇÃO E MANIPULAÇÃO DO DOM ---
    function renderItems(items) {
        itemsList.innerHTML = '';
        if (items.length === 0) {
            itemsList.innerHTML = '<li class="text-center text-gray-500">Nenhum item encontrado.</li>';
            return;
        }

        if (group !== 'admin') {
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300';

                // --- Lógica Auxiliar ---
                // 1. Define o texto e a cor do selo de status
                const isActive = item.State === '1';
                const statusText = isActive ? 'Ativo' : 'Inativo';
                const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

                // 2. Formata a data para o padrão brasileiro (DD/MM/AAAA)
                let formattedEndDate = 'Não definida';
                if (item.ContractEndDate) {
                    // Pega a data antes do 'T' e divide em ano, mês e dia
                    const [year, month, day] = item.ContractEndDate.split('T')[0].split('-');
                    formattedEndDate = `${day}/${month}/${year}`;
                }
                // --- Fim da Lógica Auxiliar ---

                li.innerHTML = `
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 w-full">
                
                <div class="flex flex-col">
                <div class="flex items-center gap-3">
                <h3 class="font-bold text-lg text-gray-900 truncate">${item.TradeName}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                ${statusText}
                </span>
                </div>
                <p class="text-sm text-gray-500">${item.LegalName}</p>
                </div>
                
                <div class="flex flex-col">
                <p class="text-sm font-semibold text-gray-700">CNPJ</p>
                <p class="text-sm text-gray-500">${item.CNPJ}</p>
                </div>
                
                <div class="flex flex-col">
                <p class="text-sm font-semibold text-gray-700">Fim do Contrato</p>
                <p class="text-sm text-gray-500">${formattedEndDate}</p>
                </div>
                </div>
                
                <div class="flex-shrink-0 flex items-center space-x-3 w-full md:w-auto justify-end">
                <button data-id="${item.Id}" class="view-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Visualizar</button>
                </div>
                </div>
                `;
                itemsList.appendChild(li);
            });
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300';

                // --- Lógica Auxiliar ---
                // 1. Define o texto e a cor do selo de status
                const isActive = item.State === '1';
                const statusText = isActive ? 'Ativo' : 'Inativo';
                const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

                // 2. Formata a data para o padrão brasileiro (DD/MM/AAAA)
                let formattedEndDate = 'Não definida';
                if (item.ContractEndDate) {
                    // Pega a data antes do 'T' e divide em ano, mês e dia
                    const [year, month, day] = item.ContractEndDate.split('T')[0].split('-');
                    formattedEndDate = `${day}/${month}/${year}`;
                }
                // --- Fim da Lógica Auxiliar ---

                li.innerHTML = `
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 w-full">
                
                <div class="flex flex-col">
                <div class="flex items-center gap-3">
                <h3 class="font-bold text-lg text-gray-900 truncate">${item.TradeName}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                ${statusText}
                </span>
                </div>
                <p class="text-sm text-gray-500">${item.LegalName}</p>
                </div>
                
                <div class="flex flex-col">
                <p class="text-sm font-semibold text-gray-700">CNPJ</p>
                <p class="text-sm text-gray-500">${item.CNPJ}</p>
                </div>
                
                <div class="flex flex-col">
                <p class="text-sm font-semibold text-gray-700">Fim do Contrato</p>
                <p class="text-sm text-gray-500">${formattedEndDate}</p>
                </div>
                </div>
                
                <div class="flex-shrink-0 flex items-center space-x-3 w-full md:w-auto justify-end">
                <button data-id="${item.Id}" class="view-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Visualizar</button>
                <button data-id="${item.Id}" class="edit-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                </div>
                </div>
                `;
                itemsList.appendChild(li);
            });
        }
    }
    // item-id
    // item-legalName
    // item-tradeName
    // item-cnpj
    // item-phoneNumber
    // item-email
    // item-startOperationsDate
    // item-contractEndDate
    // item-endOperationsDate
    // item-state
    function showForm(item = null) {
        if (item) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            formTitle.textContent = 'Editar Item';
            document.getElementById('item-id').value = item.Id;
            document.getElementById('item-legalName').value = item.LegalName;
            document.getElementById('item-tradeName').value = item.TradeName;
            document.getElementById('item-cnpj').value = item.CNPJ
            document.getElementById('item-phoneNumber').value = item.PhoneNumber
            document.getElementById('item-email').value = item.Email
            document.getElementById('item-startOperationsDate').value = item.StartOperationsDate
            document.getElementById('item-contractEndDate').value = item.ContractEndDate
            document.getElementById('item-endOperationsDate').value = item.EndOperationsDate
            document.getElementById('item-state').value = item.State;
        } else {
            formTitle.textContent = 'Adicionar Novo Item';
            itemForm.reset();
        }
        formContainer.classList.remove('hidden');
        addNewBtn.style.display = 'none';
    }

    function hideForm() {
        formContainer.classList.add('hidden');
         addNewBtn.style.display = 'block';
        itemForm.reset();
    }

    // --- EVENT LISTENERS ---
    addNewBtn.addEventListener('click', () => showForm());
    cancelBtn.addEventListener('click', hideForm);

    //             {
    //   "cpf": "string",
    //   "email": "string",
    //   "group": "string",
    //   "name": "string",
    //   "password": "string",
    //   "phoneNumber": "string",
    //   "state": "string"
    // }

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('item-id').value;
        const itemData = {
            legalName: document.getElementById('item-legalName').value,
            tradeName: document.getElementById('item-tradeName').value,
            cnpj: document.getElementById('item-cnpj').value,
            phoneNumber: document.getElementById('item-phoneNumber').value,
            email: document.getElementById('item-email').value,
            startOperationsDate: document.getElementById('item-startOperationsDate').value,
            contractEndDate: document.getElementById('item-contractEndDate').value,
            endOperationsDate: document.getElementById('item-endOperationsDate').value,
            state: document.getElementById('item-state').value,
        };
        console.log(itemData);
        if (id) {
            itemData.id = id;
            updateItem(id, itemData);
        } else {
            createItem(itemData);
        }
    });

    itemsList.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) {
            try {
                const itemData = {
                    id: id
                };
                const response = await apiService.getById(itemData);
                console.log(response);
                showForm(response.data);
            } catch (error) {
                alert(error.message);
            }
        }

        if (e.target.classList.contains('view-btn')) {
            try {
                window.location.href = `empresa_detalhe?id=${id}`;
            } catch (error) {
                alert(error.message);
            }
        }
    });
    // --- INICIALIZAÇÃO ---
    fetchItems();
});


// Espera o documento carregar completamente para garantir que os elementos existam
document.addEventListener('DOMContentLoaded', function () {

    // --- MÁSCARA PARA O CPF ---
    const cnpjInput = document.getElementById('item-cnpj');
    const cnpjMaskOptions = {
        mask: '00.000.000/0000-00'
    };
    const cnpjMask = IMask(cnpjInput, cnpjMaskOptions);

    // --- MÁSCARA PARA O TELEFONE (CELULAR E FIXO) ---
    const phoneInput = document.getElementById('item-phoneNumber');
    const phoneMaskOptions = {
        // A máscara é dinâmica, se adaptando se o número tem 8 ou 9 dígitos
        mask: [
            {
                mask: '(00) 0000-0000',
                maxLength: 10
            },
            {
                mask: '(00) 00000-0000'
            }
        ]
    };
    const phoneMask = IMask(phoneInput, phoneMaskOptions);
});
