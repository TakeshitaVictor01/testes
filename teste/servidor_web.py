from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from relatorio_api import relatorio_api
# MUDANÇA: Agora importamos a CLASSE 'Agent' também
from ia_agent import chamar_ia, agent, INSTRUCTIONS, Agent
from flask_limiter import Limiter              # + IMPORTAR O LIMITER
from flask_limiter.util import get_remote_address
import json
 
# --- Configuração do Flask e Rotas ---
app = Flask(__name__)
CORS(app)

limiter = Limiter(
    get_remote_address, # Usa o IP do usuário para rastrear os limites
    app=app,
    default_limits=["200 per day", "50 per hour"], # Limites globais (boa prática)
    storage_uri="memory://", # Armazena os contadores na memória
    strategy="fixed-window" # Estratégia de contagem
)
 
# Registra o blueprint que gera o PDF
app.register_blueprint(relatorio_api, url_prefix='/api/relatorio')
 
# --- LÓGICA DE CARREGAMENTO DO CONTEXTO (RAG) ---
def carregar_dados_empresas():
    """Carrega os dados raspados do JSON para a memória."""
    try:
        with open('empresas_data.json', 'r', encoding='utf-8') as f:
            print("Carregando base de conhecimento 'empresas_data.json'...")
            return json.load(f)
    except FileNotFoundError:
        print("AVISO: 'empresas_data.json' não encontrado. O chatbot não terá contexto de empresas.")
        return []
    except Exception as e:
        print(f"Erro ao carregar 'empresas_data.json': {e}")
        return []

# Carrega os dados UMA VEZ quando o servidor inicia
dados_empresas = carregar_dados_empresas()

def encontrar_contexto(prompt):
    """Procura se o prompt menciona alguma das keywords da empresa."""
    prompt_lower = prompt.lower()
    
    # Procura por uma correspondência exata de keyword
    for empresa in dados_empresas:
        # O scraper agora gera um campo 'keywords'
        if 'keywords' not in empresa:
            continue # Pula dados antigos que não têm keywords
            
        for keyword in empresa['keywords']:
            # Se a keyword (ex: "eniteck") estiver no prompt (ex: "...sobre a eniteck")
            if keyword in prompt_lower:
                print(f"Contexto RAG acionado! Keyword: '{keyword}', Empresa: {empresa['nome']}")
                
                # Retorna o nome da empresa e seu conteúdo
                return {
                    'nome': empresa['nome'],
                    'conteudo': empresa['conteudo']
                }
    return None
# --- FIM DA LÓGICA RAG ---


# --- ROTAS DE RENDERIZAÇÃO DE PÁGINA ---
 
@app.route('/')
def index():
    """Redireciona a rota principal para a página de login."""
    return redirect(url_for('pagina_login'))
 
@app.route('/dashboard')
def pagina_dashboard():
    """Renderiza a página principal do dashboard."""
    return render_template('dashboard.html', active_page='dashboard')
 
@app.route('/empresa_detalhe')
def pagina_empresa_detalhe():
    """Renderiza a página de gerenciamento de empresas."""
    return render_template('empresa_detalhe.html', active_page='empresa_detalhe')
 
@app.route('/dashboard_adm')
def pagina_dashboard_adm():
    """Renderiza a página principal do dashboard."""
    return render_template('dashboard_adm.html', active_page='dashboard_adm')

@app.route('/relatorios')
def pagina_relatorios():
    """Renderiza a página de relatórios usando o template base."""
    return render_template('relatorio.html', active_page='relatorios')
 
@app.route('/usuarios')
def pagina_usuarios():
    """Renderiza a página de gerenciamento de usuários."""
    return render_template('usuario.html', active_page='usuarios')
 
@app.route('/empresas')
def pagina_empresas():
    """Renderiza a página de gerenciamento de empresas."""
    return render_template('empresa.html', active_page='empresas')
 
@app.route('/contas')
def pagina_contas():
    """Renderiza a página de gerenciamento de contas a pagar."""
    return render_template('contas2.html', active_page='contas2')
 
@app.route('/lancamentos')
def pagina_lancamentos():
    """Renderiza a página de lançamentos financeiros."""
    return render_template('lancamentos.html', active_page='lancamentos')
 
@app.route('/login')
def pagina_login():
    """Renderiza a página de login."""
    # Este arquivo não usa o 'base.html', é renderizado diretamente
    return render_template('login.html')
 
 
# --- ROTAS DE API (Movidas do seu main.py original) ---
 
@app.route('/api/chatbot', methods=['POST'])
@limiter.limit("10 per minute")  # Limita a 10 requisições por minuto por IP
def handle_chat():
    """Rota para o Front-End enviar mensagens e receber a resposta da IA."""
    
    # --- INÍCIO DA FUNÇÃO ---
    data = request.get_json()
    
    # Bloco 1: Verificação de dados
    if not data or 'message' not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    # Bloco 2: Definição das variáveis
    # ESTE É O PONTO CRÍTICO.
    # Estas duas linhas DEVEM estar aqui, no nível de indentação principal,
    # logo após o primeiro 'if'.
    prompt_usuario = data['message']
    resposta_ia = "" 

    # Bloco 3: Lógica RAG
    contexto_encontrado = encontrar_contexto(prompt_usuario)
    
    if contexto_encontrado:
        # Se encontramos um contexto, criamos um prompt "one-shot"
        final_prompt = f"""
        **Instrução de Prioridade Máxima:**
        Sua única tarefa neste momento é responder a "Pergunta do Usuário" 
        usando *apenas* o "Contexto da Empresa" fornecido.
        
        - Responda de forma amigável e em português.
        - NÃO use nenhum conhecimento prévio.
        - Se a resposta não estiver no contexto, diga que não encontrou 
          informações específicas sobre isso nos dados da empresa ou que é restrito a responder apenas perguntas no contexto da incubadora.

        **Contexto da Empresa: {contexto_encontrado['nome']}**
        {contexto_encontrado['conteudo']}

        **Pergunta do Usuário:**
        {prompt_usuario}
        """
        
        resposta_ia = chamar_ia(final_prompt) 

    else:
        # Se NÃO for RAG, apenas chama a IA normalmente.
        resposta_ia = chamar_ia(prompt_usuario)

    # Bloco 4: Retorno
    try:
        return jsonify({"response": resposta_ia})
    except Exception as e:
        print(f"Erro ao chamar a IA: {e}")
        return jsonify({"error": f"Erro interno no servidor: {str(e)}"}), 500
 
 
@app.route('/api/chatbot/clear-history', methods=['POST'])
def clear_history():
    """Rota para limpar o histórico do agente Gemini, recriando a instância."""
    # Acessa a variável global 'agent' do arquivo ia_agent
    global agent
   
    try:
        # MUDANÇA 1: Usando 'Agent' (maiúsculo) para recriar a classe
        agent = Agent(
            model="gemini-2.5-flash",
            temperature=0.5,
            # MUDANÇA 2: Use sua chave real aqui
            api_key="AIzaSyAXM69l4DKkCq9E1_4olPulootWTdtRjVQ",
            # MUDANÇA 3: Corrigido de 'generativelace' para 'generativelanguage'
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            system_prompt=INSTRUCTIONS
        )
 
        print("Histórico do Agente Gemini resetado com sucesso via recriação.")
        return jsonify({"status": "success", "message": "Histórico de conversa limpo."})
       
    except Exception as e:
        print(f"ERRO CRÍTICO ao limpar histórico do agente: {e}")
        return jsonify({"status": "error", "message": f"Falha ao limpar histórico: {e}"}), 500
 
if __name__ == '__main__':
    # Execute em uma porta que o Front-End espera (5000)
    app.run(port=5400, debug=True)