// script_relatorio.js

document.addEventListener('DOMContentLoaded', () => {
    // VARIÁVEL DE SIMULAÇÃO: Nível de acesso (Admin para Full Access)
    const USER_DATA = {
        name: 'João Silva',
        level: 'Administrador' 
    };
    const IS_ADMIN = USER_DATA.level === 'Administrador';

    // API ENDPOINT
    const EXPORT_PDF_URL = 'http://127.0.0.1:5000/api/relatorio/exportar-pdf'; 

    // Elementos da Interface
    const userDisplayName = document.getElementById('user-display-name');
    const aiInputField = document.getElementById('ai-input-field');
    const aiSendButton = document.getElementById('ai-send-button');
    const aiInsightText = document.getElementById('ai-insight-text');
    const accessWarning = document.getElementById('access-warning');
    const reportsContainer = document.querySelector('.reports-container');

    // Mapeamento dos containers de dados
    const dataContainers = {
        portfolio: document.getElementById('data-portfolio'),
        fluxoCaixa: document.getElementById('data-fluxo-caixa'),
        rentabilidade: document.getElementById('data-rentabilidade'),
        usuarios: document.getElementById('data-usuarios')
    };

    // 1. Configura o nível de acesso e o nome do usuário na UI
    userDisplayName.textContent = `${USER_DATA.name} (${USER_DATA.level})`;

    // 2. Controla a permissão da Barra de Comando
    function setupAccessControl() {
        if (IS_ADMIN) {
            aiInputField.disabled = false;
            aiSendButton.disabled = false;
            aiInputField.placeholder = "Ex: 'Filtrar por 'Empresas Graduadas'";
            accessWarning.classList.add('hidden');
        } else {
            // Restrição para Proprietário/RH
            aiInputField.disabled = true;
            aiSendButton.disabled = true;
            accessWarning.textContent = `A filtragem dinâmica e comandos avançados são restritos ao nível Administrador. Seu nível (${USER_DATA.level}) tem acesso apenas aos dados de sua empresa.`;
            accessWarning.classList.remove('hidden');
            
            // Desabilita Ações Rápidas de filtro geral
            const quickActionButtons = document.querySelectorAll('.quick-action-btn');
            quickActionButtons.forEach(btn => {
                const command = btn.getAttribute('data-command').toLowerCase();
                if (command.includes('filtrar') || command.includes('tempo crítico') || command.includes('despesa crítica')) {
                     btn.disabled = true;
                     btn.style.opacity = '0.5';
                     btn.title = 'Restrito ao Administrador';
                }
            });
        }
    }
    
    // Função para simular atualização da tabela (Mantida)
    function simulateTableUpdate(containerId, filterName) {
        const tableBody = dataContainers[containerId].querySelector('tbody');
        if (!tableBody) return;

        let newHtml = '';
        if (filterName === 'residentes') {
             newHtml = `
                <tr><td>MK Laser</td><td>Residente</td><td>450</td><td>20/10/2025</td></tr>
                <tr><td>GeoTech</td><td>Residente</td><td>320</td><td>18/10/2025</td></tr>
                <tr><td colspan="4" class="text-center text-brand-teal">Exibindo 2 de 20 Empresas Residentes...</td></tr>
            `;
        } else if (filterName === 'graduadas') {
             newHtml = `
                <tr><td>Alpha Solutions</td><td>Graduada</td><td>850</td><td>01/05/2024</td></tr>
                <tr><td>Beta Systems</td><td>Graduada</td><td>780</td><td>10/06/2024</td></tr>
                <tr><td colspan="4" class="text-center text-brand-teal">Exibindo 2 de 36 Empresas Graduadas...</td></tr>
            `;
        } else {
             newHtml = `<tr><td colspan="4" class="text-center text-slate-500">Filtro '${filterName}' aplicado. Dados simulados.</td></tr>`;
        }
        tableBody.innerHTML = newHtml; 
    }


    // 3. Função para Lidar com o Download Detalhado (CHAMADA REAL AO FLASK)
    async function handleDownloadDetail(mes) {
        if (!IS_ADMIN) {
            alert(`Acesso Negado: A exportação de dados detalhados é restrita ao Administrador.`);
            return;
        }

        const aiSendButtonElement = document.getElementById('ai-send-button');
        const originalButtonContent = aiSendButtonElement.innerHTML;
        const aiInputFieldElement = document.getElementById('ai-input-field');

        // Feedback visual
        aiSendButtonElement.disabled = true;
        aiSendButtonElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Gerando PDF...`;
        aiInputFieldElement.disabled = true;


        try {
            const response = await fetch(EXPORT_PDF_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mes: mes }),
            });

            if (!response.ok) {
                // Tenta ler o JSON de erro do Flask
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido na comunicação com o Flask." }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            // Processa o BLOB (arquivo binário) retornado pelo Flask
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Dispara o download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Relatorio_Fluxo_Caixa_${mes}.pdf`; // Nome definido no Flask
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            aiInsightText.innerHTML = `<strong>Acrova AI:</strong> O relatório detalhado do mês de ${mes} foi gerado e baixado como <strong>Relatorio_Fluxo_Caixa_${mes}.pdf</strong>.`;

        } catch (error) {
            console.error('Erro no download do PDF:', error);
            aiInsightText.innerHTML = `<strong>Erro Crítico no PDF:</strong> Falha na comunicação com o servidor. Verifique se o <strong>Flask (porta 5000)</strong> está rodando e se o <strong>CORS</strong> está configurado. Detalhe: ${error.message}`;

        } finally {
            // Restaura a interface
            aiSendButton.disabled = false;
            aiSendButton.innerHTML = originalButtonContent;
            if (IS_ADMIN) {
                 aiInputField.disabled = false;
            }
        }
    }


    // 4. Função de Simulação de Resposta Dinâmica da IA (BACK-END SIMULADO - MAIS FLEXÍVEL)
    function simulateAiAnalysis(command) {
        return new Promise(resolve => {
            setTimeout(() => {
                const lowerCommand = command.toLowerCase();
                let response = "";

                // --- FLUXO 1: FILTROS E STATUS (Aceita comandos aproximados) ---
                if (lowerCommand.includes('filtrar') || lowerCommand.includes('mostrar') || lowerCommand.includes('status')) {
                    if (lowerCommand.includes('residente') || lowerCommand.includes('em andamento')) {
                        simulateTableUpdate('portfolio', 'residentes');
                        response = "Filtro <strong>aplicado</strong>. A tabela de Portfólio agora exibe as <strong>Empresas Residentes/<strong>. Foco no acompanhamento de projetos.";
                    } else if (lowerCommand.includes('graduada') || lowerCommand.includes('sucesso')) {
                        simulateTableUpdate('portfolio', 'graduadas');
                        response = "Filtro <strong>aplicado</strong>. A tabela de Portfólio agora exibe as <strong>Empresas Graduadas</strong>. Estas empresas já concluíram o ciclo de incubação.";
                    } else if (lowerCommand.includes('usuarios') || lowerCommand.includes('acesso')) {
                        response = "Relatório de Usuários filtrado: Exibindo apenas <strong>Administradores</strong> e <strong>Proprietários</strong>. Verifique a tabela 4 para detalhes.";
                    }
                    if (response) return resolve(response);
                }

                // --- FLUXO 2: ANÁLISE DE TEMPO E RISCO ---
                if (lowerCommand.includes('analisar tempo') || lowerCommand.includes('tempo crítico')) {
                    response = "Análise de Tempo Crítico: <strong>3 empresas</strong> estão no estágio <strong>Residente</strong> há mais de 30 meses. Recomenda-se uma reunião urgente para definir o plano de graduação ou saída.";
                    return resolve(response);
                }

                // --- FLUXO 3: FINANCEIRO E PROJEÇÃO (Aceita sinônimos) ---
                if (lowerCommand.includes('projetar') || lowerCommand.includes('prever') || lowerCommand.includes('futura')) {
                    response = "Projeção Financeira: A <strong>Acrova AI</strong> prevê estabilidade no fluxo de caixa para o próximo trimestre, com potencial de crescimento de <strong>+5%</strong> se as receitas de locação se mantiverem estáveis.";
                    return resolve(response);
                }
                
                // --- FLUXO 4: ANÁLISE DE CUSTO/RENTABILIDADE (Aceita comandos específicos) ---
                if (lowerCommand.includes('despesa crítica') || lowerCommand.includes('custo alto') || lowerCommand.includes('categoria')) {
                    response = "Análise de Despesas: A categoria de <strong>Despesas de Infraestrutura (Aluguel/Manutenção)</strong> representa <strong>40%</strong> do custo total. É a despesa crítica do mês.";
                    return resolve(response);
                }
                
                if (lowerCommand.includes('rentabilidade') || lowerCommand.includes('lucro empresa') || lowerCommand.includes('rentabilidade mk laser')) {
                    if (lowerCommand.includes('mk laser')) {
                        response = "Filtro de Rentabilidade: A MK Laser teve uma receita de <strong>R$ 8.000</strong> contra custos de <strong>R$ 1.200</strong>, resultando em uma rentabilidade de <strong>85%</strong> no período.";
                    } else {
                        response = "Análise de Rentabilidade Geral: A <strong>Acrova AI</strong> identificou que o <strong>custo operacional</strong> da Incubadora cresceu <strong>15%</strong> no último mês devido a despesas de RH. Recomenda-se otimização.";
                    }
                    return resolve(response);
                }

                // --- FLUXO 5: PADRÃO / FALHA ---
                response = "Comando não reconhecido. Por favor, utilize termos como 'Filtrar', 'Analisar Tempo', 'Projetar', ou 'Rentabilidade' para obter insights específicos.";
                resolve(response);
            }, 1500); // Simula o tempo de processamento da IA
        });
    }

    // 5. Lógica de Envio de Comando (Geral para Input e Botões)
    async function processCommand(command) {
        const userCommand = command.trim();
        if (!userCommand) return;

        // Desativa a interface durante o processamento
        const aiSendButton = document.getElementById('ai-send-button');
        const aiInputFieldElement = document.getElementById('ai-input-field');

        aiSendButton.disabled = true;
        aiSendButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processando...`;
        aiInputFieldElement.disabled = true;

        if (aiInputFieldElement.value !== userCommand) {
            aiInputFieldElement.value = userCommand;
        }

        try {
            const analysis = await simulateAiAnalysis(userCommand);
            
            // CORREÇÃO: Substitui ** por <strong> para formatação correta
            const formattedAnalysis = analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Injeta a resposta da IA no painel de Insights
            aiInsightText.innerHTML = formattedAnalysis;

        } catch (error) {
            console.error('Erro na análise da IA:', error);
            aiInsightText.innerHTML = "Ocorreu um <strong>erro de comunicação</strong> com a Acrova AI. Tente novamente.";
        } finally {
            // Reativa a interface
            aiSendButton.disabled = false;
            aiSendButton.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart mr-2"></i> Analisar / Filtrar`;
            if (IS_ADMIN) {
                 aiInputFieldElement.disabled = false;
            }
        }
    }

    // 6. Atribuição de Eventos
    
    // Ações Rápidas (Botões de Comando)
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.currentTarget.disabled) return;
            const command = e.currentTarget.getAttribute('data-command');
            processCommand(command);
        });
    });

    // Botões de Download (USANDO DELEGAÇÃO DE EVENTOS)
    reportsContainer.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.download-btn');
        if (downloadBtn) {
            const mes = downloadBtn.getAttribute('data-mes');
            handleDownloadDetail(mes);
        }
    });

    // Barra de Comando (Input e Botão)
    const aiSendButtonElement = document.getElementById('ai-send-button');
    const aiInputFieldElement = document.getElementById('ai-input-field');

    aiSendButtonElement.addEventListener('click', () => {
        processCommand(aiInputFieldElement.value);
    });
    
    aiInputFieldElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processCommand(aiInputFieldElement.value);
        }
    });

    // Inicia o controle de acesso ao carregar
    setupAccessControl();
});