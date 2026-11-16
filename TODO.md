# TODO — Saturnium Mobile

- [x] Navegação Web e controles do navegador: o app Android-first complementar ao SaturniumBrowser deve navegar por páginas da Web dentro do app usando uma WebView; oferecer uma barra unificada para inserir URLs e realizar pesquisas; e oferecer controles para voltar, avançar e recarregar a página atual.
- [x] Abas móveis: oferecer abas para abrir, alternar entre e fechar múltiplas páginas.
- [x] Tela inicial e identidade: oferecer uma tela inicial com acesso rápido à navegação e a identidade visual do SaturniumBrowser.
- [x] Limites do escopo inicial: implementar a interface móvel com React Native e Expo; tratar este app como uma versão móvel complementar, não como conversão automática do navegador desktop Electron; não incluir nesta primeira versão extensões do desktop, SaturniumAI ou o sistema próprio de downloads do desktop.

## Estado observado

A implementação TypeScript compila (`pnpm check`) e o lint passa (`pnpm lint`). A configuração Expo pública resolve nome, identificador Android e `logoUrl`. O servidor Metro/Web respondeu HTTP 200 na porta 8081 e a API está em escuta na 3000 (HTTP 404 em `/` é esperado para uma rota não definida). A WebView nativa está implementada no código, mas não foi executada em aparelho nem foi produzido APK/AAB nesta sessão. `expo install --check` alertou que alguns pacotes fixados pelo starter estão abaixo das versões esperadas pela CLI; a atualização automática em massa foi recusada para preservar o starter fornecido.
