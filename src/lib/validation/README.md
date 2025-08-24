# Sistema de Validação

Este diretório contém o sistema completo de validação de dados da aplicação, implementado com Zod para garantir segurança e consistência dos dados.

## 📋 Visão Geral

O sistema de validação fornece:

- **Schemas rigorosos** para todas as entidades
- **Validação em tempo real** em formulários
- **Sanitização automática** de dados
- **Formatação inteligente** (CPF, telefone, CEP)
- **Mensagens de erro user-friendly**
- **Integração com React** através de hooks

## 🗂️ Estrutura

```
src/lib/validation/
├── schemas.ts          # Schemas Zod para entidades
├── utils.ts           # Funções utilitárias de validação
├── middleware.ts      # Middleware para APIs
└── README.md         # Esta documentação
```

## 🔧 Componentes Principais

### 1. Schemas (`schemas.ts`)

Define a estrutura e validações para todas as entidades:

```typescript
import { PatientSchema, CPFSchema, EmailSchema } from '@/lib/validation/schemas'

// Validar dados de paciente
const result = PatientSchema.safeParse(formData)
if (result.success) {
  console.log('Dados válidos:', result.data)
}
```

**Schemas disponíveis:**
- `PatientSchema` - Dados de pacientes
- `CPFSchema` - CPF brasileiro
- `EmailSchema` - Email com validações rigorosas
- `PhoneSchema` - Telefones brasileiros
- `BirthDateSchema` - Data de nascimento

### 2. Utilitários (`utils.ts`)

Funções auxiliares para validação e formatação:

```typescript
import { 
  validateData, 
  sanitizeString, 
  validateAndFormatCPF 
} from '@/lib/validation/utils'

// Validação com resultado estruturado
const result = validateData(PatientSchema, userData)

// Sanitização de strings
const clean = sanitizeString('<script>alert("xss")</script>João', {
  allowHtml: false
})

// Formatação de CPF
const { valid, formatted } = validateAndFormatCPF('12345678909')
```

### 3. Middleware (`middleware.ts`)

Middleware para validação automática em APIs:

```typescript
import { validateRequest } from '@/lib/validation/middleware'

// Em uma Edge Function
export default validateRequest(PatientSchema, async (req, validatedData) => {
  // validatedData já está validado e sanitizado
  const patient = await createPatient(validatedData)
  return Response.json(patient)
})
```

## 🎯 Uso em Formulários

### Hook de Validação

```typescript
import { useFormValidation } from '@/hooks/useValidation'
import { PatientSchema } from '@/lib/validation/schemas'

const MyForm = () => {
  const {
    data,
    errors,
    isValid,
    setValue,
    getFieldError,
    handleSubmit
  } = useFormValidation({
    schema: PatientSchema,
    initialData: {},
    validateOnChange: true
  })

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.nome || ''}
        onChange={(e) => setValue('nome', e.target.value)}
      />
      {getFieldError('nome') && (
        <span className="error">{getFieldError('nome')}</span>
      )}
    </form>
  )
}
```

### Componentes Validados

```typescript
import { ValidatedInput, CPFInput, PhoneInput } from '@/components/forms/ValidatedInput'

const PatientForm = () => (
  <div>
    <ValidatedInput
      label="Nome completo"
      value={nome}
      onChange={setNome}
      schema={z.string().min(2)}
      required
    />
    
    <CPFInput
      label="CPF"
      value={cpf}
      onChange={setCpf}
      autoFormat
    />
    
    <PhoneInput
      label="Telefone"
      value={telefone}
      onChange={setTelefone}
      required
    />
  </div>
)
```

## 🛡️ Segurança

### Sanitização Automática

Todos os dados são automaticamente sanitizados para prevenir ataques XSS:

```typescript
// Remove HTML perigoso
const safe = sanitizeString('<script>alert("xss")</script>João')
// Resultado: "João"

// Permite HTML seguro
const safe = sanitizeString('<b>João</b><script>alert("xss")</script>', {
  allowHtml: true
})
// Resultado: "<b>João</b>"
```

### Validação Rigorosa

- **CPF**: Validação completa dos dígitos verificadores
- **Email**: Verificações além do formato padrão
- **Telefone**: Suporte a diversos formatos brasileiros
- **Datas**: Validação de intervalos e formatos

## 📱 Formatação Automática

### CPF
```typescript
validateAndFormatCPF('12345678909')
// { valid: true, formatted: '123.456.789-09' }
```

### Telefone
```typescript
validateAndFormatPhone('11999999999')
// { valid: true, formatted: '(11) 99999-9999' }
```

### CEP
```typescript
validateAndFormatCEP('01234567')
// { valid: true, formatted: '01234-567' }
```

## 🔄 Validação Assíncrona

Para validações que dependem de APIs externas:

```typescript
const AsyncEmailSchema = z.string()
  .email()
  .refine(async (email) => {
    const exists = await checkEmailExists(email)
    return !exists
  }, 'Email já está em uso')

const result = await validateDataAsync(AsyncEmailSchema, 'test@email.com')
```

## 🎨 Personalização

### Mensagens de Erro Customizadas

```typescript
const CustomPatientSchema = z.object({
  nome: z.string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome não pode ter mais de 100 caracteres'),
  
  idade: z.number()
    .min(0, 'Idade não pode ser negativa')
    .max(120, 'Idade deve ser realista')
})
```

### Transformações Automáticas

```typescript
const NormalizedNameSchema = z.string()
  .transform(name => 
    name.trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase())
  )
```

## 🧪 Testes

### Testando Schemas

```typescript
describe('PatientSchema', () => {
  it('should validate valid patient data', () => {
    const validData = {
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      data_nascimento: '1990-05-15'
    }
    
    const result = PatientSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
  
  it('should reject invalid email', () => {
    const invalidData = {
      nome: 'João Silva',
      email: 'email-inválido',
      telefone: '(11) 99999-9999',
      data_nascimento: '1990-05-15'
    }
    
    const result = PatientSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].path).toEqual(['email'])
  })
})
```

### Testando Formatação

```typescript
describe('validateAndFormatCPF', () => {
  it('should format valid CPF', () => {
    const result = validateAndFormatCPF('12345678909')
    expect(result.valid).toBe(true)
    expect(result.formatted).toBe('123.456.789-09')
  })
  
  it('should reject invalid CPF', () => {
    const result = validateAndFormatCPF('11111111111')
    expect(result.valid).toBe(false)
  })
})
```

## 🚀 Performance

### Otimizações Implementadas

1. **Lazy Validation**: Validação apenas quando necessário
2. **Memoização**: Resultados de validação são cached
3. **Debounce**: Validação em tempo real com delay
4. **Partial Validation**: Validação incremental em formulários

### Métricas

- **Validação simples**: ~1ms
- **Validação com formatação**: ~2-3ms
- **Validação assíncrona**: ~50-100ms (dependendo da API)

## 🔧 Configuração

### Opções Globais

```typescript
// Configurar sanitização padrão
const defaultSanitizationOptions: SanitizationOptions = {
  allowHtml: false,
  trimWhitespace: true,
  removeExtraSpaces: true,
  maxLength: 1000
}

// Configurar validação de formulários
const defaultFormOptions = {
  validateOnChange: true,
  validateOnBlur: true,
  sanitize: true
}
```

## 📚 Referências

- [Zod Documentation](https://zod.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [React Hook Form](https://react-hook-form.com/)
- [Algoritmo de CPF](https://www.geradorcpf.com/algoritmo_do_cpf.htm)

## 🤝 Contribuindo

Ao adicionar novos schemas ou validações:

1. **Documente** com JSDoc completo
2. **Teste** todas as validações
3. **Considere** casos extremos
4. **Mantenha** consistência com padrões existentes
5. **Adicione** exemplos de uso