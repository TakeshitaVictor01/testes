import requests
from bs4 import BeautifulSoup
import json
import re
import time

# --- PONTO DE PARTIDA ---
# Começamos apenas com a URL que você indicou.
START_URL = 'https://hubgarca.com.br/empresa/'
BASE_URL = 'https://hubgarca.com.br'

def find_company_links_from_list(url_lista):
    """
    Em uma página de lista (ex: .../empresa/ ou .../empresa/page/2/),
    encontra todos os links para empresas E o link da "próxima página".
    """
    links_empresas = set()
    next_page_link = None
    
    try:
        print(f"  Buscando na lista: {url_lista}")
        response = requests.get(url_lista)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 1. Encontra links de EMPRESAS
        # (Procura por links que contenham '/empresa/' mas NÃO '/page/')
        links = soup.select('a[href*="/empresa/"]:not([href*="/page/"])') 
        
        for link in links:
            href = link.get('href')
            if href:
                # Garante que o link seja absoluto
                if href.startswith(BASE_URL):
                    links_empresas.add(href)
                elif href.startswith('/'):
                    links_empresas.add(BASE_URL + href)
        
        # 2. Encontra o link da PRÓXIMA PÁGINA
        # (O site usa a classe 'next' e 'page-numbers')
        next_tag = soup.select_one('a.next.page-numbers[href]')
        if next_tag:
            next_page_link = next_tag.get('href')

    except requests.RequestException as e:
        print(f"  Erro ao buscar a lista {url_lista}: {e}")
    
    return links_empresas, next_page_link

# +++ FUNÇÃO DE KEYWORD CALIBRADA (Mantida da V2) +++
def gerar_keywords(nome_empresa):
    """Gera palavras-chave de busca a partir do nome da empresa."""
    nome_limpo = re.sub(r'\b(ltda|me|eireli|s/a|epp)\b', '', nome_empresa.lower(), flags=re.IGNORECASE)
    nome_limpo = re.sub(r'[.,/-]', '', nome_limpo)
    
    palavras = nome_limpo.split()
    keywords = set()
    keywords.add(nome_limpo.strip())
    
    if palavras:
        keywords.add(palavras[0])
    if len(palavras) >= 2:
        keywords.add(f"{palavras[0]} {palavras[1]}")
        
    return list(keywords)

# +++ FUNÇÃO DE SCRAPE DE PÁGINA (Mantida da V2) +++
def scrape_company_page(url_empresa):
    """Extrai o nome, conteúdo e keywords de uma página de empresa."""
    try:
        response = requests.get(url_empresa)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        selectors_nome = ['h1.elementor-heading-title', 'h1.entry-title', 'h1']
        nome_empresa = "Nome não encontrado"
        for selector in selectors_nome:
            tag = soup.select_one(selector)
            if tag:
                nome_empresa = tag.get_text(strip=True)
                break 

        selectors_conteudo = [
            'div.elementor-widget-theme-post-content', 'div.elementor-widget-text-editor',
            'div.entry-content', 'article'
        ]
        texto_conteudo = "Conteúdo não pôde ser extraído."
        for selector in selectors_conteudo:
            content_div = soup.select_one(selector)
            if content_div:
                texto_conteudo = content_div.get_text(separator='\n', strip=True)
                texto_conteudo = "\n".join([line for line in texto_conteudo.split('\n') if line.strip()])
                if len(texto_conteudo) > 100:
                    break
        
        keywords = gerar_keywords(nome_empresa)

        return {
            'nome': nome_empresa,
            'url': url_empresa,
            'conteudo': texto_conteudo,
            'keywords': keywords
        }
        
    except requests.RequestException as e:
        print(f"  Erro ao raspar a página {url_empresa}: {e}")
        return None

def main():
    print("Iniciando o scraper V3 (com paginação)...")
    todos_os_links_empresas = set()
    
    # --- LÓGICA DE PAGINAÇÃO ---
    current_page_url = START_URL
    while current_page_url:
        links_encontrados, next_page_link = find_company_links_from_list(current_page_url)
        
        if not links_encontrados and not next_page_link:
            # Se a página não tiver nem links de empresa nem de próxima página,
            # provavelmente é uma página de empresa que o seletor pegou por engano.
            if "/page/" not in current_page_url: # Ignora se não for a primeira página
                print(f"  AVISO: {current_page_url} não parece ser uma lista. Adicionando como empresa.")
                todos_os_links_empresas.add(current_page_url)
            
        todos_os_links_empresas.update(links_encontrados)
        current_page_url = next_page_link # Vai para a próxima página ou vira None e para o loop
        
        if current_page_url:
            print(f"  Indo para a próxima página: {next_page_link}")
            time.sleep(1) # Pausa para não sobrecarregar o site
    # --- FIM DA LÓGICA DE PAGINAÇÃO ---

    
    dados_empresas = []
    total = len(todos_os_links_empresas)
    print(f"\nTotal de {total} links de empresas encontrados. Raspando dados individuais...")
    
    for i, link in enumerate(todos_os_links_empresas):
        print(f"Raspando ({i+1}/{total}): {link}")
        dados = scrape_company_page(link)
        if dados:
            dados_empresas.append(dados)
        time.sleep(0.5) # Pausa
            
    with open('empresas_data.json', 'w', encoding='utf-8') as f:
        json.dump(dados_empresas, f, indent=4, ensure_ascii=False)
        
    print(f"\nSucesso! {len(dados_empresas)} empresas salvas em 'empresas_data.json'")

if __name__ == '__main__':
    main()