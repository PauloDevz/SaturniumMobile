# Limitações e pendências — Saturnium Mobile (etapa 1)

## Limitações técnicas (engine WebView)
- **Extensões:** o WebView não suporta extensões. Ficam para a migração para GeckoView (WebExtensions).
- **Pré-carregamento de páginas/links e atividade em segundo plano:** opções removidas, porque não há como implementá-las de verdade no WebView.
- **Memória por aba:** o WebView não expõe esse dado; o painel Desempenho avisa isso.
- **Histórico de voltar/avançar:** uma aba suspensa perde esse histórico, mas a URL é mantida.

## Ainda não implementados
- Downloads
- Navegação privada
- Configurações gerais, de aparência e de privacidade
- Miniaturas de abas

## Não validado
- Código Kotlin, tela de Desempenho e testes nunca foram compilados nem executados em aparelho (sem `node_modules`/rede no ambiente de desenvolvimento).
