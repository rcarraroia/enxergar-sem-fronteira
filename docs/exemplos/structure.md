# Estrutura do Projeto COMADEMIG

## Organização de Pastas

### `/src` - Código Fonte Principal
```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base do shadcn/ui
│   ├── admin/          # Componentes específicos da área administrativa
│   ├── affiliates/     # Componentes do sistema de afiliados
│   ├── auth/           # Componentes de autenticação
│   ├── carteira/       # Componentes da carteira digital
│   ├── certidoes/      # Componentes de certidões
│   ├── dashboard/      # Componentes do dashboard
│   ├── events/         # Componentes de eventos
│   ├── forms/          # Formulários reutilizáveis
│   ├── layout/         # Componentes de layout
│   └── payments/       # Componentes de pagamento
├── contexts/           # Contextos React (AuthContext)
├── hooks/              # Custom hooks
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos do Supabase
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
│   └── dashboard/      # Páginas do dashboard
└── utils/              # Funções utilitárias
```

### `/supabase` - Backend e Banco de Dados
```
supabase/
├── functions/          # Edge Functions (webhooks, pagamentos)
├── migrations/         # Migrações do banco de dados
└── config.toml         # Configuração do Supabase
```

## Convenções de Nomenclatura

### Componentes
- **PascalCase** para nomes de componentes: `PaymentForm.tsx`
- **Sufixos descritivos**: `Modal`, `Card`, `Form`, `Button`
- **Agrupamento por funcionalidade** em subpastas

### Hooks
- **Prefixo `use`**: `useAuthState.ts`
- **Nomes descritivos**: `useCarteiraDigital.ts`
- **Um hook por arquivo**

### Páginas
- **PascalCase**: `Filiacao.tsx`, `Dashboard.tsx`
- **Páginas do dashboard** em subpasta separada
- **Roteamento** segue estrutura de pastas

### Utilitários
- **camelCase**: `pdfUtils.ts`, `qrCodeUtils.ts`
- **Sufixo `Utils`** para arquivos de utilitários

## Padrões de Arquitetura

### Estrutura de Componentes
```typescript
// Imports externos primeiro
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Imports internos
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/hooks/useAuthState';

// Tipos/interfaces
interface ComponentProps {
  // props aqui
}

// Componente principal
export default function Component({ }: ComponentProps) {
  // hooks
  // estado local
  // funções
  // render
}
```

### Hooks Customizados
- **Responsabilidade única** por hook
- **Retorno consistente** com objetos nomeados
- **Tratamento de erro** integrado
- **Loading states** quando aplicável

### Integração com Supabase
- **Cliente centralizado** em `/src/integrations/supabase/client.ts`
- **Tipos gerados automaticamente** em `/src/integrations/supabase/types.ts`
- **Queries via TanStack Query** para cache e sincronização

## Regra de Gestão de Scripts e Migrações

### Princípio Fundamental
- **NUNCA** criar múltiplas versões do mesmo script/migração
- **SEMPRE** corrigir o script existente usando strReplace
- **APENAS** criar novo arquivo se absolutamente necessário para funcionalidade diferente

### Protocolo Obrigatório

#### 1. Correção de Erros
- Usar APENAS `strReplace` para corrigir erros em scripts existentes
- NUNCA criar arquivo novo para correção de erro
- Manter o mesmo nome de arquivo durante correções

#### 2. Limpeza Obrigatória
- Se for necessário criar novo script, DELETAR imediatamente os scripts com erro usando `deleteFile`
- Manter apenas 1 script funcional por objetivo
- Explicar claramente qual script usar

#### 3. Nomenclatura Clara
- Scripts devem ter nomes descritivos únicos
- Evitar nomes genéricos como "fix", "correção", "v2"
- Incluir timestamp apenas se necessário para ordem de execução

#### 4. Comunicação
- Sempre informar qual arquivo específico executar
- Não dar múltiplas opções ao usuário
- Ser direto: "Execute APENAS este arquivo: [nome_exato]"

### Violações Proibidas
- Criar arquivos: script.sql, script_v2.sql, script_final.sql
- Deixar scripts com erro no sistema
- Dar instruções ambíguas sobre qual script usar
- Criar "versões de backup" desnecessárias

### Aplicação Imediata
Esta regra se aplica a: migrações SQL, scripts de configuração, arquivos de correção, e qualquer arquivo técnico similar.

## 🚨 REGRA CRÍTICA: PRESERVAÇÃO OBRIGATÓRIA DE LAYOUTS E POLÍTICAS APROVADAS

### ⛔ PROIBIÇÃO ABSOLUTA DE ALTERAÇÕES NÃO AUTORIZADAS
- **JAMAIS** alterar layouts, regras, políticas ou funcionalidades sem AUTORIZAÇÃO EXPRESSA
- **OBRIGATÓRIO** solicitar permissão e explicar detalhadamente o motivo antes de qualquer mudança
- **INADMISSÍVEL** ignorar instruções sobre preservação de funcionalidades existentes

### 🔒 COMPONENTES ABSOLUTAMENTE PROTEGIDOS

#### Área Administrativa - INTOCÁVEL
- **DashboardSidebar** (`src/components/dashboard/DashboardSidebar.tsx`) - NUNCA alterar rotas ou estrutura
- **Prerrogativas de Admin** - JAMAIS modificar permissões ou acessos administrativos
- **Menus e navegação** do painel administrativo - PRESERVAR estrutura existente
- **Rotas administrativas** - NÃO quebrar links ou funcionalidades

#### Layouts Críticos - PRESERVAR SEMPRE
- Estrutura do Header e Footer
- Layout completo do Dashboard
- Design das páginas públicas (Home, Sobre, Filiação, etc.)
- Formulários de pagamento e checkout
- Sistema de navegação e menus

#### Políticas e Regras de Negócio - IMUTÁVEIS
- Páginas de Termos de Uso (`src/pages/Termos.tsx`)
- Política de Privacidade (`src/pages/Privacidade.tsx`)
- Fluxos de pagamento e cobrança
- Sistema de afiliados e comissões
- Regras de validação de carteiras e certidões
- Permissões e roles de usuários

#### Funcionalidades Críticas - NÃO TOCAR
- Sistema de autenticação e autorização
- Integração com gateway de pagamento Asaas
- Geração de PDFs (carteiras, certidões, certificados)
- Sistema de QR Code para validação
- Banco de dados e migrações aprovadas

### 📋 PROTOCOLO OBRIGATÓRIO PARA ALTERAÇÕES

#### ANTES de fazer QUALQUER mudança:
1. **PARAR** e identificar se afeta componente protegido
2. **SOLICITAR AUTORIZAÇÃO** explicando:
   - O que precisa ser alterado
   - Por que é necessário
   - Qual o impacto esperado
   - Como será testado
3. **AGUARDAR APROVAÇÃO** antes de prosseguir
4. **DOCUMENTAR** todas as mudanças realizadas

#### EM CASO DE AUDITORIA OU CORREÇÕES:
- **NUNCA** assumir que pode alterar sem consultar
- **SEMPRE** explicar o problema identificado
- **PROPOR** solução sem quebrar funcionalidades existentes
- **TESTAR** extensivamente antes de aplicar

### ⚠️ CONSEQUÊNCIAS DE VIOLAÇÕES
- Alterações não autorizadas são **INADMISSÍVEIS**
- Quebra de funcionalidades administrativas é **INACEITÁVEL**
- Ignorar instruções de preservação é **PROIBIDO**

### ✅ ÚNICAS EXCEÇÕES PERMITIDAS (com autorização)
- Correções de bugs críticos de segurança
- Melhorias de performance sem impacto visual/funcional
- Adição de novas funcionalidades SEM modificar existentes
- Atualizações de dependências necessárias para segurança