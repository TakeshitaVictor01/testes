document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const scrollButtons = document.querySelectorAll('[id^="scroll-down-button"]');

  // --- Elementos do Input Senha ---
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon'); 
  
  // Ícones SVG Corrigidos com paths das suas imagens (ViewBox 0 0 24 24 assumido)
  // Olho Aberto (image_fd00f0.png) - Ícone limpo de visibilidade
  const EYE_OPEN_PATH = `<path stroke-linecap="round" d="M12 4.5c4.71 0 8.8 3.51 9.5 8 0 0 0 0 0 0s-4.79 8-9.5 8c-4.71 0-8.8-3.51-9.5-8 0 0 0 0 0 0s4.79-8 9.5-8zM12 15a3 3 0 100-6 3 3 0 000 6z" />`;
  // Olho Fechado/Riscado (image_fd012b.png) - Ícone de ocultar
  const EYE_CLOSED_PATH = `<path stroke-linecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.419 0-8-1.748-8-4 0-2.252 3.581-4 8-4s8 1.748 8 4a10.05 10.05 0 01-1.875 3.825M12 11c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zM4.5 19.5L19.5 4.5" />`;


  // Define o ícone inicial (olho fechado)
  if (eyeIcon) {
      eyeIcon.innerHTML = EYE_CLOSED_PATH;
  }
  
  // --- Elementos do Chatbot ---
  const openChatbotButton = document.getElementById('open-chatbot-button');
  const chatbotFab = document.getElementById('chatbot-fab'); 
  
  const closeChatbotButton = document.getElementById('close-chatbot-button');
  const chatbotPanel = document.getElementById('chatbot-panel');

  const chatMessagesContainer = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendButton = document.getElementById('chat-send-button');
  
  const chatSuggestionsContainer = document.getElementById('chat-suggestions');

  const chatClearButton = document.getElementById('chat-clear');


  // --- Sugestões para o Chatbot ---
  const SUGGESTION_QUESTIONS = [
    "Como funciona o processo de incubação?",
    "Quais serviços e benefícios a Garça oferece?",
    "Quais são os módulos do Startup Overseer?",
    "Quem desenvolveu o sistema?",
  ];
  
  const DEFAULT_PROMPT = "Inicie a conversa me perguntando 'Quem é a Acrova AI?'";


  // --- Lógica de Visualização de Senha ---
  if (togglePasswordButton) {
      togglePasswordButton.addEventListener('click', () => {
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          
          // Altera o ícone
          if (type === 'text') {
              eyeIcon.innerHTML = EYE_OPEN_PATH;
          } else {
              eyeIcon.innerHTML = EYE_CLOSED_PATH;
          }
      });
  }


  // --- Funções de Chatbot (Mantidas) ---

  /**
   * Renderiza os botões de sugestão.
   */
  function renderSuggestions() {
    chatSuggestionsContainer.innerHTML = '';
    SUGGESTION_QUESTIONS.forEach(question => {
      const button = document.createElement('button');
      button.classList.add('px-3', 'py-1', 'bg-white', 'text-brand-teal', 'border', 'border-brand-teal', 'rounded-full', 'text-xs', 'hover:bg-brand-teal/10', 'transition-all');
      button.textContent = question;
      button.addEventListener('click', () => {
        chatInput.value = question;
        sendMessage();
      });
      chatSuggestionsContainer.appendChild(button);
    });
  }


  /**
   * Adiciona uma nova mensagem ao container de mensagens.
   */
  function appendMessage(text, sender) {
    const messageWrapper = document.createElement('div');
    const messageBubble = document.createElement('div');

    messageBubble.classList.add('p-3', 'rounded-xl', 'max-w-[80%]', 'shadow-sm', 'text-sm');

    if (sender === 'user') {
      messageWrapper.classList.add('flex', 'justify-end');
      messageBubble.classList.add('bg-brand-teal', 'text-white');
      
      // Remove sugestões após a primeira pergunta do usuário
      chatSuggestionsContainer.innerHTML = ''; 
    } else { // 'ai'
      messageWrapper.classList.add('flex', 'justify-start');
      messageBubble.classList.add('bg-slate-200', 'text-slate-800');
    }
    
    // Processar o texto, substituindo negrito markdown (**) por <strong>
    const processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageBubble.innerHTML = processedText;

    messageWrapper.appendChild(messageBubble);
    chatMessagesContainer.appendChild(messageWrapper);
    
    // Rola para o final da conversa
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
  
  /**
   * Envia um comando POST para a rota de limpeza no Back-End.
   */
  async function clearAiHistory() {
      try {
          const response = await fetch('http://127.0.0.1:5000/api/chatbot/clear-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
              const data = await response.json();
              return data.status === 'success';
          }
          return false;
      } catch (error) {
          console.error('Erro de conexão ao limpar histórico:', error);
          return false;
      }
  }

  /**
   * Função principal para enviar a mensagem (USANDO 127.0.0.1).
   */
  async function sendMessage() {
    let userMessage = chatInput.value.trim();
    
    if (userMessage === '') {
        userMessage = DEFAULT_PROMPT;
    }

    // 1. Exibe a mensagem do usuário (pode ser a padrão)
    appendMessage(userMessage, 'user');
    chatInput.value = ''; // Limpa o input
    chatInput.disabled = true; // Desabilita input enquanto espera a IA
    chatSendButton.disabled = true;

    try {
      // Chamada usando o IP numérico (mais estável)
      const response = await fetch('http://127.0.0.1:5000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      const aiResponse = data.response || "Erro: Não foi possível obter uma resposta do servidor. Tente novamente.";

      // 2. Exibe a resposta da IA
      appendMessage(aiResponse, 'ai');

    } catch (error) {
      console.error('Erro na comunicação com o chatbot Flask:', error);
      appendMessage("Desculpe, a **Acrova AI** está offline. Verifique se o servidor Flask está rodando na porta 5000.", 'ai');
    } finally {
      chatInput.disabled = false;
      chatSendButton.disabled = false;
      chatInput.focus();
    }
  }

  // --- Atribuição de Eventos do Chatbot ---

  chatSendButton.addEventListener('click', sendMessage);

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });


  // --- Lógica de Login (USANDO 127.0.0.1) ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginButton.disabled = true;
    loginButton.innerHTML = `<div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`;

    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = rememberMeCheckbox.checked;

    try {
      // Chamada de autenticação (usando 127.0.0.1)
      const response = await fetch('https://megaware.incubadora.shop/incubadora/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();

       if (result.status === 'success' && result.data?.token) {
        if (rememberMe) {
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('enterpriseId', result.data.enterpriseId);
          localStorage.setItem('userId', result.data.user.Id);
          localStorage.setItem('userGroup', result.data.user.Group);
        } else {
          // sessionStorage.setItem('token', result.data.token);
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('enterpriseId', result.data.enterpriseId);
          localStorage.setItem('userId', result.data.user.Id);
          localStorage.setItem('userGroup', result.data.user.Group);
        }
        if (result.data.user.Group === 'admin') {
          window.location.href = 'dashboard_adm.html';
        }
        else {
          window.location.href = 'dashboard.html';
        }
      } else {
        alert(result.message || 'Erro ao autenticar');
        loginButton.disabled = false;
        loginButton.innerHTML = 'Entrar';
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com o servidor. Verifique se o Flask está rodando na porta 5000.');
      loginButton.disabled = false;
      loginButton.innerHTML = 'Entrar';
    }
  });

  scrollButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target'); 
      const targetElement = document.getElementById(targetId); 

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Lógica de Exibição e Ocultação do Chatbot ---
  openChatbotButton.addEventListener('click', () => {
    chatbotPanel.classList.remove('translate-x-full');
    renderSuggestions(); 
  });

  closeChatbotButton.addEventListener('click', () => {
    chatbotPanel.classList.add('translate-x-full');
  });

  // --- Lógica de Limpar Conversa ---
  chatClearButton.addEventListener('click', async () => {
    const historyCleared = await clearAiHistory();
    
    if (historyCleared) {
        chatMessagesContainer.innerHTML = '';
        
        appendMessage("Seja muito bem-vindo(a)! Eu sou a **Acrova AI**, sua **Consultora de Inovação** da Incubadora de Empresas Garça. É um prazer recebê-lo. Por favor, sinta-se à vontade para perguntar sobre o processo de incubação, nossos serviços ou o sistema Startup Overseer. Como posso iniciar nossa conversa hoje?", 'ai');

        appendMessage('**Conversa Limpa!** Por favor, digite sua mensagem ou clique no botão **Enviar** para iniciar um novo tópico.', 'ai');
        
        renderSuggestions(); 
    } else {
         alert('Acrova AI: Falha ao limpar a conversa no servidor. Verifique o Back-End.');
    }
  });
  
  // Lógica de Histórico e Apagar (mantida no código, mas sem botões visíveis no HTML final)
  
});