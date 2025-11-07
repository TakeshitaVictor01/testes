import { ApiService } from './apiService.js';

//python3 -m http.server 5500
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
            const endpoint = "getEnterpriseAccounts";
            const itemData = { id: enterpriseId };
            const response = await apiService.generic(endpoint, itemData);
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

            const formattedBalance = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(item.Balance);

            // 2. Formata a data de criação para o padrão brasileiro (DD/MM/AAAA)
            let formattedCreationDate = 'Não informada';
            if (item.CreationDate) {
                const [year, month, day] = item.CreationDate.split('T')[0].split('-');
                formattedCreationDate = `${day}/${month}/${year}`;
            }


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


    //     const itemsList = document.getElementById('itemsList'); // Certifique-se de que o ID do seu <ul> ou <ol> é 'itemsList'
    //     itemsList.innerHTML = ''; // Limpa a lista antes de renderizar os novos itens

    //     if (items.length === 0) {
    //         itemsList.innerHTML = '<li class="text-center text-gray-500">Nenhuma conta encontrada.</li>';
    //         return;
    //     }

    //     // items.forEach(item => {
    //     //     const li = document.createElement('li');
    //     //     li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300';

    //     //     // --- Lógica Auxiliar ---
    //     //     // 1. Formata o saldo para o padrão de moeda brasileira (BRL)
    //     //     const formattedBalance = new Intl.NumberFormat('pt-BR', {
    //     //         style: 'currency',
    //     //         currency: 'BRL'
    //     //     }).format(item.Balance);

    //     //     // 2. Formata a data de criação para o padrão brasileiro (DD/MM/AAAA)
    //     //     let formattedCreationDate = 'Não informada';
    //     //     if (item.CreationDate) {
    //     //         const [year, month, day] = item.CreationDate.split('T')[0].split('-');
    //     //         formattedCreationDate = `${day}/${month}/${year}`;
    //     //     }
    //     //     // --- Fim da Lógica Auxiliar ---

    //     //     li.innerHTML = `
    //     //         <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

    //     //             <div class="flex-grow">
    //     //                 <h3 class="font-bold text-lg text-gray-900 truncate">${item.Description}</h3>
    //     //                 <p class="text-sm text-gray-500">Criada em: ${formattedCreationDate}</p>
    //     //             </div>

    //     //             <div class="flex items-center gap-3">
    //     //                 <span class="font-semibold text-gray-800 balance-value" data-balance="${formattedBalance}">
    //     //                     R$ ****
    //     //                 </span>
    //     //                 <button data-id="${item.Id}" class="toggle-balance-btn p-1 text-gray-500 hover:text-gray-800 transition-colors">
    //     //                     <svg class="eye-open h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    //     //                         <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    //     //                         <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    //     //                     </svg>
    //     //                     <svg class="eye-closed h-6 w-6 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    //     //                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
    //     //                     </svg>
    //     //                 </button>
    //     //             </div>

    //     //             <div class="flex-shrink-0 flex items-center space-x-3 w-full sm:w-auto justify-end">
    //     //                 <button data-id="${item.Id}" class="edit-btn text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
    //     //                 <button data-id="${item.Id}" class="delete-btn text-red-600 hover:text-red-800 font-medium transition-colors">Excluir</button>
    //     //             </div>
    //     //         </div>
    //     //     `;
    //     //     itemsList.appendChild(li);
    //     // });
    // }


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
            document.getElementById('id').value = item.Id;
            document.getElementById('description').value = item.Description;
            document.getElementById('balance').value = item.Balance;
        } else {
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
                showForm(response.data);
            } catch (error) {
                alert(error.message);
            }
        }

        if (e.target.classList.contains('view-btn')) {
            try {
                window.location.href = `conta_detalhe.html?id=${id}`;
            } catch (error) {
                alert(error.message);
            }
        }

        if (e.target.classList.contains('toggle-balance-btn')) {
            try {
                const toggleButton = e.target.closest('.toggle-balance-btn');
                // Se o clique não foi em um botão de visualização, não faz nada
                if (!toggleButton) {
                    return;
                }
                // console.log('toggle balance');
                const listItem = toggleButton.closest('li');
                const balanceSpan = listItem.querySelector('.balance-value');
                const eyeOpenIcon = listItem.querySelector('.eye-open');
                const eyeClosedIcon = listItem.querySelector('.eye-closed');

                // Verifica o estado atual (se está oculto ou não)
                const isHidden = balanceSpan.textContent.includes('****');

                if (isHidden) {
                    // Mostra o saldo
                    balanceSpan.textContent = balanceSpan.dataset.balance; // Pega o valor do atributo data-balance
                    eyeOpenIcon.classList.add('hidden');
                    eyeClosedIcon.classList.remove('hidden');
                } else {
                    // Oculta o saldo
                    balanceSpan.textContent = 'R$ ****';
                    eyeOpenIcon.classList.remove('hidden');
                    eyeClosedIcon.classList.add('hidden');
                }
            } catch (error) {
                alert(error.message);
            }
        }




    });
    // --- INICIALIZAÇÃO ---
    fetchItems();
});


// // Espera o documento carregar completamente para garantir que os elementos existam
// document.addEventListener('DOMContentLoaded', function () {

//     // --- MÁSCARA PARA O CPF ---
//     const cnpjInput = document.getElementById('item-cnpj');
//     const cnpjMaskOptions = {
//         mask: '00.000.000/0000-00'
//     };
//     const cnpjMask = IMask(cnpjInput, cnpjMaskOptions);

//     // --- MÁSCARA PARA O TELEFONE (CELULAR E FIXO) ---
//     const phoneInput = document.getElementById('item-phoneNumber');
//     const phoneMaskOptions = {
//         // A máscara é dinâmica, se adaptando se o número tem 8 ou 9 dígitos
//         mask: [
//             {
//                 mask: '(00) 0000-0000',
//                 maxLength: 10
//             },
//             {
//                 mask: '(00) 00000-0000'
//             }
//         ]
//     };
//     const phoneMask = IMask(phoneInput, phoneMaskOptions);
// });
