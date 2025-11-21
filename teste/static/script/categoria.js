import { ApiService } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');
    const enterpriseId = localStorage.getItem('enterpriseId');

    // Validação de Login
    if (!token || !group) {
        alert('Você precisa estar logado para acessar o dashboard.');
        window.location.href = 'login.html';
        return;
    }

    // --- CONFIGURAÇÃO ---
    // Ajuste o endpoint conforme sua API real
    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora/category');
    let currentItems = []; 

    // --- ELEMENTOS DO DOM ---
    const itemsList = document.getElementById('items-ul');
    const itemForm = document.getElementById('item-form');
    const mainContent = document.querySelector('main');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const addNewBtn = document.getElementById('add-new-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const loadingIndicator = document.getElementById('loading');

    // --- MOCK DATA (Para testes se a API falhar ou não existir) ---
    function getMockData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockResponse = {
                    "status": 200,
                    "success": true,
                    "data": [
                        { "Id": 1, "Description": "Alimentação", "EnterpriseId": enterpriseId },
                        { "Id": 2, "Description": "Transporte", "EnterpriseId": enterpriseId },
                        { "Id": 3, "Description": "Lazer", "EnterpriseId": enterpriseId },
                        { "Id": 4, "Description": "Saúde", "EnterpriseId": enterpriseId }
                    ]
                };
                resolve(mockResponse);
            }, 500);
        });
    }

    // --- FUNÇÕES PRINCIPAIS ---

    async function fetchItems() {
        loadingIndicator.style.display = 'block';
        itemsList.innerHTML = '';
        try {
            // --- CHAMADA API ---
            const endpoint = "getAllByEnterprise"; 
            const itemData = { id: enterpriseId };
            
            // Tenta chamar a API, se falhar ou retornar vazio, pode usar o mock (opcional)
            const response = await apiService.generic(endpoint, itemData);
            
            // Se preferir testar com mock, descomente a linha abaixo e comente a apiService
            // const response = await getMockData();

            currentItems = response.data || []; 
            renderItems(currentItems);
        } catch (error) {
            console.error(error);
            itemsList.innerHTML = `<li class="text-red-500 text-center">Erro ao carregar: ${error.message}</li>`;
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
            fetchItems(); 
            hideForm();   
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    }

    // --- RENDERIZAÇÃO ---
    function renderItems(items) {
        itemsList.innerHTML = '';
        if (!items || items.length === 0) {
            itemsList.innerHTML = '<li class="text-center text-gray-500">Nenhuma categoria encontrada.</li>';
            return;
        }
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300';

            li.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 rounded-full text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <h3 class="font-bold text-lg text-gray-800">${item.Description}</h3>
                </div>

                <div class="flex items-center space-x-3">
                    <button data-id="${item.Id}" class="edit-btn text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1">
                        <span>Editar</span>
                    </button>
                    <button data-id="${item.Id}" class="view-btn text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center gap-1">
                        <span>Visualizar</span>
                    </button>
                </div>
            </div>
        `;
            itemsList.appendChild(li);
        });
    }

    // --- CONTROLE DE FORMULÁRIO ---
    function showForm(item = null) {
        if (item) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            formTitle.textContent = 'Editar Categoria';
            document.getElementById('id').value = item.Id;
            document.getElementById('description').value = item.Description;
        } else {
            formTitle.textContent = 'Adicionar Nova Categoria';
            itemForm.reset();
            document.getElementById('id').value = '';
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

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('id').value;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const itemData = {
            description: data.description,
            enterpriseId: enterpriseId
            // Adicione 'id' se for update no objeto, ou passe como argumento
        };
        
        if (id) {
            itemData.id = id;
            updateItem(id, itemData);
        } else {
            createItem(itemData);
        }
    });

    itemsList.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('button[data-id]');
        if (!targetButton) return;

        const id = targetButton.dataset.id;

        // Ação Editar
        if (targetButton.classList.contains('edit-btn')) {
            try {
                // Se você já tem os dados na lista (currentItems), pode pegar direto sem chamar API
                const item = currentItems.find(i => i.Id == id);
                if(item) {
                    showForm(item);
                } else {
                    // Fallback caso não encontre no array local
                    const itemData = { id: id };
                    const response = await apiService.getById(itemData);
                    showForm(response.data);
                }
            } catch (error) {
                alert(error.message);
            }
        }

        // Ação Visualizar
        if (targetButton.classList.contains('view-btn')) {
            // Redireciona para uma página de detalhes (ex: ver transações desta categoria)
            // Ajuste a URL conforme sua estrutura de arquivos
            window.location.href = `categoria_detalhe.html?id=${id}`;
        }
    });

    // Inicializa
    fetchItems();
});