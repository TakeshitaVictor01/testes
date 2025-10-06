import { ApiService } from './apiService.js';

//python3 -m http.server 5500
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora/user');
    // --- ELEMENTOS DO DOM ---
    const itemsList = document.getElementById('items-ul');
    const itemForm = document.getElementById('item-form');
    const mainContent = document.querySelector('main');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const addNewBtn = document.getElementById('add-new-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingIndicator = document.getElementById('loading');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');

    // --- LÓGICA DO MENU DE USUÁRIO ---
    userMenuButton.addEventListener('click', () => {
        userMenu.classList.toggle('hidden');
    });

    // Fecha o menu se clicar fora dele
    window.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
    });

    // --- FUNÇÕES DA API (CRUD) ---
    async function fetchItems() {
        loadingIndicator.style.display = 'block';
        itemsList.innerHTML = '';
        try {
            const response = await apiService.getAll();
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

    async function deleteItem(id, itemData) {
        // Substituindo confirm() por um modal customizado seria o ideal em uma app real
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            await apiService.delete(itemData);
            fetchItems();
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
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300';

            // --- Lógica Auxiliar ---
            // 1. Define o texto e a cor do selo de status
            const isActive = item.State === '1';
            const statusText = isActive ? 'Ativo' : 'Inativo';
            const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            // 2. Formata a data de criação para o padrão brasileiro (DD/MM/AAAA)
            let formattedCreationDate = 'Não definida';
            if (item.CreationDate) {
                const creationDate = new Date(item.CreationDate);
                // Opções para garantir que a data seja formatada corretamente
                const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
                formattedCreationDate = creationDate.toLocaleDateString('pt-BR', options);
            }
            // --- Fim da Lógica Auxiliar ---

            li.innerHTML = `
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div class="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 w-full">
                
                <div class="flex flex-col">
                    <div class="flex items-center gap-3 mb-1">
                        <h3 class="font-bold text-lg text-gray-900 truncate">${item.Name}</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                            ${statusText}
                        </span>
                    </div>
                    <p class="text-sm text-gray-500">${item.Email}</p>
                </div>

                <div class="flex flex-col">
                    <p class="text-sm font-semibold text-gray-700">CPF</p>
                    <p class="text-sm text-gray-500">${item.CPF}</p>
                </div>

                <div class="flex flex-col">
                     <p class="text-sm font-semibold text-gray-700">Grupo</p>
                     <div class="flex items-center gap-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                           ${item.Group}
                        </span>
                        <p class="text-xs text-gray-400">(${formattedCreationDate})</p>
                     </div>
                </div>

            </div>

            <div class="flex-shrink-0 flex items-center space-x-3 w-full md:w-auto justify-end mt-2 md:mt-0">
                <button data-id="${item.Id}" class="edit-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                <button data-id="${item.Id}" class="delete-btn text-red-600 hover:text-red-800 font-medium transition-colors">Excluir</button>
            </div>
        </div>
    `;
            itemsList.appendChild(li);
        });
    }

    // item-id
    // item-name
    // item-email
    // item-cpf
    // item-phoneNumber
    // item-group
    // item-state
    // item-password

    function showForm(item = null) {
        const passwordInput = document.getElementById('item-password');
        const passwordLabel = document.querySelector('label[for="item-password"]');
        if (item) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            formTitle.textContent = 'Editar Item';
            document.getElementById('item-id').value = item.Id;
            document.getElementById('item-name').value = item.Name;
            document.getElementById('item-email').value = item.Email;
            document.getElementById('item-cpf').value = item.CPF;
            document.getElementById('item-phoneNumber').value = item.PhoneNumber;
            document.getElementById('item-group').value = item.Group;
            document.getElementById('item-state').value = item.State;
            passwordInput.style.display = 'none';
            if (passwordLabel) {
                passwordLabel.style.display = 'none';
            }
            passwordInput.removeAttribute('required');
        } else {
            passwordInput.style.display = 'block';
            if (passwordLabel) {
                passwordLabel.style.display = 'block';
            }
            passwordInput.setAttribute('required', '');
            formTitle.textContent = 'Adicionar Novo Item';
            itemForm.reset();
        }
        formContainer.classList.remove('hidden');
        addNewBtn.classList.add('hidden');
    }

    function hideForm() {
        formContainer.classList.add('hidden');
        addNewBtn.classList.remove('hidden');
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
            name: document.getElementById('item-name').value,
            email: document.getElementById('item-email').value,
            cpf: document.getElementById('item-cpf').value,
            phoneNumber: document.getElementById('item-phoneNumber').value,
            group: document.getElementById('item-group').value,
            state: document.getElementById('item-state').value,
            password: document.getElementById('item-password').value,
        };
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

        if (e.target.classList.contains('delete-btn')) {
            const itemData = {
                id: id
            };
            deleteItem(id, itemData);
        }

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
    });
    // --- INICIALIZAÇÃO ---
    fetchItems();
});


// Espera o documento carregar completamente para garantir que os elementos existam
document.addEventListener('DOMContentLoaded', function () {

    // --- MÁSCARA PARA O CPF ---
    const cpfInput = document.getElementById('item-cpf');
    const cpfMaskOptions = {
        mask: '000.000.000-00'
    };
    const cpfMask = IMask(cpfInput, cpfMaskOptions);

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
