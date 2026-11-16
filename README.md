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

## Desempenho e gerenciamento de memória (etapa 1)

- `lib/browser/performance-modes.ts`: 5 modos (Equilibrado, Alto desempenho, Economia de memória, Economia de bateria, Personalizado) como políticas.
- `lib/browser/memory-manager.ts`: decide quais abas suspender (nunca a ativa, fixadas ou carregando). Suspender desmonta o WebView e mantém a URL; a aba volta a carregar ao ser aberta. O histórico de voltar/avançar da aba é perdido ao suspender.
- `app/settings.tsx`: painel "Desempenho" (modos, regras, métricas).
- `modules/saturnium-metrics`: módulo Expo em Kotlin com `ActivityManager.MemoryInfo`, `Debug.MemoryInfo` (PSS), processos do app e tempo de CPU do processo. Sem o módulo (Expo Go, Web), o painel diz "indisponível"; nada é estimado.
- O módulo exige build nativo (`npx expo prebuild` + build Android); não funciona no Expo Go.

### Limitações documentadas
- **Extensões:** `react-native-webview` não suporta extensões e o Chrome do Android não as expõe a apps. Suporte real exige migrar para GeckoView (WebExtensions). Não implementado nesta etapa.
- **Memória por aba:** o WebView não expõe consumo individual por página.
- **Pré-carregamento de páginas/links e atividade em segundo plano:** não oferecidos, pois não há como implementá-los de verdade no WebView.
- **Ainda não implementados:** downloads, navegação privada, configurações gerais/aparência/privacidade, miniaturas de abas.
- **Não validado em aparelho:** o código Kotlin e a tela nunca foram compilados nem executados; sem `node_modules`/rede aqui, também não rodei `pnpm check`, `lint` nem `vitest`.
