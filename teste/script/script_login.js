document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const scrollButtons = document.querySelectorAll('[id^="scroll-down-button"]');

  // --- Elementos do Chatbot ---
  const openChatbotButton = document.getElementById('open-chatbot-button');
  const closeChatbotButton = document.getElementById('close-chatbot-button');
  const chatbotPanel = document.getElementById('chatbot-panel');

  const chatMessagesContainer = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendButton = document.getElementById('chat-send-button');
  
  const chatSuggestionsContainer = document.getElementById('chat-suggestions');

  const chatClearButton = document.getElementById('chat-clear');
  const chatHistoryButton = document.getElementById('chat-history');
  const chatDeleteHistoryButton = document.getElementById('chat-delete-history');

  // NOVO: A base de conhecimento e as sugestões podem ser removidas daqui,
  // pois a lógica agora está no servidor Flask (app.py).
  
  const SUGGESTION_QUESTIONS = [
    "Como funciona o processo de incubação?",
    "Quais serviços e benefícios a Garça oferece?",
    "Quais são os módulos do Startup Overseer?",
    "Quem desenvolveu o sistema?",
  ];

  // --- Funções de Chatbot ---

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
    chatMessagesContainer.appendChild(messageBubble);
    
    // Rola para o final da conversa
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
  
  /**
   * Função principal para enviar a mensagem (AGORA COM CHAMADA REAL AO FLASK).
   */
  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    // 1. Exibe a mensagem do usuário
    appendMessage(userMessage, 'user');
    chatInput.value = ''; // Limpa o input
    chatInput.disabled = true; // Desabilita input enquanto espera a IA
    chatSendButton.disabled = true;

    try {
      // Faz a requisição POST para o endpoint do chatbot no servidor Flask
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

  // --- Atribuição de Eventos ---

  // Ativa o envio ao clicar no botão
  chatSendButton.addEventListener('click', sendMessage);

  // Ativa o envio ao pressionar Enter no input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });


  // --- Lógica de Login e Rolagem (Mantida) ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginButton.disabled = true;
    loginButton.innerHTML = `<div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`;

    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = rememberMeCheckbox.checked;

    try {
      // Chamada real ao endpoint de autenticação
      const response = await fetch('http://127.0.0.1:5000/incubadora/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();

      if (result.status === 'success' && result.data?.token) {
        if (rememberMe) {
          localStorage.setItem('token', result.data.token);
        } else {
          sessionStorage.setItem('token', result.data.token);
        }
        window.location.href = 'dashboard.html';
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
    renderSuggestions(); // Exibe as sugestões ao abrir
  });

  closeChatbotButton.addEventListener('click', () => {
    chatbotPanel.classList.add('translate-x-full');
  });

  // --- Lógica de Comandos do Chatbot (Mantida) ---
  chatClearButton.addEventListener('click', () => {
    chatMessagesContainer.innerHTML = `
        <div class="flex justify-start">
            <div class="bg-slate-200 p-3 rounded-xl max-w-[80%] shadow-sm text-sm">
                Seja muito bem-vindo(a)! Eu sou a <strong>Acrova AI</strong>, sua <strong>Consultora de Inovação</strong> da Incubadora de Empresas Garça. É um prazer recebê-lo. Por favor, sinta-se à vontade para perguntar sobre o processo de incubação, nossos serviços ou o sistema Startup Overseer. Como posso iniciar nossa conversa hoje?
            </div>
        </div>
    `;
    renderSuggestions();
    alert('Acrova AI: Conversa limpa! Podemos começar um novo tópico.');
  });

  chatHistoryButton.addEventListener('click', () => {
    alert('Acrova AI: O histórico de conversas está indisponível neste ambiente de demonstração.');
  });
  
  chatDeleteHistoryButton.addEventListener('click', () => {
    const confirmDelete = confirm('Acrova AI: Tem certeza que deseja apagar permanentemente todo o histórico de conversas?');
    if (confirmDelete) {
        chatMessagesContainer.innerHTML = '';
        renderSuggestions();
        alert('Acrova AI: Histórico apagado. Reinicie a conversa clicando em "Limpar Conversa".');
    }
  });
});