// Variáveis para elementos DOM
const userDropdownToggle = document.getElementById('user-dropdown-toggle');
const userDropdownMenu = document.getElementById('user-dropdown-menu');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarButton = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const savedPhoto = localStorage.getItem('userProfilePhoto');
const logoutBtn = document.getElementById('logout-button');


if (savedPhoto) {
  const userIcon = document.querySelector('#user-dropdown-toggle .bg-slate-200');
  userIcon.style.backgroundImage = `url(${savedPhoto})`;
  userIcon.style.backgroundSize = 'cover';
  userIcon.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const group = localStorage.getItem('userGroup');
  // Se não tiver token, volta para login
  if (!token || !group) {
    alert('Você precisa estar logado para acessar o dashboard.');
     window.location.href = 'login.html';
    return;
  }
  if (group !== 'user') {
     window.location.href = 'dashboard_adm.html';
    return;
  }

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
userDropdownToggle.addEventListener('click', () => {
  userDropdownMenu.classList.toggle('hidden');
});

// Fechar dropdown quando clicar fora
document.addEventListener('click', (e) => {
  if (!userDropdownToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
    userDropdownMenu.classList.add('hidden');
  }
});

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
    reader.onload = function(event) {
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