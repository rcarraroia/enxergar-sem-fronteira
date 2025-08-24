# Padrões de Qualidade de Código

Este documento estabelece os padrões de qualidade de código para o projeto Enxergar Sem Fronteira.

## 📋 Índice

- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Convenções de Nomenclatura](#convenções-de-nomenclatura)
- [Padrões TypeScript](#padrões-typescript)
- [Padrões React](#padrões-react)
- [Documentação JSDoc](#documentação-jsdoc)
- [Tratamento de Erros](#tratamento-de-erros)
- [Validação de Dados](#validação-de-dados)
- [Testes](#testes)
- [Performance](#performance)

## 🗂️ Estrutura de Arquivos

### Organização de Diretórios

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── forms/          # Componentes de formulário
│   ├── errors/         # Componentes de tratamento de erro
│   └── [feature]/      # Componentes específicos por funcionalidade
├── hooks/              # Custom hooks React
├── lib/                # Utilitários e configurações
│   ├── api/           # Funções de API
│   ├── errors/        # Sistema de tratamento de erros
│   ├── validation/    # Schemas e validações
│   └── utils/         # Utilitários gerais
├── pages/              # Páginas da aplicação
└── types/              # Definições de tipos TypeScript
```

### Convenções de Arquivos

- **Componentes React**: PascalCase (`PatientForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useValidation.ts`)
- **Utilitários**: camelCase (`formatCurrency.ts`)
- **Tipos**: PascalCase (`Patient.types.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

## 🏷️ Convenções de Nomenclatura

### Variáveis e Funções

```typescript
// ✅ Bom - camelCase descritivo
const patientData = { ... }
const isFormValid = true
const handleSubmitForm = () => { ... }

// ❌ Evitar - nomes genéricos ou abreviados
const data = { ... }
const flag = true
const handle = () => { ... }
```

### Componentes React

```typescript
// ✅ Bom - PascalCase descritivo
const PatientRegistrationForm = () => { ... }
const ErrorBoundary = () => { ... }

// ❌ Evitar - nomes genéricos
const Form = () => { ... }
const Component = () => { ... }
```

### Interfaces e Tipos

```typescript
// ✅ Bom - PascalCase com sufixo descritivo
interface PatientFormProps {
  onSubmit: (data: Patient) => void
}

type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// ❌ Evitar - prefixo I desnecessário
interface IPatient { ... }
```

## 🔷 Padrões TypeScript

### Tipagem Rigorosa

```typescript
// ✅ Bom - tipos específicos
interface Patient {
  id: string
  nome: string
  email: string
  telefone: string
  dataNascimento: Date
}

// ❌ Evitar - any ou tipos genéricos demais
interface Patient {
  id: any
  data: object
}
```

### Uso de Generics

```typescript
// ✅ Bom - generics bem definidos
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  // implementação
}
```

### Union Types e Enums

```typescript
// ✅ Bom - union types para valores específicos
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

// ✅ Bom - const assertions para objetos imutáveis
const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
```

## ⚛️ Padrões React

### Estrutura de Componentes

```typescript
/**
 * Componente para exibição de dados do paciente
 * 
 * @param patient - Dados do paciente
 * @param onEdit - Callback para edição
 */
interface PatientCardProps {
  patient: Patient
  onEdit?: (patient: Patient) => void
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onEdit
}) => {
  // Hooks no topo
  const [isExpanded, setIsExpanded] = useState(false)
  const { handleError } = useErrorHandler()
  
  // Handlers
  const handleEditClick = useCallback(() => {
    onEdit?.(patient)
  }, [patient, onEdit])
  
  // Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  )
}
```

### Custom Hooks

```typescript
/**
 * Hook para gerenciar estado de formulário com validação
 * 
 * @param schema - Schema Zod para validação
 * @param initialData - Dados iniciais
 * @returns Estado e métodos do formulário
 */
export function useFormValidation<T>({
  schema,
  initialData
}: UseFormValidationOptions<T>) {
  // Estado
  const [data, setData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  // Métodos
  const validate = useCallback(() => {
    // implementação
  }, [schema, data])
  
  return {
    data,
    errors,
    validate,
    // outros métodos
  }
}
```

### Tratamento de Estados

```typescript
// ✅ Bom - estados específicos e bem definidos
type LoadingState = 'idle' | 'loading' | 'success' | 'error'

const [loadingState, setLoadingState] = useState<LoadingState>('idle')
const [data, setData] = useState<Patient[]>([])
const [error, setError] = useState<AppError | null>(null)

// ❌ Evitar - múltiplos booleans
const [isLoading, setIsLoading] = useState(false)
const [isSuccess, setIsSuccess] = useState(false)
const [isError, setIsError] = useState(false)
```

## 📚 Documentação JSDoc

### Funções e Métodos

```typescript
/**
 * Valida dados usando schema Zod e retorna resultado estruturado
 * 
 * Função principal para validação de dados que converte erros do Zod
 * em um formato padronizado e user-friendly.
 * 
 * @template T - Tipo dos dados esperados após validação
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Resultado estruturado com dados validados ou erros
 * 
 * @example
 * ```typescript
 * const result = validateData(PatientSchema, formData)
 * if (result.success) {
 *   console.log('Dados válidos:', result.data)
 * } else {
 *   console.log('Erros:', result.errors)
 * }
 * ```
 * 
 * @throws {Error} Quando o schema é inválido
 * @since 1.0.0
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  // implementação
}
```

### Interfaces e Tipos

```typescript
/**
 * Representa um paciente no sistema
 * 
 * @interface Patient
 * @property {string} id - Identificador único do paciente
 * @property {string} nome - Nome completo do paciente
 * @property {string} email - Email para contato
 * @property {string} telefone - Telefone brasileiro formatado
 * @property {Date} dataNascimento - Data de nascimento
 * @property {string} [cpf] - CPF brasileiro (opcional)
 * @property {string} [diagnostico] - Diagnóstico médico (opcional)
 */
interface Patient {
  id: string
  nome: string
  email: string
  telefone: string
  dataNascimento: Date
  cpf?: string
  diagnostico?: string
}
```

### Componentes React

```typescript
/**
 * Formulário completo de cadastro/edição de pacientes
 * 
 * Componente que implementa um formulário completo para cadastro e edição de pacientes,
 * com validação rigorosa, tratamento de erros integrado e experiência de usuário otimizada.
 * 
 * @component
 * @example
 * ```tsx
 * <PatientRegistrationForm
 *   onSubmit={async (data) => {
 *     const result = await createPatient(data)
 *     if (result.success) {
 *       navigate('/patients')
 *     }
 *   }}
 *   onCancel={() => navigate('/patients')}
 * />
 * ```
 */
export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  // implementação
})
```

## 🚨 Tratamento de Erros

### Sistema de Erros Estruturado

```typescript
// ✅ Bom - usar classes de erro específicas
throw new AppValidationError({
  message: 'Nome é obrigatório',
  field: 'nome',
  userMessage: 'Por favor, informe o nome do paciente.'
})

// ❌ Evitar - erros genéricos
throw new Error('Erro de validação')
```

### Tratamento em Componentes

```typescript
const { handleError } = useErrorHandler()

const handleSubmit = async (data: Patient) => {
  try {
    await createPatient(data)
    toast.success('Paciente criado com sucesso!')
  } catch (error) {
    // Sistema de erros trata automaticamente
    await handleError(error)
  }
}
```

## ✅ Validação de Dados

### Schemas Zod

```typescript
// ✅ Bom - schemas bem documentados e específicos
export const PatientSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras')
    .transform(name => name.trim().replace(/\s+/g, ' ')),
  
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email muito curto')
    .max(254, 'Email muito longo'),
  
  telefone: PhoneSchema,
  cpf: CPFSchema.optional()
})
```

### Validação em Tempo Real

```typescript
const {
  data,
  errors,
  setValue,
  getFieldError
} = useFormValidation({
  schema: PatientSchema,
  validateOnChange: true
})
```

## 🧪 Testes

### Estrutura de Testes

```typescript
describe('PatientRegistrationForm', () => {
  it('should validate required fields', async () => {
    render(<PatientRegistrationForm onSubmit={mockSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /cadastrar/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
  })
  
  it('should format CPF automatically', async () => {
    render(<PatientRegistrationForm onSubmit={mockSubmit} />)
    
    const cpfInput = screen.getByLabelText(/cpf/i)
    fireEvent.change(cpfInput, { target: { value: '12345678909' } })
    
    expect(cpfInput).toHaveValue('123.456.789-09')
  })
})
```

## ⚡ Performance

### Otimizações React

```typescript
// ✅ Bom - usar memo para componentes pesados
export const PatientList = React.memo<PatientListProps>(({ patients }) => {
  return (
    <div>
      {patients.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  )
})

// ✅ Bom - usar useCallback para handlers
const handlePatientEdit = useCallback((patient: Patient) => {
  setEditingPatient(patient)
  setModalOpen(true)
}, [])

// ✅ Bom - usar useMemo para cálculos pesados
const filteredPatients = useMemo(() => {
  return patients.filter(patient => 
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [patients, searchTerm])
```

### Lazy Loading

```typescript
// ✅ Bom - lazy loading de componentes
const PatientRegistrationForm = lazy(() => 
  import('./components/forms/PatientRegistrationForm')
)

const PatientList = lazy(() => 
  import('./components/patients/PatientList')
)
```

## 🔧 Ferramentas de Qualidade

### ESLint Rules

```json
{
  "rules": {
    "@typescript-eslint/no-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "react/jsx-key": "error"
  }
}
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 📝 Checklist de Qualidade

Antes de fazer commit, verifique:

- [ ] Código está tipado corretamente (sem `any`)
- [ ] Funções têm documentação JSDoc
- [ ] Componentes têm props bem definidas
- [ ] Erros são tratados adequadamente
- [ ] Testes cobrem funcionalidades principais
- [ ] Performance foi considerada
- [ ] Acessibilidade foi implementada
- [ ] Código segue padrões de nomenclatura
- [ ] Não há código duplicado
- [ ] Imports estão organizados

## 🚀 Próximos Passos

1. Configurar SonarQube para análise contínua
2. Implementar métricas de qualidade automatizadas
3. Criar templates de código para componentes
4. Estabelecer processo de code review
5. Documentar arquitetura da aplicação