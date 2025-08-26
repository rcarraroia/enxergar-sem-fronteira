# Testes de Integração

Este diretório contém testes de integração para funcionalidades críticas do sistema "Enxergar sem Fronteira".

## Estrutura dos Testes

### 📁 Arquivos de Teste

- **`auth.integration.test.ts`** - Testes do sistema de autenticação
- **`crud.integration.test.ts`** - Testes de operações CRUD
- **`rls.integration.test.ts`** - Testes de políticas RLS (Row Level Security)
- **`setup.ts`** - Configuração e utilitários para testes de integração

## 🎯 Funcionalidades Testadas

### Sistema de Autenticação
- ✅ Login/logout com credenciais válidas
- ✅ Bloqueio de acesso para usuários não autenticados
- ✅ Verificação de roles (admin, organizer, user)
- ✅ Proteção de rotas baseada em permissões
- ✅ Persistência de sessão
- ✅ Tratamento de erros de autenticação

### Operações CRUD
- ✅ Criação de pacientes com validação
- ✅ Validação de CPF e email
- ✅ Tratamento de duplicação de dados
- ✅ Validação de eventos (status, lotação)
- ✅ Criação de registrações
- ✅ Tratamento de erros de rede
- ✅ Funcionalidade de retry

### Políticas RLS (Row Level Security)
- ✅ Acesso público a eventos ativos
- ✅ Bloqueio de eventos privados para usuários comuns
- ✅ Acesso admin a todos os dados
- ✅ Isolamento de dados por organizador
- ✅ Proteção de dados sensíveis
- ✅ Validação de operações de escrita
- ✅ Auditoria de tentativas não autorizadas
- ✅ Verificação de integridade das políticas

## 🚀 Como Executar

### Executar Todos os Testes de Integração
```bash
npm run test:integration
```

### Executar em Modo Watch
```bash
npm run test:integration:watch
```

### Executar Teste Específico
```bash
npx vitest src/test/integration/auth.integration.test.ts
```

### Executar com Coverage
```bash
npx vitest run src/test/integration/ --coverage
```

## 🛠️ Configuração

### Variáveis de Ambiente
Os testes usam variáveis de ambiente específicas para teste:

```env
NODE_ENV=test
VITE_SUPABASE_URL=https://test.supabase.co
VITE_SUPABASE_ANON_KEY=test-anon-key
TZ=America/Sao_Paulo
```

### Mocks Globais
- **Supabase Client**: Mockado para simular diferentes cenários
- **React Router**: Mockado para testes de navegação
- **Toast Notifications**: Mockado para verificar mensagens
- **LocalStorage/SessionStorage**: Mockado para testes de persistência

## 📋 Cenários de Teste

### Cenários de Sucesso
- ✅ Usuário admin acessa todas as funcionalidades
- ✅ Organizador acessa apenas seus dados
- ✅ Usuário comum acessa apenas dados públicos
- ✅ Criação de dados com validação correta
- ✅ Operações CRUD funcionam conforme esperado

### Cenários de Erro
- ❌ Tentativa de acesso não autorizado
- ❌ Dados inválidos são rejeitados
- ❌ Erros de rede são tratados graciosamente
- ❌ Políticas RLS bloqueiam acesso inadequado
- ❌ Tentativas de modificar dados de outros usuários

### Cenários de Edge Case
- 🔄 Retry após falha de rede
- 🔄 Recuperação de sessão após reload
- 🔄 Validação de integridade de dados
- 🔄 Auditoria de ações suspeitas

## 🧪 Utilitários de Teste

### Criação de Dados de Teste
```typescript
import {
  createTestUser,
  createTestEvent,
  createTestPatient,
  createTestRegistration
} from './setup';

const user = createTestUser('admin');
const event = createTestEvent({ title: 'Evento Especial' });
```

### Configuração de Mocks
```typescript
import { createSupabaseMock, setupAuthenticatedTest } from './setup';

// Mock básico
const mockSupabase = createSupabaseMock({
  user: createTestUser('organizer'),
  data: { id: 'test-data' }
});

// Mock com autenticação
const authMock = setupAuthenticatedTest('admin');
```

### Verificações de Acessibilidade
```typescript
import { expectAccessibleElement, expectVisible } from './setup';

expectAccessibleElement(screen.getByRole('button'));
expectVisible(screen.getByText('Conteúdo'));
```

## 📊 Métricas de Qualidade

### Cobertura de Código
- **Meta**: 80% de cobertura para funcionalidades críticas
- **Foco**: Fluxos de autenticação, CRUD e segurança

### Performance
- **Timeout**: 10 segundos por teste
- **Paralelização**: Testes executam em paralelo quando possível

### Confiabilidade
- **Retry Logic**: Testes incluem lógica de retry para operações de rede
- **Cleanup**: Limpeza automática entre testes
- **Isolamento**: Cada teste é independente

## 🔧 Manutenção

### Adicionando Novos Testes
1. Criar arquivo `*.integration.test.ts`
2. Importar utilitários do `setup.ts`
3. Seguir padrões de nomenclatura existentes
4. Incluir cenários de sucesso e erro
5. Documentar cenários específicos

### Atualizando Mocks
1. Modificar `setup.ts` para novos utilitários
2. Atualizar mocks existentes conforme mudanças na API
3. Manter compatibilidade com testes existentes

### Debugging
```bash
# Executar teste específico com logs detalhados
npx vitest src/test/integration/auth.integration.test.ts --reporter=verbose

# Executar com UI para debugging visual
npx vitest src/test/integration/ --ui
```

## 🚨 Troubleshooting

### Problemas Comuns

**Teste falha com timeout**
- Verificar se mocks estão configurados corretamente
- Aumentar timeout se necessário
- Verificar se há loops infinitos

**Mock não funciona**
- Verificar se import está correto
- Limpar cache: `npx vitest --run --clearCache`
- Verificar se mock está sendo aplicado antes do import

**Erro de DOM**
- Verificar se `jsdom` está configurado
- Usar `cleanup()` após cada teste
- Verificar se componentes estão sendo renderizados corretamente

### Logs de Debug
```typescript
// Habilitar logs detalhados
console.log('Mock called with:', mockSupabase.from.mock.calls);
console.log('Component state:', screen.debug());
```

## 📚 Referências

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react#testing)
