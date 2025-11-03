

PRD: Gerador de Meme Político (SaaS)
Documento
PRD: Gerador de Meme Político
Versão
1.0
Autor
(Seu Nome/Empresa)
Status
Rascunho
Última Atualização
03 de Novembro de 2025

1. Visão Geral e Objetivo
1.1. O Produto
Um SaaS de página única (Single-Page Application) que permite aos usuários gerar imagens fotorrealistas e engraçadas de si mesmos (ou de amigos) interagindo com os políticos Jair Bolsonaro ou Lula.
1.2. O Problema
Usuários buscam formas rápidas e fáceis de criar conteúdo de humor (memes) para entretenimento e compartilhamento em redes sociais. Ferramentas de edição de imagem tradicionais (como Photoshop) são complexas, e aplicativos de IA genéricos (como o template original) são muito abertos e não focados nesta tarefa específica.
1.3. A Solução
Adaptaremos o template gemini-image-editing-nextjs-quickstart para criar uma ferramenta de "um clique". O usuário faz o upload de uma foto de referência (o "amigo") e escolhe um político. O aplicativo gera uma imagem totalmente nova dos dois juntos em uma pose amigável, pronta para ser baixada e compartilhada.
2. Público-Alvo
Usuários de Redes Sociais: Pessoas ativas no Instagram, WhatsApp, X (Twitter) e TikTok.
Criadores de Conteúdo: Indivíduos que produzem memes e conteúdo viral.
Público Geral: Qualquer pessoa com senso de humor que queira fazer uma "brincadeira" (troll) com um amigo.
3. Histórias de Usuário (User Stories)
ID
Como um...
Eu quero...
Para que...
US-101
Usuário
Fazer o upload de uma foto do meu amigo.
Usar o rosto dele como referência para a geração da imagem.
US-102
Usuário
Escolher entre "Lula" ou "Bolsonaro" com um único clique.
Definir com qual político meu amigo vai aparecer.
US-103
Usuário
Ver uma animação de "carregando" após clicar em "Gerar".
Eu saiba que o sistema está processando meu pedido.
US-104
Usuário
Ver a imagem final gerada (o meme) claramente na tela.
Avaliar o resultado da "zoeira".
US-105
Usuário
Baixar a imagem gerada para o meu celular ou computador.
Poder compartilhar o meme no WhatsApp ou Instagram.

4. Requisitos Funcionais (Adaptação do Template)
Esta seção detalha as modificações no template gemini-image-editing-nextjs-quickstart.
4.1. (F-01) Simplificação da Interface (Remoções)
O objetivo é remover toda a complexidade do template original.
REMOVER: O seletor de modo de edição (ex: "Inpainting", "Outpainting", "Background Replace").
REMOVER: A paleta de ferramentas de desenho de máscara (pincel, borracha).
REMOVER: O campo de entrada de prompt de texto (<input type="text"> ou <textarea>). O prompt será 100% controlado pelo backend.
4.2. (F-02) Componente de Upload (Manutenção)
O componente de upload de imagem do template será mantido.
MANTER: A funcionalidade de "arrastar e soltar" (drag-and-drop) ou "clicar para enviar" uma imagem.
Nome: Este componente deve ser renomeado para "1. Envie a foto do seu Amigo".
Validação: (Opcional V1) Aceitar apenas image/jpeg, image/png, image/webp.
4.3. (F-03) Componente de Seleção (Adição)
Abaixo do upload, os botões de ação principais serão adicionados.
ADICIONAR: Um grupo de botões (ou botões grandes) com o texto:
[Gerar com Bolsonaro]
[Gerar com Lula]
Estado: Estes botões devem ficar desabilitados (disabled) até que uma imagem seja carregada com sucesso no (F-02).
4.4. (F-04) Feedback de Processamento
Baseado no template, ao clicar em (F-03), o sistema deve:
MANTER: O estado de "Loading...". Um spinner ou overlay deve cobrir a área de resultado.
Texto: O texto de loading deve ser "Criando sua obra-prima...".
4.5. (F-05) Exibição e Download do Resultado
A área de exibição da imagem de resultado do template será mantida.
MANTER: O componente que exibe a imagem final.
ADICIONAR: Um botão proeminente abaixo da imagem de resultado: [Baixar Imagem].
Este botão fará o download da imagem exibida.
5. Requisitos Não Funcionais
(NFR-01) Responsividade: O design deve ser mobile-first. O compartilhamento será feito primariamente por celulares.
(NFR-02) Desempenho (Frontend): O carregamento da página inicial (Next.js) deve ser rápido. A interface deve ser fluida.
(NFR-03) Simplicidade: O fluxo completo (Upload -> Selecionar -> Ver Resultado) não deve exigir mais que 3 cliques do usuário.
6. Plano de Integração (Mock-first)
Para acelerar o desenvolvimento do frontend, todo o fluxo de geração será mockado primeiro. A conexão com o backend será uma substituição da fonte de dados.
6.1. Fase 1: Desenvolvimento com Mocks (Frontend)
O frontend será desenvolvido para funcionar de forma independente.
O usuário faz upload de amigo.jpg (F-02).
O usuário clica em [Gerar com Bolsonaro] (F-03).
O app exibe o estado de "Loading" (F-04) por 2 segundos (via setTimeout).
O app exibe uma imagem estática salva localmente em public/mocks/bolsonaro_result_mock.jpg no componente de resultado (F-05).
O botão de download (F-05) baixa essa imagem mockada.
6.2. Fase 2: Contrato da API (Backend)
Quando o backend estiver pronto, ele deverá seguir este contrato rigoroso.
Rota: POST /api/generate
Request Body: FormData
friendImage: (File) O objeto do arquivo de imagem do amigo.
politicalFigure: (String) O valor "bolsonaro" ou "lula".
Response (Sucesso 200 OK):
Content-Type: image/png (ou image/jpeg)
Body: Os bytes puros da imagem gerada.
Response (Erro 400/500):
Content-Type: application/json
Body: { "error": "Mensagem de erro descritiva" }
6.3. Fase 2: Conexão (Substituição do Mock)
No frontend, a função handleGenerate que continha o setTimeout será atualizada:
Em vez do setTimeout, ela fará uma chamada fetch('/api/generate') usando POST e enviando o FormData (conforme contrato 6.2).
Ela tratará a resposta:
Se response.ok, ela pegará a resposta como um blob(), criará um URL.createObjectURL(blob) e o definirá como a imagem de resultado (F-05).
Se !response.ok, ela exibirá uma mensagem de erro ao usuário.
7. Escopo Futuro (Pós-V1)
(V1.1) Adicionar mais políticos (ex: Ciro, Marina, etc.).
(V1.2) Adicionar mais cenários (ex: "Apertando a mão", "Em um debate", "No futebol").
(V1.3) Botões de compartilhamento direto (WhatsApp, Twitter) em vez de apenas Download.










1. Fluxograma da Fase 1 (Desenvolvimento Mock-first)
Este fluxograma ilustra o caminho do usuário descrito na seção 6.1. Fase 1: Desenvolvimento com Mocks.
Snippet de código
graph TD
    subgraph "Fase 1: Fluxo Mock (6.1)"
        M_A[Início: Usuário acessa a página] --> M_B(F-02: Usuário faz upload de 'amigo.jpg');
        M_B --> M_C(F-03: Usuário clica em 'Gerar com Bolsonaro');
        M_C --> M_D[App exibe 'Loading...' por 2s (F-04)];
        M_D --> M_E[App exibe imagem local 'public/mocks/bolsonaro_result_mock.jpg' (F-05)];
        M_E --> M_F(F-05: Usuário clica em 'Baixar Imagem');
        M_F --> M_G[Navegador baixa a imagem mock];
        M_G --> M_H[Fim];
    end


2. Fluxograma da Fase 2 (Fluxo Real com Backend)
Este é o fluxo principal do produto final, combinando as Histórias de Usuário (seção 3) e o plano de conexão (seção 6.3).
Snippet de código
graph TD
    subgraph "Fase 2: Fluxo Real com Backend (6.2 e 6.3)"
        B_A[Início: Usuário acessa a página] --> B_B(F-02: Usuário faz upload da foto do amigo);
        B_B --> B_C(F-03: Usuário clica em 'Gerar com...' [Bolsonaro ou Lula]);
        B_C --> B_D[Frontend exibe 'Loading...' (F-04)];
        B_D --> B_E[Frontend envia POST /api/generate com Imagem + Escolha (6.2)];
        B_E --> B_F((Backend processa com a LLM e retorna bytes da imagem));
        B_F --> B_G{API retornou 'response.ok'? (6.3)};
        
        B_G -- Sim --> B_I[Frontend converte bytes (blob) e exibe a imagem gerada (F-05)];
        B_I --> B_J(F-05: Usuário clica em 'Baixar Imagem');
        B_J --> B_K[Navegador baixa a imagem gerada];
        B_K --> B_L[Fim];
        
        B_G -- Não --> B_H[Frontend exibe mensagem de erro];
        B_H --> B_C;
    end


