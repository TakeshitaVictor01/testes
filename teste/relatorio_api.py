from flask import Blueprint, request, jsonify, send_file
from fpdf import FPDF
import io
import random # Usado para simular dados dinâmicos

# Cria a Blueprint
relatorio_api = Blueprint('relatorio_api', __name__)

# --- FUNÇÃO AUXILIAR PARA GERAR O PDF (MUDANÇA CRÍTICA) ---
class PDF(FPDF):
    """Classe personalizada de PDF."""
    def header(self):
        """Define o cabeçalho padrão do PDF."""
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Relatório Consolidado de Gestão', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        """Define o rodapé padrão do PDF."""
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

def create_report_pdf(report_data):
    """
    Gera o conteúdo binário do PDF formatado baseado nos DADOS DO FILTRO.
    """
    pdf = PDF()
    pdf.add_page()
    
    # Configurações de Cores
    TEAL = (0, 195, 160)
    BLACK = (0, 0, 0)
    GREEN = (30, 130, 76)
    RED = (220, 38, 38)
    LIGHT_GRAY = (240, 240, 240)
    DARK_GRAY = (100, 100, 100)
    
    # --- 1. Extrai os dados do filtro recebido ---
    report_type = report_data.get('reportType', 'desconhecido')
    date_start = report_data.get('dateStart', 'N/I')
    date_end = report_data.get('dateEnd', 'N/I')
    status = report_data.get('status', 'todos')
    category_name = report_data.get('categoryName', 'Todas')
    company_names = report_data.get('companyNames', [])
    
    num_companies = len(company_names) if len(company_names) > 0 else 1

    # --- 2. Escreve os Filtros Aplicados no PDF ---
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, f'Tipo de Relatório: {report_type.replace("_", " ").title()}', 0, 1, 'L')
    pdf.set_font('Arial', 'I', 10)
    
    pdf.cell(0, 6, f'Período: {date_start} até {date_end}', 0, 1, 'L')
    
    pdf.set_font('Arial', 'I', 10)
    pdf.cell(0, 6, f'Status Lançamentos: {status.title()}', 0, 1, 'L')
    pdf.cell(0, 6, f'Categoria: {category_name}', 0, 1, 'L')
    
    # Usa MultiCell para quebrar a linha se muitas empresas forem selecionadas
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(0, 8, f'Empresas Selecionadas ({len(company_names)}):', 0, 1, 'L')
    pdf.set_font('Arial', '', 9)
    pdf.set_text_color(*DARK_GRAY)
    pdf.multi_cell(0, 5, ", ".join(company_names), 0, 'L')
    pdf.set_text_color(*BLACK)
    
    pdf.ln(10) # Espaçamento

    # -------------------------------------------------------------------
    # --- 3. LÓGICA DE GERAÇÃO DE DADOS (SIMULADA A PARTIR DOS FILTROS) ---
    # -------------------------------------------------------------------
    
    if report_type == 'consolidado_fluxo_caixa':
        
        pdf.set_text_color(*TEAL)
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Resultado: Fluxo de Caixa Consolidado', 0, 1, 'L')
        pdf.set_text_color(*BLACK)
        
        # --- SIMULAÇÃO DINÂMICA ---
        # Os dados fixos são multiplicados pelo número de empresas selecionadas
        base_entradas = 15000.00
        base_saidas = 12000.00
        
        total_entradas = (base_entradas * num_companies) + (random.randint(-1000, 1000) * num_companies)
        total_saidas = (base_saidas * num_companies) + (random.randint(-1000, 1000) * num_companies)
        total_final = total_entradas - total_saidas
        
        pdf.set_font('Arial', '', 11)
        
        # Tabela de Resumo
        pdf.cell(90, 8, 'Receitas Totais (Vendas/Serviços)', 1, 0, 'L')
        pdf.set_text_color(*GREEN)
        pdf.cell(50, 8, f'R$ {total_entradas:.2f}', 1, 1, 'R')
        pdf.set_text_color(*BLACK)
        
        pdf.cell(90, 8, 'Despesas Totais (Custos Operacionais)', 1, 0, 'L')
        pdf.set_text_color(*RED)
        pdf.cell(50, 8, f'R$ {total_saidas:.2f}', 1, 1, 'R')
        pdf.set_text_color(*BLACK)
        
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(90, 10, 'Resultado Líquido (Lucro/Prejuízo)', 1, 0, 'L')
        
        final_color = GREEN if total_final >= 0 else RED
        pdf.set_text_color(*final_color)
        pdf.cell(50, 10, f'R$ {total_final:.2f}', 1, 1, 'R')
        pdf.set_text_color(*BLACK)
            
    elif report_type == 'ranking_faturamento':
        pdf.set_text_color(*TEAL)
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Resultado: Ranking de Faturamento', 0, 1, 'L')
        pdf.set_text_color(*BLACK)
        
        pdf.set_font('Arial', '', 11)
        pdf.cell(0, 7, f'Classificação das {num_companies} empresas selecionadas por Receita no Período.', 0, 1, 'L')
        pdf.ln(5)

        # --- SIMULAÇÃO DINÂMICA ---
        # Usa os nomes reais das empresas e atribui um faturamento simulado
        data = []
        for name in company_names:
            faturamento = 35000 + random.randint(-15000, 15000)
            data.append((name, max(5000, faturamento))) # Garante faturamento mínimo
        
        # Ordena do maior para o menor
        data.sort(key=lambda x: x[1], reverse=True)
        
        pdf.set_fill_color(*LIGHT_GRAY)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(90, 7, 'Empresa', 1, 0, 'L', 1)
        pdf.cell(50, 7, 'Faturamento (R$)', 1, 1, 'R', 1)
        
        pdf.set_font('Arial', '', 10)
        for i, (nome, valor) in enumerate(data):
            # Destaca o Top 3
            if i < 3:
                pdf.set_font('Arial', 'B', 10)
                pdf.set_text_color(*TEAL)
                
            pdf.cell(90, 7, f'#{i+1} {nome}', 1, 0, 'L')
            pdf.cell(50, 7, f"R$ {valor:.2f}", 1, 1, 'R')
            
            # Reseta o estilo
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(*BLACK)
            
    elif report_type == 'balanco_categorias':
        pdf.set_text_color(*TEAL)
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Resultado: Balanço Consolidado por Categoria', 0, 1, 'L')
        pdf.set_text_color(*BLACK)
        
        pdf.set_font('Arial', '', 11)
        pdf.cell(0, 7, 'Visão Geral do Patrimônio e Obrigações das empresas selecionadas.', 0, 1, 'L')
        pdf.ln(5)

        # --- SIMULAÇÃO DINÂMICA ---
        valor_ativo = (150000 * num_companies) + (random.randint(-10000, 10000) * num_companies)
        valor_passivo = (75000 * num_companies) + (random.randint(-5000, 5000) * num_companies)
        valor_patrimonio = valor_ativo - valor_passivo

        data = [
            ("Ativos Circulantes", valor_ativo, 'GREEN'), 
            ("Obrigações (Passivos)", valor_passivo, 'RED'), 
            ("Patrimônio Líquido", valor_patrimonio, 'TEAL')
        ]
        
        pdf.set_fill_color(*LIGHT_GRAY)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(90, 7, 'Categoria', 1, 0, 'L', 1)
        pdf.cell(50, 7, 'Valor (R$)', 1, 1, 'R', 1)
        
        pdf.set_font('Arial', '', 10)
        for nome, valor, cor in data:
            pdf.cell(90, 7, nome, 1, 0, 'L')
            if cor == 'GREEN': pdf.set_text_color(*GREEN)
            elif cor == 'RED': pdf.set_text_color(*RED)
            else: pdf.set_text_color(*TEAL)
            
            pdf.cell(50, 7, f"R$ {valor:.2f}", 1, 1, 'R')
            pdf.set_text_color(*BLACK)
            
    else:
        pdf.set_text_color(*RED)
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'ERRO: Tipo de Relatório Não Suportado', 0, 1, 'C')


    # Salva o PDF no buffer
    buffer = io.BytesIO()
    pdf.output(buffer, 'F')
    buffer.seek(0)
    return buffer

# --- ROTA DE EXPORTAÇÃO DE PDF (MUDANÇA CRÍTICA) ---

@relatorio_api.route('/exportar-pdf', methods=['POST'])
def export_pdf():
    """
    Recebe um JSON com TODOS os filtros e gera um PDF dinâmico.
    """
    # 1. Recebe o JSON completo com todos os filtros
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Nenhum dado de filtro recebido."}), 400
        
    report_type = data.get('reportType', 'desconhecido')
    
    try:
        # 2. Geração do PDF chamando a função com o DICIONÁRIO COMPLETO de dados
        pdf_buffer = create_report_pdf(data) # Envia o 'data' inteiro

        # 3. Envio do PDF como arquivo
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'Relatorio_{report_type}.pdf' # Nome do arquivo dinâmico
        )
    except Exception as e:
        print(f"Erro na geração do PDF: {e}")
        return jsonify({"error": f"Falha ao gerar o PDF. Erro: {str(e)}"}), 500