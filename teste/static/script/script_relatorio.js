// script_relatorio.js

document.addEventListener('DOMContentLoaded', () => {
    // VARIÁVEL DE SIMULAÇÃO
    const USER_DATA = {
        name: 'Admin Global',
        level: 'Administrador' 
    };
    const IS_ADMIN = USER_DATA.level === 'Administrador';

    // API ENDPOINT
    const EXPORT_PDF_URL = 'http://127.0.0.1:5000/api/relatorio/exportar-pdf'; 

    // --- ELEMENTOS DE ESTRUTURA E FILTRO ---
    const userDisplayName = document.getElementById('user-display-name');
    const aiInputField = document.getElementById('ai-input-field');
    const aiSendButton = document.getElementById('ai-send-button');
    const aiInsightButton = document.getElementById('ai-insight-button'); 
    const aiForecastButton = document.getElementById('ai-forecast-button'); 
    const aiInsightText = document.getElementById('ai-insight-text');
    const accessWarning = document.getElementById('access-warning');

    const reportFilterForm = document.getElementById('report-filter-form');
    const companyContainer = document.getElementById('filter-companies-container');
    const companyError = document.getElementById('company-selection-error');
    const selectAllCheckbox = document.getElementById('company-all');
    const companyCheckboxes = document.querySelectorAll('.company-checkbox');
    
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');
    const filterStatus = document.getElementById('filter-status');
    const filterCategory = document.getElementById('filter-category');

    // --- ELEMENTOS DE RESULTADO ---
    const reportHeader = document.getElementById('report-header');
    const reportTitle = document.getElementById('report-title');
    const reportSubtitle = document.getElementById('report-subtitle');
    const reportPlaceholder = document.getElementById('report-placeholder');
    const reportTableContainer = document.getElementById('report-table-container');
    const reportTableBody = document.getElementById('report-table-body');
    const reportTableTotal = document.getElementById('report-table-total');
    const reportChartContainer = document.getElementById('report-chart-container');
    const chartCanvas = document.getElementById('myReportChart');
    
    // --- VARIÁVEIS DE ESTADO ---
    let myChart = null; 
    let currentReportType = null; 
    let currentReportData = null; 


    // 1. Configurações Iniciais
    userDisplayName.textContent = `${USER_DATA.name} (${USER_DATA.level})`;
    setupAccessControl(); 

    // 2. Controla a permissão da Barra de Comando
    function setupAccessControl() {
        if (IS_ADMIN) {
            accessWarning.classList.add('hidden');
        } else {
            aiInputField.disabled = true;
            aiSendButton.disabled = true;
            aiInsightButton.disabled = true;
            aiForecastButton.disabled = true;
            accessWarning.textContent = `A filtragem dinâmica e comandos avançados são restritos ao nível Administrador.`;
            accessWarning.classList.remove('hidden');
        }
    }
    
    // 3. Função para Lidar com o Download Detalhado (CHAMADA REAL AO FLASK)
    async function handleDownloadDetail(reportType) {
        if (!IS_ADMIN) {
            alert(`Acesso Negado: A exportação de dados detalhados é restrita ao Administrador.`);
            return;
        }

        const selectedCompanyElements = document.querySelectorAll('.company-checkbox:checked');
        const companyIds = Array.from(selectedCompanyElements).map(cb => cb.value);
        const companyNames = Array.from(selectedCompanyElements).map(cb => cb.nextElementSibling.textContent.trim());
        const formData = {
            reportType: reportType,
            dateStart: filterDateStart.value,
            dateEnd: filterDateEnd.value,
            status: filterStatus.value,
            categoryId: filterCategory.value,
            categoryName: filterCategory.options[filterCategory.selectedIndex].text,
            companyIds: companyIds,
            companyNames: companyNames
        };
        if (formData.companyIds.length === 0) {
            alert('Por favor, selecione ao menos uma empresa para gerar o PDF.');
            companyError.classList.remove('hidden');
            companyContainer.style.borderColor = 'var(--btn-danger-bg)';
            return;
        } else {
             companyError.classList.add('hidden');
             companyContainer.style.borderColor = 'var(--border-input)';
        }

        const originalButtonContent = aiSendButton.innerHTML;
        aiSendButton.disabled = true;
        aiInsightButton.disabled = true;
        aiForecastButton.disabled = true;
        aiInputField.disabled = true;
        aiSendButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gerando PDF...`;

        try {
            const response = await fetch(EXPORT_PDF_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido na comunicação com o Flask." }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Relatorio_${reportType}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            aiInsightText.innerHTML = `<strong>Acrova AI:</strong> O relatório **${reportType.replace(/_/g, ' ')}** foi baixado com sucesso.`;

        } catch (error) {
            console.error('Erro no download do PDF:', error);
            aiInsightText.innerHTML = `<strong>Erro Crítico no PDF:</strong> Falha na comunicação com o servidor. Detalhe: ${error.message}`;

        } finally {
            if (IS_ADMIN) {
                aiSendButton.disabled = false;
                aiInsightButton.disabled = false;
                aiForecastButton.disabled = false;
                aiInputField.disabled = false;
            }
            aiSendButton.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart"></i> Analisar / Filtrar`;
        }
    }


    // 5. Lógica de Envio de Comando (Geral para Input e Botões)
    async function processCommand(command) {
        const userCommand = command.trim();
        if (!userCommand || !IS_ADMIN) return;

        aiSendButton.disabled = true;
        aiInsightButton.disabled = true;
        aiForecastButton.disabled = true;
        aiInputField.disabled = true;
        
        let processingButton = document.activeElement;
        if (processingButton.id !== 'ai-send-button' && processingButton.id !== 'ai-insight-button' && processingButton.id !== 'ai-forecast-button') {
            processingButton = aiSendButton; 
        }
        const originalButtonText = processingButton.innerHTML;
        processingButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processando...`;


        if (aiInputField.value !== userCommand) {
            aiInputField.value = userCommand;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userCommand })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            aiInsightText.innerHTML = data.response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        } catch (error) {
            console.error('Erro na análise da IA:', error);
            aiInsightText.innerHTML = `<strong>Ocorreu um erro de comunicação com a Acrova AI.</strong>
                                       <br/><br/>
                                       Verifique o console (F12) e confirme se o servidor Flask está rodando e se a chave de API no arquivo \`ia_agent.py\` é válida.
                                       <br/><br/>
                                       <span style="color: #999; font-size: 0.8em;">Detalhe: ${error.message}</span>`;
        } finally {
            if (IS_ADMIN) {
                aiSendButton.disabled = false;
                aiInsightButton.disabled = false;
                aiForecastButton.disabled = false;
                aiInputField.disabled = false;
            }
            processingButton.innerHTML = originalButtonText;
            
            if (processingButton.id === 'ai-send-button') {
                aiInputField.value = ''; 
            }
        }
    }


    // 6. Função para renderizar o resultado (Tabela ou Gráfico)
    function renderReport(reportType, formData) {
        
        if (myChart) myChart.destroy();
        reportTableContainer.classList.add('hidden');
        reportChartContainer.classList.add('hidden');
        reportPlaceholder.classList.add('hidden');
        currentReportType = null; 
        currentReportData = null; 

        const dateStart = formData.get('dateStart');
        const dateEnd = formData.get('dateEnd');
        const status = formData.get('status');
        const categoryId = formData.get('categoryId');
        const fDateStart = dateStart ? new Date(dateStart + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I';
        const fDateEnd = dateEnd ? new Date(dateEnd + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I';
        const fStatus = status !== 'todos' ? ` | Status: ${status}` : '';
        const fCategory = categoryId !== 'todas' ? ` | Categoria: ${filterCategory.options[filterCategory.selectedIndex].text}` : '';
        
        reportSubtitle.textContent = `Período de ${fDateStart} até ${fDateEnd}${fStatus}${fCategory}`;
        reportHeader.classList.remove('hidden');

        const selectedCompanies = document.querySelectorAll('.company-checkbox:checked');
        const labels = Array.from(selectedCompanies).map(cb => cb.nextElementSibling.textContent.trim());
        const mockBaseValue = labels.length * 10000;
        const mockData = labels.map((_, index) => mockBaseValue + index * 1000 + Math.random() * 5000);
        const total = mockData.reduce((sum, val) => sum + val, 0);

        currentReportData = {
            reportTitle: `Relatório de ${reportType.replace("_", " ")}`,
            companyLabels: labels,
            faturamentoValues: mockData.map(v => v.toFixed(2)),
            faturamentoTotal: total.toFixed(2),
            numeroEmpresas: labels.length
        };

        if (reportType === 'ranking_faturamento') {
            reportChartContainer.classList.remove('hidden');
            reportTitle.textContent = `Ranking de Faturamento (${labels.length} Empresas)`;
            const ctx = chartCanvas.getContext('2d');
            myChart = new Chart(ctx, { 
                type: 'bar', data: { labels: labels, datasets: [{ label: 'Faturamento (R$)', data: mockData, backgroundColor: '#00C3A0' }] },
                options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true } } }
            });
            currentReportType = 'ranking_faturamento';

        } else if (reportType === 'consolidado_fluxo_caixa') {
            reportTableContainer.classList.remove('hidden');
            reportTitle.textContent = `Fluxo de Caixa Consolidado (${labels.length} Empresas)`;
            const receitas = total * 0.75;
            const custos = total * 0.30;
            const lucroOperacional = receitas - custos;
            currentReportData.receitas = receitas.toFixed(2);
            currentReportData.custos = custos.toFixed(2);
            currentReportData.lucroOperacional = lucroOperacional.toFixed(2);
            
            // MUDANÇA: Adicionado 'data-label' para responsividade
            reportTableBody.innerHTML = `
                <tr>
                    <td data-label="Descrição">Receitas de Vendas/Serviços (Consolidado)</td>
                    <td data-label="Valor Total" class="text-right" style="color: green;">${receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                <tr>
                    <td data-label="Descrição">Despesas Totais (Custos Operacionais)</td>
                    <td data-label="Valor Total" class="text-right" style="color: red;">- ${custos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                <tr>
                    <td data-label="Descrição">Resultado Operacional (Líquido)</td>
                    <td data-label="Valor Total" class="text-right" style="color: ${lucroOperacional >= 0 ? 'green' : 'red'}; font-weight: 600;">${lucroOperacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
            `;
            reportTableTotal.textContent = lucroOperacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            currentReportType = 'consolidado_fluxo_caixa';
            
        } else if (reportType === 'balanco_categorias') {
            reportTableContainer.classList.remove('hidden');
            reportTitle.textContent = `Balanço Consolidado por Categoria (${labels.length} Empresas)`;
            const valorAtivo = total * 1.5; 
            const valorPassivo = total * 0.8;
            const valorPatrimonio = valorAtivo - valorPassivo;
            currentReportData.ativos = valorAtivo.toFixed(2);
            currentReportData.passivos = valorPassivo.toFixed(2);
            currentReportData.patrimonioLiquido = valorPatrimonio.toFixed(2);
            
            // MUDANÇA: Adicionado 'data-label' para responsividade
            reportTableBody.innerHTML = `
                <tr>
                    <td data-label="Descrição">Ativos Circulantes (Bens e Direitos)</td>
                    <td data-label="Valor Total" class="text-right" style="color: green;">${valorAtivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                <tr>
                    <td data-label="Descrição">Passivos e Obrigações (Curto Prazo)</td>
                    <td data-label="Valor Total" class="text-right" style="color: red;">- ${valorPassivo.toLocaleString('pt-BR', { style: 'currency', 'currency': 'BRL' })}</td>
                </tr>
                <tr>
                    <td data-label="Descrição">Patrimônio Líquido</td>
                    <td data-label="Valor Total" class="text-right" style="color: ${valorPatrimonio >= 0 ? 'green' : 'red'}; font-weight: 600;">${valorPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
            `;
            reportTableTotal.textContent = valorPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            currentReportType = 'balanco_categorias';
        }

        // --- CHAMA A ANÁLISE AUTOMÁTICA ---
        if (currentReportType && IS_ADMIN) {
            aiInputField.disabled = false;
            aiSendButton.disabled = false;
            aiInsightButton.disabled = false;
            aiForecastButton.disabled = false;
            
            const dataString = JSON.stringify(currentReportData, null, 2);
            const autoSummaryPrompt = `
                **[Modo Agente de Análise Ativado]**
                O relatório a seguir foi gerado. Forneça um resumo executivo muito breve (1-2 linhas).
                Dados: ${dataString}
            `;
            processCommand(autoSummaryPrompt);
            
        } else if (!IS_ADMIN) {
             aiInsightText.innerHTML = `<strong>Acrova AI:</strong> O relatório '${reportTitle.textContent}' foi gerado.`;
        } else {
             aiInsightText.innerHTML = `<strong>Acrova AI:</strong> Gere um relatório para começar a análise.`;
        }
    }

    // ===================================================================
    // 7. ATRIBUIÇÃO DE EVENTOS
    // ===================================================================
    
    // 1. Evento de submissão do formulário
    reportFilterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(reportFilterForm);
        const reportType = formData.get('reportType');
        const selectedCompanies = document.querySelectorAll('.company-checkbox:checked');
        
        if (selectedCompanies.length === 0) {
            companyError.classList.remove('hidden');
            companyContainer.style.borderColor = 'var(--btn-danger-bg)';
            return; 
        } else {
            companyError.classList.add('hidden');
            companyContainer.style.borderColor = 'var(--border-input)';
        }
        renderReport(reportType, formData);
    });
    
    // 2. Lógica de "Selecionar Todas"
    selectAllCheckbox.addEventListener('change', (e) => {
        companyCheckboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // 3. Lógica de Limpar Filtros
    document.getElementById('filter-clear-btn').addEventListener('click', () => {
        reportFilterForm.reset();
        companyCheckboxes.forEach(cb => cb.checked = false);
        selectAllCheckbox.checked = false;
        
        reportPlaceholder.classList.remove('hidden');
        reportHeader.classList.add('hidden');
        reportTableContainer.classList.add('hidden');
        reportChartContainer.classList.add('hidden');
        
        if (myChart) myChart.destroy();
        
        currentReportType = null;
        currentReportData = null; 
        
        aiInputField.disabled = true;
        aiSendButton.disabled = true;
        aiInsightButton.disabled = true;
        aiForecastButton.disabled = true;
        aiInsightText.innerHTML = `<strong>Acrova AI:</strong> Filtros limpos. Gere um novo relatório para começar a análise.`;
    });

    // 4. Botão de Exportação PDF Geral
    document.getElementById('export-pdf-btn').addEventListener('click', async () => {
        if (!currentReportType) {
            alert('Por favor, gere um relatório primeiro antes de exportar.');
            return;
        }
        await handleDownloadDetail(currentReportType);
    });

    // 5. Barra de Comando (Input e Botão)
    aiSendButton.addEventListener('click', () => {
        processCommand(aiInputField.value);
    });
    
    aiInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processCommand(aiInputField.value);
        }
    });

    // 6. Evento para o Botão "Gerar Insight"
    aiInsightButton.addEventListener('click', () => {
        if (!currentReportData) {
            processCommand("Gerar insight (sem dados)");
            return;
        }

        const dataString = JSON.stringify(currentReportData, null, 2);
        
        const fullPrompt = `
            **[Modo Agente de Análise Ativado]**
            
            Dados do Relatório Atual:
            ${dataString}
            
            **Solicitação:** Analise estes dados e me dê **um único insight** ou **destaque** (ex: a empresa com maior faturamento, a maior despesa, ou o maior contribuinte para o lucro).
            (Lembre-se da regra: seja direto, objetivo e enxuto).
        `;
        
        processCommand(fullPrompt);
    });


    // 7. Evento para o Botão "Previsão"
    aiForecastButton.addEventListener('click', () => {
        if (!currentReportData) {
            processCommand("Projetar faturamento (sem dados)");
            return;
        }
        const dataString = JSON.stringify(currentReportData, null, 2);
        const fullPrompt = `
            **[Modo Agente de Análise Ativado]**
            
            Dados do Relatório Atual:
            ${dataString}
            
            **Solicitação:** Gere uma "Previsão de Faturamento (Beta)" para os próximos 6 meses com base nesses dados.
            (Lembre-se da regra: seja direto, objetivo e enxuto).
        `;
        processCommand(fullPrompt);
    });

});