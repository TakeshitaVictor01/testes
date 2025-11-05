from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from relatorio_api import relatorio_api
from ia_agent import chamar_ia, agent, INSTRUCTIONS # Importa a IA do seu outro arquivo

# --- Configuração do Flask e Rotas ---
app = Flask(__name__)
CORS(app) 

# Registra o blueprint que gera o PDF
app.register_blueprint(relatorio_api, url_prefix='/api/relatorio')

# --- ROTAS DE RENDERIZAÇÃO DE PÁGINA ---

@app.route('/')
def index():
    """Redireciona a rota principal para a página de relatórios (ou dashboard)."""
    # Vamos apontar para relatórios por enquanto, já que é o que temos
    return redirect(url_for('pagina_relatorios'))

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

# NOVA ROTA para a página de Login
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
        # Recria a instância
        agent = agent(
            model="gemini-flash-lite-latest",
            temperature=0.5,
            api_key="SUA_CHAVE_REAL_AQUI", # ATENÇÃO: Use sua chave real
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            system_prompt=INSTRUCTIONS
        )

        print("Histórico do Agente Gemini resetado com sucesso via recriação.")
        return jsonify({"status": "success", "message": "Histórico de conversa limpo."})
        
    except Exception as e:
        print(f"ERRO CRÍTICO ao limpar histórico do agente: {e}")
        return jsonify({"status": "error", "message": f"Falha ao limpar histórico: {e}"}), 500


# Rota de login de placeholder
@app.route('/incubadora/authenticate', methods=['POST'])
def authenticate():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if email == "admin@garca.com" and password == "123456":
        return jsonify({
            "status": "success",
            "message": "Autenticação bem-sucedida",
            "data": {"token": "FAKE_TOKEN_ABC123"}
        })
    else:
        return jsonify({"status": "error", "message": "Email ou senha inválidos"}), 401

if __name__ == '__main__':
    # Execute em uma porta que o Front-End espera (5000)
    app.run(port=5000, debug=True)