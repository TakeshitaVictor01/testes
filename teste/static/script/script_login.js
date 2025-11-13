document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const scrollButtons = document.querySelectorAll('[id^="scroll-down-button"]');

  // --- Elementos do Input Senha ---
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  
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
    "Quais serviços e benefícios a Incubadora oferece?",
    "Quais são os módulos do Startup Overseer?",
    "Quem desenvolveu o sistema?",
  ];
  
  const DEFAULT_PROMPT = "Olá, Acrova AI. Gostaria de saber mais sobre a Incubadora de Empresas Garça.";

  // --- Lógica de Visualização de Senha ---
  if (togglePasswordButton) {
      togglePasswordButton.addEventListener('click', () => {
          const isPassword = passwordInput.getAttribute('type') === 'password';
          const type = isPassword ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          
          // O seu HTML usa {{ url_for }}, então o caminho pode ser dinâmico.
          // Esta lógica assume que os arquivos estão em 'static/img/'
          if (isPassword) {
              eyeIcon.src = eyeIcon.src.replace('olhofechado.svg', 'olhoaberto.svg');
              eyeIcon.alt = 'Ocultar Senha';
          } else {
              eyeIcon.src = eyeIcon.src.replace('olhoaberto.svg', 'olhofechado.svg');
              eyeIcon.alt = 'Mostrar Senha';
          }
      });
  }

  // --- Funções de Chatbot (Atualizadas) ---

  function renderSuggestions() {
    chatSuggestionsContainer.innerHTML = '';
    SUGGESTION_QUESTIONS.forEach(question => {
      const button = document.createElement('button');
      button.classList.add('px-3', 'py-1', 'bg-white', 'text-brand-teal', 'border', 'border-brand-teal', 'rounded-full', 'text-xs', 'hover:bg-brand-teal/10', 'transition-all');
      button.textContent = question;
      button.addEventListener('click', () => {
        chatInput.value = question;
        handleSendMessage(); // Chama o handler principal
      });
      chatSuggestionsContainer.appendChild(button);
    });
  }

  function appendMessage(text, sender) {
    const messageWrapper = document.createElement('div');
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('p-3', 'rounded-2xl', 'max-w-[80%]', 'shadow-sm', 'text-sm');

    if (sender === 'user') {
      messageWrapper.classList.add('flex', 'justify-end');
      messageBubble.classList.add('bg-brand-teal', 'text-white');
      chatSuggestionsContainer.innerHTML = ''; 
    } else { 
      messageWrapper.classList.add('flex', 'justify-start');
      messageBubble.classList.add('bg-slate-200', 'text-slate-800');
    }
    
    const processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageBubble.innerHTML = processedText; 
    messageWrapper.appendChild(messageBubble);
    chatMessagesContainer.appendChild(messageWrapper); 
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
  
  // + NOVO: Cria uma bolha de IA vazia e a retorna
  function createAiMessageBubble() {
    const messageWrapper = document.createElement('div');
    const messageBubble = document.createElement('div');
    
    messageWrapper.classList.add('flex', 'justify-start');
    messageBubble.classList.add('p-3', 'rounded-2xl', 'max-w-[80%]', 'shadow-sm', 'text-sm', 'bg-slate-200', 'text-slate-800');
    
    messageWrapper.appendChild(messageBubble);
    chatMessagesContainer.appendChild(messageWrapper);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    
    return messageBubble; // Retorna o elemento da bolha para ser preenchido
  }

  // + NOVO: Mostra o indicador "digitando..."
  function showTypingIndicator() {
    const messageWrapper = document.createElement('div');
    messageWrapper.id = 'typing-indicator'; // ID para fácil remoção
    messageWrapper.classList.add('flex', 'justify-start');
    
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('chat-bubble-typing'); // Classe do CSS
    messageBubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    messageWrapper.appendChild(messageBubble);
    chatMessagesContainer.appendChild(messageWrapper);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // + NOVO: Remove o indicador "digitando..."
  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // + NOVO: Efeito de digitação letra por letra
  function typeTextEffect(element, text, speed = 25) {
    return new Promise((resolve) => {
        let i = 0;
        element.innerHTML = ""; 

        function typeWriter() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; 
                setTimeout(typeWriter, speed);
            } else {
                let finalHtml = element.innerHTML;
                
                // 1. Converte markdown de negrito (**)
                finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // 2. Converte as tags de link que o navegador "quebrou" (escapou)
                //    de volta para HTML puro.
                finalHtml = finalHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

                // 3. Define o HTML final, permitindo que o navegador 
                //    renderize os links e o negrito corretamente.
                element.innerHTML = finalHtml;
                resolve();
            }
        }
        typeWriter();
    });
  }

  async function clearAiHistory() {
      try {
          const response = await fetch('/api/chatbot/clear-history', { method: 'POST' });
          const data = await response.json();
          return data.status === "success";
      } catch (e) {
          console.error("Falha ao limpar histórico no servidor:", e);
          return false;
      }
  }

  /**
   * Função principal para enviar a mensagem.
   * // MODIFICADO: Agora é 'async' e contém toda a nova lógica
   */
  async function handleSendMessage() {
    let userMessage = chatInput.value.trim();
    
    if (userMessage === '') {
        userMessage = DEFAULT_PROMPT;
    }

    // 1. Adiciona a mensagem do usuário
    appendMessage(userMessage, 'user');
    chatInput.value = ''; 
    chatInput.disabled = true; 
    chatSendButton.disabled = true;
    chatSuggestionsContainer.innerHTML = ''; 

    // 2. Mostra o indicador "digitando..."
    showTypingIndicator();

    try {
      // 3. Chama a API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
         throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || data.error || "Erro: Não foi possível obter uma resposta do servidor. Tente novamente.";

      // 4. Remove o indicador "digitando..."
      removeTypingIndicator();

      // 5. Cria uma bolha de IA vazia
      const aiBubbleElement = createAiMessageBubble();

      // 6. Inicia o efeito de digitação na bolha vazia
      await typeTextEffect(aiBubbleElement, aiResponse);

    } catch (error) {
      console.error('Erro na comunicação com o chatbot Flask:', error);
      removeTypingIndicator(); 
      appendMessage("Erro: Não foi possível obter uma resposta do servidor. Tente novamente.", 'ai');
      
    } finally {
      // 7. Reabilita os controles APÓS a digitação terminar
      chatInput.disabled = false;
      chatSendButton.disabled = false;
      chatInput.focus();
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  // Evento para o botão FAB (atalho)
  if (chatbotFab) {
    chatbotFab.addEventListener('click', () => {
      chatbotPanel.classList.remove('translate-x-full');
      renderSuggestions();
    });
  }
  
  // --- ✅ CORREÇÃO DE LÓGICA ---
  // Eventos de Chat corrigidos para usar os botões, não um form
  if (chatSendButton) {
    chatSendButton.addEventListener('click', handleSendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Impede a quebra de linha
        handleSendMessage();
      }
    });
  }

  // --- Lógica de Login e Scroll Geral (Mantida) ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginButton.disabled = true;
      loginButton.innerHTML = `<div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`;

      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const rememberMe = rememberMeCheckbox.checked;

      try {
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
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('enterpriseId', result.data.enterpriseId);
            localStorage.setItem('userId', result.data.user.Id);
            localStorage.setItem('userGroup', result.data.user.Group);
          }
          if (result.data.user.Group === 'admin') {
            window.location.href = 'dashboard_adm';
          }
          else {
            window.location.href = 'dashboard';
          }
          
        } else {
          alert(result.message || 'Erro ao autenticar');
          loginButton.disabled = false;
          loginButton.innerHTML = 'Entrar';
        }
      } catch (error) {
        console.error(error);
        alert('Erro de conexão com o servidor. Verifique sua internet ou contate o suporte.');
        loginButton.disabled = false;
        loginButton.innerHTML = 'Entrar';
      }
    });
  }

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
  if (openChatbotButton) {
      openChatbotButton.addEventListener('click', () => {
        chatbotPanel.classList.remove('translate-x-full');
        renderSuggestions(); 
      });
  }

  if (closeChatbotButton) {
    closeChatbotButton.addEventListener('click', () => {
      chatbotPanel.classList.add('translate-x-full');
    });
  }
  
  // --- Lógica de Limpar Conversa (Mantida) ---
  if (chatClearButton) {
    chatClearButton.addEventListener('click', async () => {
      const historyCleared = await clearAiHistory(); 
      
      if (historyCleared) {
          chatMessagesContainer.innerHTML = `
              <div class="flex justify-start"> 
                  <div class="bg-slate-200 p-3 rounded-2xl max-w-[80%] shadow-sm text-sm">
                      Seja muito bem-vindo(a)! Eu sou a <strong>Acrova AI</strong>, sua <strong>Consultora de Inovação</strong> da Incubadora de Empresas Garça. É um prazer recebê-lo. Por favor, sinta-se à vontade para perguntar sobre o processo de incubação, nossos serviços ou o sistema Startup Overseer. Como posso iniciar nossa conversa hoje?
                  </div>
              </div>
              <div class="flex justify-start"> 
                  <div class="bg-slate-200 p-3 rounded-2xl max-w-[80%] shadow-sm text-sm">
                      <strong>Conversa Limpa!</strong> Por favor, digite sua mensagem ou clique no botão <strong>Enviar</strong> para iniciar um novo tópico.
                  </div>
              </div>
          `;
          
          renderSuggestions(); 
          chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; 
      } else {
          alert('Acrova AI: Falha ao limpar a conversa na interface.');
      }
    });
  }
});