from flask import Blueprint, request, jsonify, send_file
from fpdf import FPDF
import io

# Cria a Blueprint (planta de rotas) para o módulo de relatórios
relatorio_api = Blueprint('relatorio_api', __name__)

# --- FUNÇÃO AUXILIAR PARA GERAR O PDF ---
class PDF(FPDF):
    """Classe personalizada de PDF baseada em FPDF2."""
    def header(self):
        """Define o cabeçalho padrão do PDF."""
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Relatório Detalhado de Fluxo de Caixa', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        """Define o rodapé padrão do PDF."""
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

def create_fluxo_caixa_pdf(mes, entradas, saidas, total_entradas, total_saidas, total_final, resumo_final):
    """
    Gera o conteúdo binário do PDF formatado com Entradas, Saídas e Resumo.
    """
    pdf = PDF()
    pdf.add_page()
    
    # Configurações de Cores (Teal da Marca, Verde para Lucro, Vermelho para Prejuízo)
    TEAL = (0, 195, 160)
    GREEN = (30, 130, 76)
    RED = (220, 38, 38)
    BLACK = (0, 0, 0)
    LIGHT_GRAY = (240, 240, 240)

    # Subtítulo
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 10, f'Mês de Referência: {mes}', 0, 1, 'C')
    pdf.ln(5)

    # Configurações de Layout
    col_width = 90
    line_height = 8
    
    # 1. ENTRADAS (Lucros)
    pdf.set_fill_color(*LIGHT_GRAY)
    pdf.set_text_color(*TEAL)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(col_width, line_height, '1. Entradas (Lucros)', 0, 0, 'L', 1)
    pdf.set_text_color(*BLACK)
    pdf.ln(line_height)
    
    pdf.set_font('Arial', '', 10)
    for item in entradas:
        pdf.cell(col_width * 0.7, line_height, item['desc'], 0, 0, 'L')
        pdf.set_text_color(*GREEN)
        pdf.cell(col_width * 0.3, line_height, f"R$ {item['valor']:.2f}", 0, 0, 'R')
        pdf.set_text_color(*BLACK)
        pdf.ln(line_height)
    
    # Total de Entradas
    pdf.ln(2)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(col_width * 0.7, line_height, 'Total de Entradas', 'T', 0, 'L')
    pdf.set_text_color(*GREEN)
    pdf.cell(col_width * 0.3, line_height, f"R$ {total_entradas:.2f}", 'T', 0, 'R')
    pdf.set_text_color(*BLACK)
    
    # 2. SAÍDAS (Despesas) - Posição X ajustada para ficar ao lado
    pdf.set_xy(pdf.get_x() + 5, pdf.get_y() - (len(entradas) + 2) * line_height - 2)
    
    pdf.set_fill_color(*LIGHT_GRAY)
    pdf.set_text_color(*TEAL)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(col_width, line_height, '2. Saídas (Despesas)', 0, 0, 'L', 1)
    pdf.set_text_color(*BLACK)
    pdf.ln(line_height)

    pdf.set_font('Arial', '', 10)
    pdf.set_x(pdf.get_x() + 95) # Move X para o início da segunda coluna
    for item in saidas:
        pdf.cell(col_width * 0.7, line_height, item['desc'], 0, 0, 'L')
        pdf.set_text_color(*RED)
        pdf.cell(col_width * 0.3, line_height, f"R$ {item['valor']:.2f}", 0, 0, 'R')
        pdf.set_text_color(*BLACK)
        pdf.ln(line_height)
        pdf.set_x(pdf.get_x() + 95) # Move X de volta

    # Total de Saídas
    pdf.ln(2)
    pdf.set_font('Arial', 'B', 11)
    pdf.set_x(pdf.get_x() + 95) # Move X
    pdf.cell(col_width * 0.7, line_height, 'Total de Saídas', 'T', 0, 'L')
    pdf.set_text_color(*RED)
    pdf.cell(col_width * 0.3, line_height, f"R$ {total_saidas:.2f}", 'T', 0, 'R')
    pdf.set_text_color(*BLACK)
    pdf.ln(line_height)


    # 3. RESUMO FINAL
    pdf.ln(10)
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Resumo Final do Mês', 0, 1, 'C')
    pdf.set_font('Arial', '', 12)
    
    final_color = GREEN if total_final >= 0 else RED
    pdf.set_text_color(*final_color)
    
    pdf.cell(0, 8, resumo_final, 0, 1, 'C')
    pdf.ln(2)
    
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(0, 10, f"Total Líquido: R$ {total_final:.2f}", 0, 1, 'C')
    pdf.set_text_color(*BLACK)

    # Salva o PDF no buffer
    buffer = io.BytesIO()
    pdf.output(buffer, 'F')
    buffer.seek(0)
    return buffer

# --- ROTA DE EXPORTAÇÃO DE PDF ---

@relatorio_api.route('/exportar-pdf', methods=['POST'])
def export_pdf():
    """
    Recebe o mês via POST e retorna o arquivo PDF binário.
    URL completa: http://127.0.0.1:5000/api/relatorio/exportar-pdf
    """
    
    data = request.get_json()
    mes = data.get('mes', 'Mês Desconhecido')
    
    # 1. SIMULAÇÃO DE EXTRAÇÃO DE DADOS (DADOS FIXOS)
    ENTRADAS = [
        {'desc': 'Venda de Licenças (Produto A)', 'valor': 8000.00},
        {'desc': 'Serviço de Consultoria', 'valor': 7000.00},
        {'desc': 'Locação de Espaço', 'valor': 3000.00}
    ]
    SAIDAS = [
        {'desc': 'Aluguel Sede', 'valor': 5000.00},
        {'desc': 'Salários (RH)', 'valor': 6000.00},
        {'desc': 'Compra de Matéria Prima', 'valor': 2500.00},
        {'desc': 'Despesas de Viagem', 'valor': 1000.00}
    ]

    total_entradas = sum(item['valor'] for item in ENTRADAS)
    total_saidas = sum(item['valor'] for item in SAIDAS)
    total_final = total_entradas - total_saidas
    resumo_final = f"O mês de {mes} se encerrou em LUCRO!" if total_final >= 0 else f"O mês de {mes} se encerrou em PREJUÍZO."

    try:
        # 2. Geração do PDF
        pdf_buffer = create_fluxo_caixa_pdf(mes, ENTRADAS, SAIDAS, total_entradas, total_saidas, total_final, resumo_final)

        # 3. Envio do PDF como arquivo
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'Relatorio_Fluxo_Caixa_{mes}.pdf'
        )
    except Exception as e:
        # Este erro será capturado no Front-End
        print(f"Erro na geração do PDF: {e}")
        return jsonify({"error": f"Falha ao gerar o PDF. Erro: {str(e)}"}), 500