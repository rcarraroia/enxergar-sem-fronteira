# Sistema de Tratamento de Erros

Este documento descreve o sistema completo de tratamento de erros implementado
na aplicação, fornecendo uma abordagem estruturada e user-friendly para
capturar, processar e exibir erros.

## 🎯 Objetivos

O sistema de tratamento de erros foi projetado para:

- **Capturar erros** de forma consistente em toda a aplicação
- **Processar erros** com informações estruturadas e contextuais
- **Exibir erros** de forma amigável ao usuário
- **Logar erros** para monitoramento e debugging
- **Facilitar debugging** com informações detalhadas
- **Melhorar UX** com mensagens claras e ações sugeridas

## 🏗️ Arquitetura do Sistema

### 1. **Estrutura de Tipos**

```typescript
interface AppError {
  code: string; // Código único do erro
  message: string; // Mensagem técnica
  userMessage?: string; // Mensagem amigável
  severity: ErrorSeverity; // Nível de severidade
  category: ErrorCategory; // Categoria do erro
  timestamp: Date; // Quando ocorreu
  actionable: boolean; // Se usuário pode resolver
  retryable: boolean; // Se pode tentar novamente
  context?: ErrorContext; // Contexto adicional
  originalError?: Error; // Erro original
}
```

### 2. **Categorias de Erro**

- **`validation`**: Erros de validação de dados
- **`authentication`**: Erros de autenticação
- **`authorization`**: Erros de autorização/permissão
- **`network`**: Erros de rede/conectividade
- **`database`**: Erros de banco de dados
- **`business_logic`**: Violações de regras de negócio
- **`system`**: Erros internos do sistema
- **`user_input`**: Erros de entrada do usuário
- **`external_api`**: Erros de APIs externas
- **`file_operation`**: Erros de operações de arquivo

### 3. **Níveis de Severidade**

- **`low`**: Informações ou avisos menores
- **`medium`**: Avisos importantes
- **`high`**: Erros que afetam funcionalidade
- **`critical`**: Erros críticos que requerem atenção imediata

## 🔧 Componentes do Sistema

### 1. **Factory de Erros** (`src/lib/errors/factory.ts`)

Funções para criar erros estruturados:

```typescript
import {
  createError,
  createValidationError,
  createNetworkError,
} from '@/lib/errors';

// Erro genérico
const error = createError('CUSTOM_ERROR', 'Algo deu errado');

// Erro de validação
const validationError = createValidationError('Email é obrigatório', 'email');

// Erro de rede
const networkError = createNetworkError(500, '/api/users', 'GET');
```

### 2. **Sistema de Logging** (`src/lib/errors/logger.ts`)

Logging estruturado com diferentes níveis:

```typescript
import {
  logError,
  logCriticalError,
  setupGlobalErrorHandling,
} from '@/lib/errors';

// Configurar tratamento global
setupGlobalErrorHandling();

// Logar erro
logError(appError);

// Logar erro crítico (envia para serviços externos)
logCriticalError(criticalError);
```

### 3. **Hook de Tratamento** (`src/hooks/useErrorHandler.ts`)

Hook React para tratamento de erros:

```typescript
import { useErrorHandler } from '@/lib/errors';

function MyComponent() {
  const { handleError, withErrorHandling, errors, clearErrors } =
    useErrorHandler();

  const handleSubmit = async () => {
    const result = await withErrorHandling(async () => {
      return await api.createUser(userData);
    });

    if (result.success) {
      // Sucesso
    } else {
      // Erro já foi tratado automaticamente
    }
  };
}
```

### 4. **Componentes de UI** (`src/components/errors/`)

Componentes para exibir erros:

```typescript
import { ErrorDisplay, ErrorList, ErrorBoundary } from '@/lib/errors'

// Exibir erro único
<ErrorDisplay
  error={error}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  showDetails={true}
/>

// Exibir lista de erros
<ErrorList
  errors={errors}
  onDismiss={handleDismissError}
  onDismissAll={handleClearAll}
/>

// Error Boundary para capturar erros React
<ErrorBoundary level="page">
  <MyComponent />
</ErrorBoundary>
```

## 📱 Uso Prático

### 1. **Validação de Formulários**

```typescript
import { useFormErrorHandler } from '@/lib/errors';

function UserForm() {
  const { handleValidationError, clearErrors } = useFormErrorHandler();

  const validateForm = (data: UserData) => {
    clearErrors();

    if (!data.name) {
      handleValidationError('Nome é obrigatório', 'name');
      return false;
    }

    if (!data.email.includes('@')) {
      handleValidationError('Email inválido', 'email');
      return false;
    }

    return true;
  };
}
```

### 2. **Chamadas de API**

```typescript
import { useApiErrorHandler } from '@/lib/errors';

function UserService() {
  const { withErrorHandling, withRetry } = useApiErrorHandler();

  const createUser = async (userData: UserData) => {
    // Com tratamento básico
    const result = await withErrorHandling(() =>
      supabase.from('users').insert(userData)
    );

    // Com retry automático
    const resultWithRetry = await withRetry(
      () => supabase.from('users').insert(userData),
      3 // máximo 3 tentativas
    );

    return result;
  };
}
```

### 3. **Tratamento de Erros do Supabase**

```typescript
import { handleSupabaseError, safeSelect, safeMutation } from '@/lib/errors';

// Tratamento manual
try {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    const appError = handleSupabaseError(error);
    // Tratar erro estruturado
  }
} catch (error) {
  const appError = handleSupabaseError(error);
}

// Tratamento automático
const { data, error } = await safeSelect(() =>
  supabase.from('users').select('*')
);

if (error) {
  // Erro já é um AppError estruturado
}
```

### 4. **Error Boundaries**

```typescript
import { ErrorBoundary, PageErrorBoundary } from '@/lib/errors'

// Para páginas inteiras
function App() {
  return (
    <PageErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </PageErrorBoundary>
  )
}

// Para seções específicas
function Dashboard() {
  return (
    <div>
      <ErrorBoundary level="section">
        <UserProfile />
      </ErrorBoundary>

      <ErrorBoundary level="section">
        <UserSettings />
      </ErrorBoundary>
    </div>
  )
}
```

## 🎨 Componentes de UI

### 1. **ErrorDisplay**

Componente principal para exibir erros:

```typescript
<ErrorDisplay
  error={error}
  variant="alert" | "card" | "inline"
  onRetry={() => {}}
  onDismiss={() => {}}
  showDetails={false}
/>
```

**Variantes:**

- **`alert`**: Estilo de alerta (padrão)
- **`card`**: Estilo de card com mais informações
- **`inline`**: Estilo inline compacto

### 2. **ErrorList**

Lista de múltiplos erros:

```typescript
<ErrorList
  errors={errors}
  onRetry={(index) => {}}
  onDismiss={(index) => {}}
  onDismissAll={() => {}}
  showDetails={false}
/>
```

### 3. **FieldError**

Erro específico para campos de formulário:

```typescript
<FieldError error="Campo obrigatório" />
```

## 🔧 Configuração

### 1. **Setup Inicial**

```typescript
import { setupErrorSystem } from '@/lib/errors';

// Configurar sistema completo
setupErrorSystem({
  logLevel: 'medium',
  enableGlobalHandling: true,
  enableVerboseLogging: process.env.NODE_ENV === 'development',
});
```

### 2. **Configuração do Logger**

```typescript
import { configureErrorLogger } from '@/lib/errors';

configureErrorLogger({
  logLevel: 'medium',
  includeStack: true,
  includeContext: true,
  sensitiveFields: ['password', 'token', 'apiKey'],
});
```

### 3. **Integração com Serviços Externos**

```typescript
// Configurar variáveis de ambiente
VITE_SENTRY_DSN = your_sentry_dsn;
VITE_LOGROCKET_APP_ID = your_logrocket_id;

// O sistema automaticamente enviará erros críticos
```

## 📊 Monitoramento e Métricas

### 1. **Logs Estruturados**

Todos os erros são logados com informações estruturadas:

```json
{
  "timestamp": "2025-08-23T10:30:00Z",
  "code": "VALIDATION_FAILED",
  "message": "Email é obrigatório",
  "userMessage": "Por favor, informe um email válido",
  "severity": "medium",
  "category": "validation",
  "context": {
    "field": "email",
    "userId": "user123",
    "action": "user_registration"
  }
}
```

### 2. **Métricas Automáticas**

O sistema coleta métricas automaticamente:

- Contadores de erro por categoria
- Contadores de erro por severidade
- Tempo de resposta de operações
- Taxa de retry de operações

### 3. **Alertas**

Erros críticos geram alertas automáticos:

- Envio para Sentry/LogRocket
- Notificações para equipe de desenvolvimento
- Métricas para dashboards de monitoramento

## 🧪 Testes

### 1. **Testando Tratamento de Erros**

```typescript
import { createValidationError, isAppError } from '@/lib/errors';

describe('Error Handling', () => {
  it('should create validation error', () => {
    const error = createValidationError('Required field', 'email');

    expect(isAppError(error)).toBe(true);
    expect(error.category).toBe('validation');
    expect(error.actionable).toBe(true);
  });

  it('should handle component errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleValidationError('Test error');
    });

    expect(result.current.errors).toHaveLength(1);
  });
});
```

### 2. **Testando Error Boundaries**

```typescript
import { ErrorBoundary } from '@/lib/errors'

const ThrowError = () => {
  throw new Error('Test error')
}

test('should catch component errors', () => {
  const onError = jest.fn()

  render(
    <ErrorBoundary onError={onError}>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(onError).toHaveBeenCalled()
})
```

## 🔍 Debugging

### 1. **Logs Detalhados**

Em desenvolvimento, habilite logs verbosos:

```typescript
import { enableVerboseLogging } from '@/lib/errors';

if (process.env.NODE_ENV === 'development') {
  enableVerboseLogging();
}
```

### 2. **Contexto de Erro**

Adicione contexto útil aos erros:

```typescript
const error = withUserContext(
  withActionContext(baseError, 'user_registration', 'users'),
  user.id,
  user.role
);
```

### 3. **Stack Traces**

Stack traces são incluídos automaticamente em desenvolvimento:

```typescript
// Erro incluirá stack trace completo em dev
const error = createError('CUSTOM_ERROR', 'Something went wrong');
```

## 📚 Exemplos Completos

### 1. **Formulário com Validação**

```typescript
import { useFormErrorHandler, ErrorDisplay } from '@/lib/errors'

function UserRegistrationForm() {
  const [formData, setFormData] = useState({})
  const { handleValidationError, errors, clearErrors } = useFormErrorHandler()

  const validateAndSubmit = async () => {
    clearErrors()

    // Validações
    if (!formData.name) {
      handleValidationError('Nome é obrigatório', 'name')
      return
    }

    if (!formData.email?.includes('@')) {
      handleValidationError('Email inválido', 'email')
      return
    }

    // Submeter se válido
    try {
      await submitForm(formData)
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <form>
      {/* Campos do formulário */}

      {errors.map((error, index) => (
        <ErrorDisplay key={index} error={error} variant="inline" />
      ))}

      <button onClick={validateAndSubmit}>Cadastrar</button>
    </form>
  )
}
```

### 2. **Serviço de API com Retry**

```typescript
import { useApiErrorHandler, handleSupabaseError } from '@/lib/errors';

function useUserService() {
  const { withRetry, withErrorHandling } = useApiErrorHandler();

  const createUser = async (userData: UserData) => {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return data;
    }, 3);
  };

  const getUser = async (id: string) => {
    return await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return data;
    });
  };

  return { createUser, getUser };
}
```

## 🚀 Melhores Práticas

### 1. **Sempre Use Erros Estruturados**

```typescript
// ✅ Bom
throw createValidationError('Email é obrigatório', 'email');

// ❌ Evitar
throw new Error('Email é obrigatório');
```

### 2. **Forneça Contexto Útil**

```typescript
// ✅ Bom
const error = withActionContext(
  createError('OPERATION_FAILED', 'Falha na operação'),
  'user_creation',
  'users'
);

// ❌ Evitar
const error = createError('ERROR', 'Erro');
```

### 3. **Use Mensagens User-Friendly**

```typescript
// ✅ Bom
createError('DB_CONNECTION_FAILED', 'Database connection failed', {
  userMessage:
    'Problema temporário de conexão. Tente novamente em alguns minutos.',
});

// ❌ Evitar
createError('DB_CONNECTION_FAILED', 'ECONNREFUSED 127.0.0.1:5432');
```

### 4. **Implemente Error Boundaries**

```typescript
// ✅ Bom - Proteger seções críticas
<ErrorBoundary level="section">
  <CriticalComponent />
</ErrorBoundary>

// ✅ Bom - Proteger página inteira
<PageErrorBoundary>
  <App />
</PageErrorBoundary>
```

### 5. **Use Hooks Especializados**

```typescript
// ✅ Bom - Para formulários
const { handleValidationError } = useFormErrorHandler();

// ✅ Bom - Para APIs
const { withRetry, handleSupabaseError } = useApiErrorHandler();

// ✅ Bom - Para casos simples
const handleError = useSimpleErrorHandler();
```

## 📝 Checklist de Implementação

- [ ] Sistema de tipos implementado
- [ ] Factory de erros configurado
- [ ] Sistema de logging ativo
- [ ] Hooks de tratamento implementados
- [ ] Cponentes de UI criados
- [ ] Error boundaries configurados
- [ ] Tratamento de erros do Supabase
- [ ] Testes de erro implementados
- [ ] Documentação atualizada
- [ ] Monitoramento configurado

## 🔗 Recursos Relacionados

- [Padrões de Código](./CODING_STANDARDS.md)
- [Guia de Testes](./TESTING_GUIDE.md)
- [Documentação de API](./API_DOCUMENTATION.md)
- [Guia de Segurança](./SECURITY_GUIDE.md)
