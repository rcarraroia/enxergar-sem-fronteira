# Stack Tecnológico COMADEMIG

## Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite 5
- **Roteamento**: React Router DOM v6
- **Estado**: TanStack Query (React Query) v5
- **UI Framework**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS com tema customizado
- **Formulários**: React Hook Form + Zod para validação

## Backend & Infraestrutura
- **BaaS**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Pagamentos**: Integração com gateway Asaas
- **Hospedagem**: Lovable (deploy automático)

## Bibliotecas Principais
- **PDF**: jsPDF + html2canvas para geração de documentos
- **QR Code**: biblioteca qrcode para carteiras digitais
- **Datas**: date-fns para manipulação de datas
- **Charts**: Recharts para gráficos no dashboard
- **Notificações**: Sonner para toasts

## Comandos Essenciais

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento (porta 8080)
npm run build        # Build para produção
npm run build:dev    # Build para desenvolvimento
npm run lint         # Executa ESLint
npm run preview      # Preview do build
```

### Supabase Local
```bash
supabase start       # Inicia ambiente local
supabase stop        # Para ambiente local
supabase status      # Status dos serviços
supabase db reset    # Reset do banco local
```

## Configurações Importantes
- **Alias de Importação**: `@/` aponta para `./src/`
- **Porta de Desenvolvimento**: 8080
- **TypeScript**: Configurado com strict mode desabilitado para flexibilidade
- **Tema**: Cores customizadas do COMADEMIG (azul #24324F, dourado #C5A349)

## Estrutura de Deploy
- Deploy automático via Lovable
- Integração contínua com GitHub
- Variáveis de ambiente gerenciadas pelo Supabase