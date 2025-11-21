import { ApiService } from './apiService.js';

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}


document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH & CONFIG ---
    const token = localStorage.getItem('token');
    const group = localStorage.getItem('userGroup');
    const userId = localStorage.getItem('userId');

    // Verifica se é Admin
    if (!token || group !== 'admin') {
        alert('Acesso negado. Esta área é restrita a administradores.');
        window.location.href = '/login';
        return;
    }

    const apiService = new ApiService('https://megaware.incubadora.shop/incubadora');
    
    // --- ELEMENTOS DOM ---
    const form = document.getElementById('admin-transaction-form');
    const btnSingle = document.getElementById('btn-mode-single');
    const btnMulti = document.getElementById('btn-mode-multi');
    
    const containerSingle = document.getElementById('single-select-container');
    const containerMulti = document.getElementById('multi-select-container');
    
    const companySelect = document.getElementById('company-select');
    const companiesListDiv = document.getElementById('companies-checkbox-list');
    const selectAllBtn = document.getElementById('select-all-btn');
    const selectedCountSpan = document.getElementById('selected-count');
    //const loadingOverlay = document.getElementById('loading-overlay');

    const categorySelect = document.getElementById('category-select');

    // Máscara Monetária
    const amountInput = document.getElementById('amount');
    IMask(amountInput, {
        mask: Number,
        scale: 2,
        signed: false,
        thousandsSeparator: '.',
        padFractionalZeros: true,
        normalizeZeros: true,
        radix: ',',
        mapToRadix: ['.']
    });

    let allCompanies = [];
    let allCategories = [];
    let isMultiMode = false;

    // --- FUNÇÕES AUXILIARES ---
    
    // Alternar Abas (Estilo visual baseando-se nas classes button-primary/secondary)
    function switchMode(mode) {
        isMultiMode = (mode === 'multi');
        
        if (isMultiMode) {
            // Ativa botão Multi
            btnMulti.classList.remove('button-secondary');
            btnMulti.classList.add('button-primary');
            // Desativa botão Single
            btnSingle.classList.remove('button-primary');
            btnSingle.classList.add('button-secondary');

            containerSingle.classList.add('hidden');
            containerMulti.classList.remove('hidden');
        } else {
            // Ativa botão Single
            btnSingle.classList.remove('button-secondary');
            btnSingle.classList.add('button-primary');
            // Desativa botão Multi
            btnMulti.classList.remove('button-primary');
            btnMulti.classList.add('button-secondary');

            containerMulti.classList.add('hidden');
            containerSingle.classList.remove('hidden');
        }
    }

    // Carregar Categorias
    async function loadCategories() {
        try {
            // Ajuste a rota para onde busca as categorias
            const categoryService = new ApiService('https://megaware.incubadora.shop/incubadora/category');
            const response = await categoryService.getGeneric("getAllGlobal");
            
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

    // Carregar Empresas
    async function loadCompanies() {
        try {
            // Ajuste a rota para onde busca as empresas
            const enterpriseService = new ApiService('https://megaware.incubadora.shop/incubadora/enterprise');
            const response = await enterpriseService.getAll();
            
            // Filtra apenas ativas
            allCompanies = response.data.filter(c => c.State === '1');
            
            renderSingleSelect();
            renderMultiSelect();
        } catch (error) {
            console.error(error);
            companiesListDiv.innerHTML = `<p class="text-red-500">Erro ao carregar: ${error.message}</p>`;
        }
    }

    function renderSingleSelect() {
        companySelect.innerHTML = '<option value="" disabled selected>Selecione a empresa...</option>';
        allCompanies.forEach(c => {
            const option = document.createElement('option');
            option.value = c.Id;
            option.textContent = `${c.TradeName} (${c.CNPJ})`;
            companySelect.appendChild(option);
        });
    }

    function renderMultiSelect() {
        companiesListDiv.innerHTML = '';
        if(allCompanies.length === 0) {
            companiesListDiv.innerHTML = '<p>Nenhuma empresa ativa.</p>';
            return;
        }

        allCompanies.forEach(c => {
            // Cria estrutura do checkbox compatível com o CSS existente
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid #f0f0f0';

            div.innerHTML = `
                <input type="checkbox" id="cb-${c.Id}" value="${c.Id}" class="company-checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                <label for="cb-${c.Id}" style="margin-left: 10px; cursor: pointer; width: 100%;">
                    <strong>${c.TradeName}</strong> <br>
                    <small style="color: #777;">${c.CNPJ}</small>
                </label>
            `;
            companiesListDiv.appendChild(div);
        });

        // Listener para contagem
        document.querySelectorAll('.company-checkbox').forEach(cb => {
            cb.addEventListener('change', updateCount);
        });
    }

    function updateCount() {
        const count = document.querySelectorAll('.company-checkbox:checked').length;
        selectedCountSpan.textContent = count;
    }

    // --- EVENT LISTENERS ---

    btnSingle.addEventListener('click', () => switchMode('single'));
    btnMulti.addEventListener('click', () => switchMode('multi'));

    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.company-checkbox');
        // Se todos estiverem marcados, desmarca todos. Se não, marca todos.
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => cb.checked = !allChecked);
        
        selectAllBtn.textContent = allChecked ? 'Selecionar Todas' : 'Deselecionar Todas';
        updateCount();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Validar Dados Comuns
        const description = document.getElementById('description').value;
        const rawAmount = amountInput.value; 
        const dueDate = document.getElementById('dueDate').value;
        const categoryId = categorySelect.value; // Se usar o select de categoria

        // Converte "1.500,00" -> 1500.00
        const amountFloat = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));

        if (!amountFloat || amountFloat <= 0) {
            alert('Insira um valor válido.');
            return;
        }

        // 2. Identificar Empresas Alvo
        let targetIds = [];
        if (isMultiMode) {
            const checkboxes = document.querySelectorAll('.company-checkbox:checked');
            checkboxes.forEach(cb => targetIds.push(cb.value));
            if (targetIds.length === 0) {
                alert('Selecione ao menos uma empresa na lista.');
                return;
            }
        } else {
            if (!companySelect.value) {
                alert('Selecione uma empresa no dropdown.');
                return;
            }
            targetIds.push(companySelect.value);
        }

        if(!confirm(`Confirma o lançamento para ${targetIds.length} empresa(s)?`)) return;

        // 3. Enviar
        //loadingOverlay.classList.remove('hidden'); // Se usar hidden class, remove ela. Ou .style.display = 'flex'
        //loadingOverlay.style.display = 'flex';

        try {
            const financialService = new ApiService('https://megaware.incubadora.shop/incubadora/financial');
            
            /*
            "amount": 0,
            "category": "string",
            "description": "string",
            "dueDate": "2025-11-20",
            "enterpriseId": 0,
            "entryDate": "2025-11-20",
            "entryEmployeeId": 0,
            "type": "string"
            */

            // Cria array de promessas
            const promises = targetIds.map(empId => {
                const payload = {
                    amount: amountFloat,
                    categoryId: categoryId,
                    description: description,
                    dueDate: dueDate,
                    enterpriseId: empId,
                    entryDate: formatarData(new Date()),
                    entryUserId: userId,
                    type: 'Despesa',
                };
                console.log(payload);
                // Ajuste conforme seu método de criação (generic ou create)
                return financialService.generic('createEntry', payload);
            });

            await Promise.all(promises);

            alert('Lançamentos realizados com sucesso!');
            
            // Reset
            form.reset();
            amountInput.value = '';
            document.querySelectorAll('.company-checkbox').forEach(cb => cb.checked = false);
            updateCount();
            // Se estiver em single mode, volta o select
            companySelect.value = "";

        } catch (error) {
            alert('Erro ao processar: ' + error.message);
        } finally {
            //loadingOverlay.classList.add('hidden');
            //loadingOverlay.style.display = 'none';
        }
    });

    // Inicialização
    loadCompanies();
    loadCategories();
});