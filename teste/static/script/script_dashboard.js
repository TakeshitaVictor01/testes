import { ApiService } from '/static/script/apiService.js';

// Variáveis para elementos DOM
// const userDropdownToggle = document.getElementById('user-dropdown-toggle');
// const userDropdownMenu = document.getElementById('user-dropdown-menu');

const apiService = new ApiService('https://megaware.incubadora.shop/incubadora/enterprise');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarButton = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const savedPhoto = localStorage.getItem('userProfilePhoto');
const linkLogout = document.getElementById('user-logout');
const userToggle = document.getElementById('user-dropdown-toggle');
const userMenu = document.getElementById('user-dropdown-menu');
const companyToggle = document.getElementById('company-switcher-toggle');
const companyMenu = document.getElementById('company-switcher-menu');

// Elementos dinâmicos da empresa
const companyDisplayName = document.getElementById('company-display-name');
const companyListContainer = document.getElementById('company-list-container');
// document.addEventListener('DOMContentLoaded', function() {

//   // Elementos do Dropdown de Usuário
//   const userToggle = document.getElementById('user-dropdown-toggle');
//   const userMenu = document.getElementById('user-dropdown-menu');

//   // Função para fechar ambos os menus
//   // function closeAllMenus() {
//   //   userMenu.classList.add('hidden');
//   //   companyMenu.classList.add('hidden');
//   // }

//   // Abrir/Fechar Dropdown de Usuário
//   userToggle.addEventListener('click', function(event) {
//     event.stopPropagation(); // Impede que o clique feche o menu imediatamente
//     companyMenu.classList.add('hidden'); // Fecha o outro menu
//     userMenu.classList.toggle('hidden');
//   });

//   // Abrir/Fechar Dropdown de Empresa
//   companyToggle.addEventListener('click', function(event) {
//     event.stopPropagation();
//     userMenu.classList.add('hidden'); // Fecha o outro menu
//     companyMenu.classList.toggle('hidden');
//   });

//   // Fechar os menus se clicar fora
//   window.addEventListener('click', function(event) {
//     // Verifica se o clique foi fora dos menus e dos botões
//     if (!userToggle.contains(event.target) && !userMenu.contains(event.target) &&
//         !companyToggle.contains(event.target) && !companyMenu.contains(event.target)) {
//       closeAllMenus();
//     }
//   });

//   // (Seu código original para o sidebar-toggle iria aqui)
//   // const sidebarToggle = document.getElementById('sidebar-toggle');
//   // ...
// });

if (savedPhoto) {
  const userIcon = document.querySelector('#user-dropdown-toggle .bg-slate-200');
  userIcon.style.backgroundImage = `url(${savedPhoto})`;
  userIcon.style.backgroundSize = 'cover';
  userIcon.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  let allCompanies = []; // Armazena a lista de empresas da API
  let currentCompanyId = null; // Armazena o ID da empresa ativa

  const token = localStorage.getItem('token');
  const group = localStorage.getItem('userGroup');
  const userId = localStorage.getItem('userId');

  // Se não tiver token, volta para login
  if (!token || !group) {
    alert('Você precisa estar logado para acessar o dashboard.');
    window.location.href = 'login';
    return;
  }
  if (group !== 'user') {
    window.location.href = 'dashboard_adm';
    return;
  }

  /**
   * (Esta é a função que você deve preencher)
   * Chamada quando a empresa é trocada.
   * Use este local para recarregar os dados do seu dashboard.
   */
  function refreshDashboardData(companyId) {
    console.log(`Iniciando atualização de dados para a Empresa ID: ${companyId}`);

    // EXEMPLO:
    // 1. Mostrar um loading no seu dashboard
    //    document.getElementById('dashboard-content').innerHTML = 'Carregando...';
    // 2. Fazer um fetch para a sua API com o novo ID
    //    fetch(`/api/dashboard-data?company_id=${companyId}`)
    //      .then(response => response.json())
    //      .then(data => {
    //        // 3. Renderizar os novos dados (gráficos, tabelas, etc.)
    //        console.log('Dados recebidos:', data);
    //        // document.getElementById('dashboard-content').innerHTML = ...
    //      })
    //      .catch(error => {
    //        console.error('Erro ao buscar dados do dashboard:', error);
    //        // document.getElementById('dashboard-content').innerHTML = 'Erro ao carregar dados.';
    //      });
  }

  /**
   * Atualiza o nome da empresa na barra superior.
   */
  function updateActiveCompanyDisplay() {
    const activeCompany = allCompanies.find(c => c.Id == currentCompanyId);
    if (activeCompany) {
      companyDisplayName.textContent = activeCompany.TradeName;
    } else {
      companyDisplayName.textContent = "Nenhuma empresa";
    }
  }

  /**
   * Renderiza a lista de empresas no dropdown.
   */
  function renderCompanyList() {
    // Limpa a lista antiga
    companyListContainer.innerHTML = '';

    if (allCompanies.length === 0) {
      companyListContainer.innerHTML = '<span class="block px-4 py-2 text-sm text-gray-500">Nenhuma empresa encontrada.</span>';
      return;
    }

    allCompanies.forEach(company => {
      const isActive = (company.Id == currentCompanyId);
      // Cria o link (<a>) para cada empresa
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';
      link.setAttribute('role', 'menuitem');
      link.setAttribute('data-company-id', company.Id); // Armazena o ID no próprio elemento

      const nameSpan = document.createElement('span');
      nameSpan.textContent = company.TradeName;
      link.appendChild(nameSpan);

      if (isActive) {
        link.classList.add('font-medium'); // Opcional: negrito para o ativo
        const checkmarkSVG = `
          <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>`;
        link.insertAdjacentHTML('beforeend', checkmarkSVG);
      }
      companyListContainer.appendChild(link);
    });
  }

  /**
   * Lida com a seleção de uma nova empresa.
   */
  function handleCompanySelect(event) {
    event.preventDefault();
    const link = event.target.closest('[data-company-id]');

    if (!link) return; // Sai se o clique não foi em um link de empresa

    const newCompanyId = link.dataset.companyId;

    // Se já for a empresa ativa, apenas fecha o menu
    if (newCompanyId == currentCompanyId) {
      closeAllMenus();
      return;
    }

    // Define a nova empresa como ativa
    currentCompanyId = newCompanyId;
    localStorage.setItem('enterpriseId', currentCompanyId); // Salva a escolha

    // Atualiza a UI
    updateActiveCompanyDisplay();
    renderCompanyList(); // Re-renderiza a lista para mover o "check"
    closeAllMenus();

    // ** PONTO CRÍTICO: Recarrega os dados do dashboard **
    refreshDashboardData(currentCompanyId);
  }

  /**
   * Busca os dados da API.
   */
  async function loadUserCompanies() {
    try {
      // --- SUBSTITUA PELA SUA URL DE API REAL ---
      const endpoint = "getByAssociateUser";
      const itemData = { id: userId };
      const response = await apiService.generic(endpoint, itemData);

      // Vamos supor que sua API retorna um array de objetos:
      // [ { "id": 1, "name": "Empresa A" }, { "id": 2, "name": "Empresa B" } ]
      const data = await response.data;
      allCompanies = data;

      // Define qual empresa será a ativa
      const savedCompanyId = localStorage.getItem('enterpriseId');

      if (savedCompanyId && allCompanies.some(c => c.Id == savedCompanyId)) {
        // Se o usuário já tinha uma empresa salva E ela ainda existe na lista
        currentCompanyId = savedCompanyId;
      } else if (allCompanies.length > 0) {
        // Senão, pega a primeira empresa da lista
        currentCompanyId = allCompanies[0].Id;
        localStorage.setItem('enterpriseId', currentCompanyId); // Salva para a próxima vez
      }

    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      companyDisplayName.textContent = 'Erro ao carregar';
      companyListContainer.innerHTML = '<span class="block px-4 py-2 text-sm text-red-500">Erro ao carregar empresas.</span>';
    } finally {
      // Independentemente de sucesso ou falha, renderiza o que tiver
      renderCompanyList();
      updateActiveCompanyDisplay();

      // Carrega os dados do dashboard pela primeira vez
      if (currentCompanyId) {
        refreshDashboardData(currentCompanyId);
      }
    }
  }

  // --- CONTROLE DOS DROPDOWNS ---

  function closeAllMenus() {
    userMenu.classList.add('hidden');
    companyMenu.classList.add('hidden');
  }

  userToggle.addEventListener('click', function (event) {
    event.stopPropagation();
    companyMenu.classList.add('hidden');
    userMenu.classList.toggle('hidden');
  });

  companyToggle.addEventListener('click', function (event) {
    event.stopPropagation();
    userMenu.classList.add('hidden');
    companyMenu.classList.toggle('hidden');
  });

  window.addEventListener('click', function (event) {
    if (!userToggle.contains(event.target) && !userMenu.contains(event.target) &&
      !companyToggle.contains(event.target) && !companyMenu.contains(event.target)) {
      closeAllMenus();
    }
  });

  function logoutUser(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('enterpriseId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userGroup');
    window.location.href = 'login.html';
  }


  // Adiciona o "ouvinte" de clique no container da lista de empresas
  companyListContainer.addEventListener('click', handleCompanySelect);
  linkLogout.addEventListener('click', logoutUser);

  // --- INICIALIZAÇÃO ---
  // Inicia o processo de busca de dados da API assim que a página carrega.
  loadUserCompanies();




  // // Elementos do Dropdown de Empresa
  // function closeAllMenus() {
  //   // userMenu.classList.add('hidden');
  //   companyMenu.classList.add('hidden');
  // }

  // //   userToggle.addEventListener('click', function(event) {
  // //   event.stopPropagation(); // Impede que o clique feche o menu imediatamente
  // //   companyMenu.classList.add('hidden'); // Fecha o outro menu
  // //   userMenu.classList.toggle('hidden');
  // // });

  // // Abrir/Fechar Dropdown de Empresa
  // companyToggle.addEventListener('click', function (event) {
  //   event.stopPropagation();
  //   // userMenu.classList.add('hidden'); // Fecha o outro menu
  //   companyMenu.classList.toggle('hidden');
  // });

  // // Fechar os menus se clicar fora
  // window.addEventListener('click', function (event) {
  //   // Verifica se o clique foi fora dos menus e dos botões
  //   if (!companyToggle.contains(event.target) && !companyMenu.contains(event.target)) {
  //     closeAllMenus();
  //   }
  // });


  //   try {
  //     // Exemplo de validação no servidor (se sua API tiver rota /validate ou /me)
  //     const response = await fetch('http://127.0.0.1:5000/incubadora/me', {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (!response.ok) {
  //       throw new Error('Token inválido');
  //     }

  //     const user = await response.json();
  //     console.log('Usuário logado:', user);

  //     // Aqui você pode exibir dados do usuário
  //     document.body.insertAdjacentHTML('beforeend', `<p>Logado como: ${user.data.email}</p>`);

  //   } catch (error) {
  //     alert('Sessão expirada ou inválida. Faça login novamente.');
  //     localStorage.removeItem('token');
  //     window.location.href = 'login.html';
  //   }
});

// Logout
// logoutBtn.addEventListener('click', () => {
//   localStorage.removeItem('token');
//   window.location.href = 'login.html';
// });


// Mostrar/esconder dropdown de usuário
// userDropdownToggle.addEventListener('click', () => {
//   userDropdownMenu.classList.toggle('hidden');
// });

// // Fechar dropdown quando clicar fora
// document.addEventListener('click', (e) => {
//   if (!userDropdownToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
//     userDropdownMenu.classList.add('hidden');
//   }
// });

// Mostrar/esconder sidebar no mobile
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
});

closeSidebarButton.addEventListener('click', () => {
  sidebar.classList.add('-translate-x-full');
});

document.getElementById('upload-photo').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const userIcon = document.querySelector('#user-dropdown-toggle .bg-slate-200');
      userIcon.style.backgroundImage = `url(${event.target.result})`;
      userIcon.style.backgroundSize = 'cover';
      userIcon.innerHTML = ''; // Remove o SVG

      // Armazena a imagem no localStorage
      localStorage.setItem('userProfilePhoto', event.target.result);
    };
    reader.readAsDataURL(file);
  }
});