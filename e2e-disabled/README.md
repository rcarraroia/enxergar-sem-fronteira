# Testes End-to-End (E2E) - Desabilitados

Esta pasta contém testes end-to-end que foram temporariamente desabilitados
durante as correções críticas da auditoria.

## Por que foram desabilitados?

Os testes E2E requerem o Playwright para funcionar, que não está atualmente
instalado no projeto. Durante a fase de correções críticas, focamos nos testes
unitários que são essenciais para a qualidade do código.

## Como reabilitar os testes E2E

1. Instalar o Playwright:

   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. Configurar o Playwright (criar `playwright.config.ts`)

3. Mover os arquivos de volta para a pasta `e2e/`

4. Executar os testes:
   ```bash
   npx playwright test
   ```

## Arquivos nesta pasta

- `notification-templates.spec.ts` - Testes E2E completos para o sistema de
  templates de notificação

## Cobertura dos testes E2E

Os testes cobrem:

- ✅ Criação de templates (Email e WhatsApp)
- ✅ Edição de templates existentes
- ✅ Exclusão de templates
- ✅ Alternância de status ativo/inativo
- ✅ Preview em tempo real
- ✅ Validação de erros
- ✅ Helper de variáveis
- ✅ Integração com envio de mensagens
- ✅ Design responsivo (mobile/tablet)
- ✅ Testes de performance

Estes testes são valiosos e devem ser reabilitados após a conclusão das
correções críticas.
