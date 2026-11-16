# Plano de implementação — Saturnium Mobile

## Produto e escopo aprovado

Criar um aplicativo Android-first complementar ao SaturniumBrowser, um navegador desktop Electron para Windows, usando o starter móvel fixo de React Native, Expo Router, TypeScript e NativeWind. O app não é uma conversão automática do navegador desktop.

A primeira versão oferece navegação Web dentro do app Android por WebView; uma barra unificada para URL e pesquisa; ações voltar, avançar e recarregar; criação, alternância e fechamento de abas; e uma tela inicial com a identidade visual Saturnium. Não fazem parte desta versão extensões do desktop, SaturniumAI nem o sistema próprio de downloads do desktop.

## Abordagem de implementação

A tela principal vive em `app/(tabs)/index.tsx` e mantém o estado da navegação e das abas. A rota Expo padrão fica sem a barra de abas do starter; os controles do navegador são desenhados dentro da própria tela. O componente `components/browser-page.tsx` é o entrypoint tipado para a resolução de plataforma: `browser-page.native.tsx` integra `react-native-webview` no Android/iOS; `browser-page.web.tsx` explica a limitação da prévia Web e permite abrir o endereço no navegador externo. Os callbacks e refs comuns ficam em `components/browser-page.types.ts`.

A barra resolve URLs HTTP/HTTPS e domínios sem esquema; texto que não parece endereço é enviado como pesquisa Bing. Os controles nativos de voltar/avançar usam a pilha da WebView; o botão físico Voltar do Android acompanha a mesma navegação. `mailto:` e `tel:` são delegados ao sistema operacional, sem permitir protocolos arbitrários na WebView.

A WebView, a tela inicial, o modal de abas e a barra inferior usam componentes React Native, dimensionados para retrato e uso com uma mão. O app não requer dados de conta nem backend próprio para as funções descritas. O starter gerenciado mantém os listeners fixos do Preview em 8081 (Metro/Web) e 3000 (API); nenhuma porta será alterada. Builds Android devem ser feitos pelo fluxo do Dashboard, não por uma compilação nativa dentro do Sandbox.

## Estrutura principal

- `app/`: rotas Expo Router, layout global e tela do navegador.
- `components/`: componente de página por plataforma e contratos de navegação compartilhados.
- `assets/images/`: ícone e variantes nativas derivados da marca Saturnium fornecida no projeto desktop.
- `app.config.ts`: identidade, esquema e identificadores Expo/Android/iOS; metadado de logo do projeto.
- `TODO.md`: requisitos aprovados e progresso observado.

## Direção visual

**Movimento:** interface de navegação espacial minimalista, reinterpretando a marca existente em uma superfície móvel escura, sem tentar copiar a janela desktop.

**Princípios:** (1) prioridade ao conteúdo da página; (2) ações de navegação acessíveis com uma mão; (3) identidade reconhecível com poucos elementos; (4) feedback visual discreto e alto contraste.

**Cores:** carvão e grafite reduzem distração em torno do conteúdo; violeta identifica ações primárias e o ciano destaca foco, navegação segura e progresso. O ícone original, em vez de arte decorativa genérica, ancora a identidade.

**Layout:** cabeçalho compacto com marca e nova aba, barra de endereço próxima do topo, página ocupando a área flexível e controles principais em faixa inferior; a lista de abas sobe como painel modal.

**Elementos de assinatura:** órbitas finas em torno do ícone na tela inicial; acentos violeta/ciano; ícone Saturnium reutilizado no cabeçalho e tela inicial.

**Interação e movimento:** toque com feedback de opacidade; progresso fino durante a navegação; painel de abas com transição de subida; controles desabilitados quando a pilha WebView não permite avançar ou voltar.

**Tipografia:** fontes de sistema do React Native para carregamento leve, com hierarquia de pesos e espaçamentos curtos; títulos e microcopy em português brasileiro.

**Essência da marca:** um navegador móvel direto para quem já usa Saturnium e quer continuar a navegação no celular; personalidade: espacial, ágil e sóbria.

**Voz:** textos curtos e orientados à ação. Exemplos: “Para onde vamos?” e “Pesquise ou digite um endereço”.

**Wordmark e símbolo:** ícone quadrado oficial do SaturniumBrowser ao lado do wordmark em caixa alta com tracking; o nome não é substituído por um ícone genérico.

**Cor de marca:** violeta Saturnium `#7C5CFF`, complementado pelo ciano `#79D8FF`.
