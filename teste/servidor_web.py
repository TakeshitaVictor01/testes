from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from relatorio_api import relatorio_api
# MUDANÇA: Agora importamos a CLASSE 'Agent' também
from ia_agent import chamar_ia, agent, INSTRUCTIONS, Agent
 
# --- Configuração do Flask e Rotas ---
app = Flask(__name__)
CORS(app)
 
# Registra o blueprint que gera o PDF
app.register_blueprint(relatorio_api, url_prefix='/api/relatorio')
 
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
    return render_template('contas.html', active_page='contas')
 
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
def handle_chat():
    """Rota para o Front-End enviar mensagens e receber a resposta da IA."""
    data = request.get_json()
   
    if not data or 'message' not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400
 
    prompt = data['message']
   
    try:
        resposta_ia = chamar_ia(prompt)
        return jsonify({"response": resposta_ia})
   
    except Exception as e:
        print(f"Erro ao chamar a IA: {e}")
        # Retorna o erro 500 com a mensagem real do erro
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
            api_key="AIzaSyCy27IMKyZbZo61NIT2RCKadACt96ceqqs",
            # MUDANÇA 3: Corrigido de 'generativelace' para 'generativelanguage'
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            system_prompt=INSTRUCTIONS
        )
 
        print("Histórico do Agente Gemini resetado com sucesso via recriação.")
        return jsonify({"status": "success", "message": "Histórico de conversa limpo."})
       
    except Exception as e:
        print(f"ERRO CRÍTICO ao limpar histórico do agente: {e}")
        return jsonify({"status": "error", "message": f"Falha ao limpar histórico: {e}"}), 500
 
 
# Rota de login
@app.route('/incubadora/authenticate', methods=['POST'])
def authenticate():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
 
    # Autenticação real deve ser feita contra sua API externa
    # Esta rota é chamada pelo script_login.js, que agora chama a API real.
    # Esta função pode ser removida ou deixada como um fallback.
    # Pela nossa última conversa, o script_login.js não chama mais esta rota.
    # (Vou manter caso outro script chame)
    if email == "victor@gmail.com" and password == "string":
        return jsonify({
            "status": "success",
            "message": "Autenticação bem-sucedida",
            "data": {"token": "REAL_TOKEN_PLACEHOLDER"}
        })
    else:
        return jsonify({"status": "error", "message": "Email ou senha inválidos"}), 401
 
if __name__ == '__main__':
    # Execute em uma porta que o Front-End espera (5000)
    app.run(port=5400, debug=True)