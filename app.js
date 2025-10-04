document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    const apiUrl = 'https://megaware.incubadora.shop/incubadora/user';

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

    // --- LÓGICA DO MENU ---
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
            const response = await fetch(`${apiUrl}/getAll`);
            if (!response.ok) throw new Error('Erro ao buscar dados da API');
            const items = await response.json();
            renderItems(items.data);
        } catch (error) {
            itemsList.innerHTML = `<li class="text-red-500 text-center">${error.message}</li>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function createItem(itemData) {
        try {
            const response = await fetch(`${apiUrl}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
            const data = await response.json();
            console.log(data.status);
            if (data.status != "success")
                throw new Error(`Falha ao criar o item: ${data.message}`);
            fetchItems();
            hideForm();
        } catch (error) {
            alert(error.message);
        }
    }

    async function updateItem(id, itemData) {
        try {
            const response = await fetch(`${apiUrl}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
            console.log(itemData);
            const data = await response.json();
            if (data.status != "success") {
                throw new Error('Falha ao atualizar o item');
            }
            fetchItems();
            hideForm();
        } catch (error) {
            alert(error.message);
        }
    }

   async function deleteItem(id, itemData) {
                // Substituindo confirm() por um modal customizado seria o ideal em uma app real
                if (!confirm('Tem certeza que deseja excluir este item?')) return;
                try {
                    const response = await fetch(`${apiUrl}/delete`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(itemData)
                    });
                    const data = await response.json();
                    console.log(data.status);
                    if (data.status != 'success')
                        throw new Error('Falha ao excluir o item');
                    fetchItems();
                } catch (error) {
                    alert(error.message);
                }
            }

    // --- RENDERIZAÇÃO E MANIPULAÇÃO DO DOM ---
    function renderItems(items) {
        // ... seu código renderItems ...
    }

    function showForm(item = null) {
        // ... seu código showForm ...
    }

    function hideForm() {
        // ... seu código hideForm ...
    }

    // --- EVENT LISTENERS ---
    addNewBtn.addEventListener('click', () => showForm());
    // ... e todos os seus outros event listeners ...

    // --- INICIALIZAÇÃO ---
    fetchItems();
});