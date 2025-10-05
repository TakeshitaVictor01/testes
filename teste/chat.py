from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from google import genai
from google.genai import types

# Inicialização do Flask
app = Flask(__name__)
# Configura o CORS para permitir requisições do seu frontend (localhost:5500)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# --- Configuração do Gemini ---
try:
    # A biblioteca client.Client() procura automaticamente pela variável de ambiente GEMINI_API_KEY
    client = genai.Client()
except Exception as e:
    # Trata o caso de a chave não estar configurada
    print("ERRO: A variável de ambiente GEMINI_API_KEY não está configurada.")
    print("Por favor, configure sua chave de API do Gemini para prosseguir.")
    client = None

# System Instruction para definir a personalidade da Acrova AI
ACROVA_AI_SYSTEM_INSTRUCTION = (
    "Você é a Acrova AI, a Consultora de Inovação da Incubadora de Empresas Garça. "
    "Sua personalidade é educada, formal e descontraída. Mantenha um tom profissional, "
    "mas use linguagem acessível e encorajadora. Você deve responder em português do Brasil. "
    "Seja concisa e direta. Seu foco é fornecer informações sobre a Incubadora Garça, "
    "o processo de incubação, serviços oferecidos e o sistema de gestão Startup Overseer. "
    "Sempre use o Markdown de negrito (**) para destacar termos-chave na sua resposta."
)


def get_ai_response_gemini(user_message):
    """
    Função que faz a chamada real à API do Gemini.
    """
    if not client:
        return "Desculpe, a **Acrova AI** não pode se conectar ao serviço de IA. Verifique sua chave de API."

    try:
        # Configuração do modelo e instrução de sistema
        config = types.GenerateContentConfig(
            system_instruction=ACROVA_AI_SYSTEM_INSTRUCTION
        )

        # Chamada à API
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_message,
            config=config,
        )
        
        # Retorna o texto gerado pelo modelo
        return response.text

    except Exception as e:
        print(f"Erro ao chamar a API do Gemini: {e}")
        return "Houve um problema técnico ao processar sua pergunta. Por favor, tente novamente mais tarde."


# --- Endpoint do Chatbot (Atualizado) ---

@app.route('/api/chatbot', methods=['POST'])
def chatbot_endpoint():
    data = request.get_json()
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'response': 'Por favor, envie uma mensagem válida.'}), 400

    # Obtém a resposta da IA via Gemini API
    ai_response = get_ai_response_gemini(user_message)
    
    # Retorna a resposta ao JavaScript
    return jsonify({'response': ai_response})


# --- Endpoint de Autenticação (Mantido) ---

@app.route('/incubadora/authenticate', methods=['POST'])
def authenticate():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Apenas um exemplo de autenticação
    if email == "admin@garca.com" and password == "123456":
        return jsonify({
            'status': 'success',
            'data': {'token': 'dummy_jwt_token_12345'}
        }), 200
    else:
        return jsonify({
            'status': 'error',
            'message': 'Credenciais inválidas. Verifique seu email e senha.'
        }), 401


if __name__ == '__main__':
    # Roda o servidor na porta 5000
    app.run(host='127.0.0.1', port=5000, debug=True)