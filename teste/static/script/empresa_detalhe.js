import { ApiService } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    // ATENÇÃO: Ajuste as URLs base para os seus endpoints de empresa e funcionário
    const companyApiService = new ApiService('https://megaware.incubadora.shop/incubadora/enterprise');
    const employeeApiService = new ApiService('https://megaware.incubadora.shop/incubadora/employee');
    const userApiService = new ApiService('https://megaware.incubadora.shop/incubadora/user');

    // --- ELEMENTOS DO DOM (EMPRESA) ---
    const companyTradeName = document.getElementById('company-tradeName-title');
    const companyLegalName = document.getElementById('company-legalName-subtitle');
    const companyStatusBadge = document.getElementById('company-status-badge');
    const companyCnpj = document.getElementById('company-cnpj');
    const companyPhoneNumber = document.getElementById('company-phoneNumber');
    const companyEmail = document.getElementById('company-email');
    const companyStartDate = document.getElementById('company-startOperationsDate');
    const companyContractEnd = document.getElementById('company-contractEndDate');
    const companyEndDate = document.getElementById('company-endOperationsDate');

    const openModalBtn = document.getElementById('add-employee-btn');
    const modal = document.getElementById('add-employee-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const cancelModalBtn = document.getElementById('modal-cancel-btn');
    const userListContainer = document.getElementById('modal-user-list');

    // --- ELEMENTOS DO DOM (FUNCIONÁRIOS) ---
    const employeeListBody = document.getElementById('employee-list-body');
    const employeeRowTemplate = document.getElementById('employee-row-template');

    // --- ELEMENTOS DO DOM (AÇÕES) ---
    const backBtn = document.getElementById('back-btn');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');

    const labelEmployees = document.getElementById('label-employes');
    // const addEmployeeBtn = document.getElementById('add-employee-btn');

    // --- FUNÇÕES DE LÓGICA PRINCIPAL ---

    // Função para abrir o modal
    const openModal = () => {
        modal.classList.remove('hidden');
        // Ao abrir, busca e exibe os usuários
        fetchAndDisplayUsers();
    };

    // Função para fechar o modal
    const closeModal = () => {
        modal.classList.add('hidden');
        fetchEmployees(companyId);
    };



    // Função para buscar e exibir os usuários no modal (simulação)
    const fetchAndDisplayUsers = async () => {
        // Limpa a lista e mostra o estado de "carregando"
        userListContainer.innerHTML = '<p class="text-center text-gray-500 p-4">Carregando usuários...</p>';

        try {
            const endpoint = "getAllNotInEnterprise";
            const itemData = { entepriseId: companyId };
            const response = await userApiService.getByGenericParameter(endpoint, itemData);
            userListContainer.innerHTML = '';
            const users = response.data || [];
            if (users.length === 0) {
                userListContainer.innerHTML = '<p class="text-center text-gray-500 p-4">Nenhum usuário encontrado.</p>';
                return;
            }

            users.forEach(user => {
                const userElement = document.createElement('div');
                // Mantemos o flexbox principal para o alinhamento geral
                userElement.className = 'flex items-center justify-between p-3 hover:bg-gray-100 rounded-md';

                // O HTML agora inclui um contêiner para o combobox e o botão, alinhados à direita
                userElement.innerHTML = `
        <div>
            <span class="font-medium text-gray-900">${user.Name}</span>
            <p class="text-sm text-gray-500">${user.Email}</p>
        </div>

        <div class="flex items-center space-x-4">
            <select 
                data-user-role-id="${user.Id}"
                class="cargo-select bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5">
                <option selected disabled>Selecione o cargo</option>
                <option value="1">Proprietário</option>
                <option value="2">Colaborador</option>
            </select>

            <button 
                data-user-id="${user.Id}"
                class="add-user-btn bg-green-600 text-white font-semibold py-1 px-3 rounded-lg shadow-md hover:bg-green-700 transition-all text-sm whitespace-nowrap">
                Adicionar
            </button>
        </div>
    `;

                userListContainer.appendChild(userElement);

                const addButton = userElement.querySelector('.add-user-btn');
                addButton.addEventListener('click', async () => {
                    // 2. Capturamos o valor selecionado no combobox específico deste usuário
                    const roleSelect = userElement.querySelector(`.cargo-select[data-user-role-id="${user.Id}"]`);
                    const selectedRole = roleSelect.value;
                    const selectedRoleText = roleSelect.options[roleSelect.selectedIndex].text;

                    // Validação para garantir que um cargo foi selecionado
                    if (selectedRole === 'Selecione o cargo') {
                        alert('Por favor, selecione um cargo para o usuário.');
                        return; // Interrompe a execução se nenhum cargo foi escolhido
                    }
                    const itemData = {
                        enterpriseId: companyId,
                        userId: user.Id,
                        roleId: selectedRole
                    };
                    await employeeApiService.create(itemData);

                    alert(`Adicionado o usuário: ${user.Name} como ${selectedRoleText}`);
                    // Feedback visual, desabilitando o botão e o select
                    addButton.textContent = 'Adicionado';
                    addButton.disabled = true;
                    addButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                    addButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                    roleSelect.disabled = true;
                });
            });

            // Cria o HTML para cada usuário e adiciona à lista
            // users.forEach(user => {
            //     const userElement = document.createElement('label');
            //     userElement.className = 'flex items-center p-3 hover:bg-gray-100 rounded-md cursor-pointer';
            //     userElement.innerHTML = `
            //         <div class="ml-4">
            //             <span class="font-medium text-gray-900">${user.Name}</span>
            //             <p class="text-sm text-gray-500">${user.Email}</p>
            //         </div>
            //     `;
            //     userListContainer.appendChild(userElement);
            // });

        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            userListContainer.innerHTML = '<p class="text-center text-red-500 p-4">Falha ao carregar usuários.</p>';
        }
    };

    // Adiciona os event listeners
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Event listener para fechar o modal ao clicar fora da área de conteúdo
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    /**
     * Pega o ID da empresa a partir do parâmetro 'id' na URL.
     * @returns {string|null} O ID da empresa ou null se não for encontrado.
     */
    function getCompanyIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    /**
     * Busca e renderiza os detalhes da empresa.
     * @param {string} id - O ID da empresa.
     */
    async function fetchCompanyDetails(id) {
        try {
            const response = await companyApiService.getById({ id: id }); // Assumindo que seu getById aceita um objeto com id
            renderCompanyDetails(response.data);
        } catch (error) {
            document.querySelector('.container').innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        }
    }

    /**
     * Busca e renderiza os funcionários associados a uma empresa.
     * @param {string} companyId - O ID da empresa.
     */
    async function fetchEmployees(companyId) {
        try {
            const endpoint = "getAllByEnterprise";
            const itemData = { id: companyId };
            const response = await employeeApiService.getByGenericParameter(endpoint, itemData);
            renderEmployees(response.data);
        } catch (error) {
            employeeListBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }

    /**
     * Exclui a empresa atual após confirmação.
     * @param {string} companyId - O ID da empresa a ser excluída.
     */
    async function deleteCompany(companyId) {
        if (!confirm('Tem certeza que deseja excluir esta empresa e todos os seus dados? Esta ação é irreversível.')) {
            return;
        }
        try {
            await companyApiService.delete({ id: companyId }); // Assumindo que o delete aceita um objeto com id
            alert('Empresa excluída com sucesso.');
            window.location.href = 'empresa.html'; // Redireciona para a lista
        } catch (error) {
            alert(`Erro ao excluir a empresa: ${error.message}`);
        }
    }


    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    /**
     * Preenche a interface com os detalhes da empresa.
     * @param {object} company - O objeto da empresa retornado pela API.
     */
    function renderCompanyDetails(company) {
        companyTradeName.textContent = company.TradeName || 'Nome Fantasia não informado';
        companyLegalName.textContent = company.LegalName || 'Razão Social não informada';
        companyCnpj.textContent = company.CNPJ || '-';
        companyPhoneNumber.textContent = company.PhoneNumber || '-';
        companyEmail.textContent = company.Email || '-';

        // Formatação de datas (DD/MM/AAAA)
        const formatDate = (dateString) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // UTC para evitar problemas de fuso
        };

        companyStartDate.textContent = formatDate(company.StartOperationsDate);
        companyContractEnd.textContent = formatDate(company.ContractEndDate);
        companyEndDate.textContent = formatDate(company.EndOperationsDate);

        // Lógica do selo de status
        companyStatusBadge.innerHTML = ''; // Limpa o conteúdo anterior
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('px-3', 'py-1', 'text-sm', 'font-semibold', 'rounded-full');
        if (company.State === '1') {
            statusSpan.textContent = 'Ativo';
            statusSpan.classList.add('text-green-800', 'bg-green-100');
        } else {
            statusSpan.textContent = 'Inativo';
            statusSpan.classList.add('text-red-800', 'bg-red-100');
        }
        companyStatusBadge.appendChild(statusSpan);
    }

    /**
     * Renderiza a lista de funcionários na tabela usando um template.
     * @param {Array<object>} employees - Uma lista de objetos de funcionários.
     */
    function renderEmployees(employees) {
        employeeListBody.innerHTML = ''; // Limpa o estado de "Carregando..."
        if (!employees || employees.length === 0) {
            employeeListBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum funcionário encontrado.</td></tr>`;
            return;
        }

        employees.forEach(employee => {
            const clone = employeeRowTemplate.content.cloneNode(true);
            const cells = {
                name: clone.querySelector('[data-name]'),
                email: clone.querySelector('[data-email]'),
                role: clone.querySelector('[data-role]'),
                status: clone.querySelector('[data-status]'),
                editBtn: clone.querySelector('[data-edit-btn]'),
                deleteBtn: clone.querySelector('[data-delete-btn]'),
            };
            cells.name.textContent = employee.User.Name;
            cells.email.textContent = employee.User.Email;
            cells.role.textContent = employee.Role || 'Não definido'; // Ajuste a propriedade 'role'

            // Lógica do selo de status do funcionário
            if (employee.User.State === '1') {
                cells.status.textContent = 'Ativo';
                cells.status.classList.add('bg-green-100', 'text-green-800');
            } else {
                cells.status.textContent = 'Inativo';
                cells.status.classList.add('bg-red-100', 'text-red-800');
            }

            // Adiciona IDs aos botões para futuras ações
            cells.editBtn.dataset.employeeId = employee.Id;
            cells.deleteBtn.dataset.employeeId = employee.Id;

            employeeListBody.appendChild(clone);
        });
    }

    // --- EVENT LISTENERS ---
    const companyId = getCompanyIdFromUrl();

    if (companyId) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'empresa.html'; // ATENÇÃO: Ajuste para a URL da sua página de listagem
        });

        editBtn.addEventListener('click', () => {
            window.location.href = `empresa-form.html?id=${companyId}`; // ATENÇÃO: Ajuste para a URL do seu formulário
        });

        deleteBtn.addEventListener('click', () => deleteCompany(companyId));

        // Listener para futuras ações na lista de funcionários (ex: editar/excluir funcionário)
        employeeListBody.addEventListener('click', async (e) => {
            const employeeId = e.target.dataset.employeeId;
            if (!employeeId) return;

            if (e.target.matches('[data-edit-btn]')) {
                console.log(`Editar funcionário ${employeeId}`);
                // Lógica para abrir modal ou redirecionar para formulário de funcionário
            }
            if (e.target.matches('[data-delete-btn]')) {
                if (!confirm('Tem certeza que deseja desvincular este funcionario?')) return;
                try {
                    const itemData = { id: employeeId };
                    await employeeApiService.delete(itemData);
                    alert('Funcionário desvinculado com sucesso.');
                    fetchEmployees(companyId);
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    async function initializePage() {
        if (!companyId) {
            document.querySelector('.container').innerHTML = `<h2 class="text-2xl font-bold text-red-600 text-center">ID da empresa não fornecido na URL.</h2>`;
            return;
        }

        // Carrega os dados da empresa e dos funcionários em paralelo
        await Promise.all([
            fetchCompanyDetails(companyId),
            fetchEmployees(companyId)
        ]);
    }

    initializePage();
});