# Saturnium Mobile

Aplicativo Android-first complementar ao SaturniumBrowser, construído com React Native e Expo. Esta é uma experiência móvel própria; não é uma conversão automática do navegador desktop Electron.

## O que inclui

- Navegação na Web dentro do app Android por WebView nativa.
- Barra unificada para pesquisar ou digitar um endereço.
- Controles para voltar, avançar, recarregar e retornar à tela inicial.
- Abas para abrir, alternar e fechar páginas.
- Tela inicial e ícones com a identidade visual Saturnium.
- Endereços `mailto:` e `tel:` encaminhados ao sistema operacional.

A pesquisa padrão usa Bing. No Preview Web, a implementação apresenta a limitação da prévia e oferece abrir o endereço no navegador externo; isso não substitui a WebView Android.

## Fora da primeira versão

Extensões do navegador desktop, SaturniumAI e o sistema próprio de downloads do SaturniumBrowser não estão incluídos.

## Estrutura

- `app/(tabs)/index.tsx`: tela do navegador, barra de endereço, controles e gerenciador de abas.
- `components/browser-page.native.tsx`: visualização Web nativa com `react-native-webview`.
- `components/browser-page.web.tsx`: alternativa para a prévia Web.
- `components/browser-page.types.ts`: tipos de navegação compartilhados.
- `assets/images/`: ícone e variantes nativas da marca.
- `app.config.ts`: identidade Expo, identificadores Android/iOS e metadado do logo do projeto.
- `plan.md` e `TODO.md`: abordagem aprovada e critérios acompanhados.

## Desenvolvimento e validação

Com as dependências do starter instaladas, inicie os serviços Metro/Web e API nas portas fixas 8081 e 3000:

```bash
pnpm dev
```

Verificações disponíveis:

```bash
pnpm check
pnpm lint
```

O Preview Web demonstra a interface e o fallback Web. Para abrir o app nativo em um aparelho, conecte o projeto ao Expo Go pelo Dashboard e use o QR disponibilizado após a preparação das credenciais Expo. Um build Android APK/AAB deve ser solicitado pelo Dashboard; nenhum artefato nativo é declarado como produzido por este projeto.

## Referência de origem

O navegador desktop de referência é o repositório [Jeffin-PVP/SaturniumBrowser](https://github.com/Jeffin-PVP/SaturniumBrowser). O ícone foi derivado do arquivo `assets/saturniumbrowser-icon.png` do checkout desktop e adaptado para os assets nativos do Expo.
