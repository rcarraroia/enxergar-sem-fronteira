# Guia de Estrutura de Componentes React

Este documento define os padrões para estruturação de componentes React no projeto.

## 📋 Estrutura Padrão de Componente

### Template Base

```typescript
/**
 * ComponentName - Brief description
 *
 * Detailed description of what this component does,
 * its purpose, and any important usage notes.
 *
 * @component
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value1"
 *   prop2={value2}
 *   onAction={handleAction}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Custom Components
import { CustomComponent } from '@/components/custom/CustomComponent'

// Hooks
import { useCustomHook } from '@/hooks/useCustomHook'

// Utils and Types
import { cn } from '@/lib/utils'
import type { CustomType } from '@/types/custom'

// Constants
import { CONSTANTS } from '@/lib/constants'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Props for ComponentName component
 */
interface ComponentNameProps {
  /** Primary prop description */
  prop1: string
  /** Optional prop description */
  prop2?: number
  /** Callback prop description */
  onAction?: (data: CustomType) => void
  /** Children elements */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

/**
 * Internal state interface (if complex)
 */
interface ComponentState {
  isLoading: boolean
  data: CustomType[]
  error: string | null
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * ComponentName implementation
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = 0,
  onAction,
  children,
  className,
  disabled = false
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [state, setState] = useState<ComponentState>({
    isLoading: false,
    data: [],
    error: null
  })

  const [localState, setLocalState] = useState<string>('')

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { customData, customMethod } = useCustomHook({
    prop1,
    enabled: !disabled
  })

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const computedValue = useMemo(() => {
    return state.data.filter(item => item.active)
  }, [state.data])

  const isReady = useMemo(() => {
    return !state.isLoading && !state.error && state.data.length > 0
  }, [state.isLoading, state.error, state.data.length])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAction = useCallback((data: CustomType) => {
    if (disabled) return

    try {
      // Handle action logic
      onAction?.(data)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [disabled, onAction])

  const handleStateChange = useCallback((newValue: string) => {
    setLocalState(newValue)
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (!prop1) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Async operation
    const loadData = async () => {
      try {
        const result = await customMethod(prop1)
        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load data',
          isLoading: false
        }))
      }
    }

    loadData()
  }, [prop1, customMethod])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderContent = () => {
    if (state.isLoading) {
      return <div>Loading...</div>
    }

    if (state.error) {
      return <div className="text-red-500">Error: {state.error}</div>
    }

    if (!isReady) {
      return <div>No data available</div>
    }

    return (
      <div>
        {computedValue.map(item => (
          <div key={item.id}>
            {item.name}
          </div>
        ))}
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Card className={cn('component-name', className, {
      'opacity-50': disabled
    })}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          {prop1}
        </h2>

        {renderContent()}

        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleAction(customData)}
            disabled={disabled || state.isLoading}
          >
            Action Button
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ComponentName
export type { ComponentNameProps }
```

## 🗂️ Organização de Seções

### 1. **Imports** (Ordem específica)
```typescript
// 1. React e tipos do React
import React, { useState, useCallback } from 'react'
import type { ReactNode, MouseEvent } from 'react'

// 2. Bibliotecas externas
import { toast } from 'sonner'
import { z } from 'zod'

// 3. Componentes UI (shadcn/ui)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 4. Componentes customizados
import { CustomComponent } from '@/components/custom'

// 5. Hooks customizados
import { useCustomHook } from '@/hooks/useCustomHook'

// 6. Utilitários e tipos
import { cn } from '@/lib/utils'
import type { CustomType } from '@/types'

// 7. Constantes
import { CONSTANTS } from '@/lib/constants'
```

### 2. **Types e Interfaces**
```typescript
// Props sempre primeiro
interface ComponentProps {
  // Props obrigatórias primeiro
  required: string

  // Props opcionais depois
  optional?: number

  // Callbacks
  onAction?: () => void

  // Props padrão do React por último
  children?: ReactNode
  className?: string
}

// Interfaces internas depois
interface InternalState {
  // definições
}
```

### 3. **Estado** (Ordem específica)
```typescript
// 1. Estado complexo primeiro
const [complexState, setComplexState] = useState<ComplexType>({
  // estado inicial
})

// 2. Estados simples depois
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### 4. **Hooks Customizados**
```typescript
const { data, loading, error } = useCustomHook({
  // configurações
})
```

### 5. **Valores Computados**
```typescript
const computedValue = useMemo(() => {
  // cálculo
}, [dependencies])
```

### 6. **Handlers**
```typescript
const handleAction = useCallback((param: Type) => {
  // lógica do handler
}, [dependencies])
```

### 7. **Effects**
```typescript
useEffect(() => {
  // lógica do effect
}, [dependencies])
```

### 8. **Render Helpers**
```typescript
const renderSection = () => {
  // JSX helper
}
```

### 9. **Render Principal**
```typescript
return (
  // JSX principal
)
```

## 🎯 Padrões Específicos

### Componentes de Formulário

```typescript
interface FormComponentProps {
  // Dados
  value?: string
  defaultValue?: string

  // Callbacks
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void

  // Validação
  error?: string
  required?: boolean
  disabled?: boolean

  // UI
  label?: string
  placeholder?: string
  helperText?: string

  // Padrão
  className?: string
}
```

### Componentes de Lista

```typescript
interface ListComponentProps<T> {
  // Dados
  items: T[]

  // Renderização
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T) => string

  // Estados
  loading?: boolean
  error?: string

  // Callbacks
  onItemClick?: (item: T) => void
  onLoadMore?: () => void

  // UI
  emptyMessage?: string
  className?: string
}
```

### Componentes de Modal/Dialog

```typescript
interface ModalComponentProps {
  // Estado
  open: boolean
  onOpenChange: (open: boolean) => void

  // Conteúdo
  title?: string
  description?: string
  children?: ReactNode

  // Ações
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string

  // Comportamento
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean

  // UI
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

## 🔧 Hooks Customizados

### Estrutura Padrão

```typescript
/**
 * useCustomHook - Brief description
 *
 * Detailed description of what this hook does
 *
 * @param options - Hook configuration options
 * @returns Hook return values and methods
 */

interface UseCustomHookOptions {
  param1: string
  param2?: number
  enabled?: boolean
}

interface UseCustomHookReturn {
  data: DataType[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCustomHook({
  param1,
  param2 = 0,
  enabled = true
}: UseCustomHookOptions): UseCustomHookReturn {
  // Estado
  const [data, setData] = useState<DataType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Métodos
  const refetch = useCallback(() => {
    // lógica de refetch
  }, [param1, param2])

  // Effects
  useEffect(() => {
    if (!enabled) return
    // lógica principal
  }, [enabled, param1, param2])

  return {
    data,
    loading,
    error,
    refetch
  }
}
```

## 📝 Convenções de Nomenclatura

### Componentes
- **PascalCase**: `UserProfile`, `PatientForm`
- **Descritivo**: Nome deve indicar função
- **Específico**: Evitar nomes genéricos como `Component`, `Item`

### Props
- **camelCase**: `userName`, `isLoading`
- **Booleanos**: Prefixo `is`, `has`, `can`, `should`
- **Callbacks**: Prefixo `on` + verbo: `onClick`, `onSubmit`
- **Handlers**: Prefixo `handle` + ação: `handleClick`, `handleSubmit`

### Estados
- **camelCase**: `isLoading`, `userData`
- **Descritivo**: `selectedItems` ao invés de `items`
- **Específico**: `isSubmitting` ao invés de `loading`

### Funções
- **camelCase**: `calculateTotal`, `validateForm`
- **Verbos**: Começar com verbo de ação
- **Específico**: `submitForm` ao invés de `submit`

## 🎨 Padrões de Estilo

### Classes CSS
```typescript
// ✅ Bom - usar cn() para combinar classes
<div className={cn(
  'base-classes',
  'conditional-classes',
  {
    'state-class': condition,
    'another-state': anotherCondition
  },
  className
)} />

// ❌ Evitar - concatenação manual
<div className={`base-classes ${condition ? 'state-class' : ''} ${className}`} />
```

### Conditional Rendering
```typescript
// ✅ Bom - early returns para casos simples
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data) return <EmptyState />

// ✅ Bom - operador ternário para casos simples
{isVisible ? <Component /> : null}

// ✅ Bom - && para renderização condicional
{items.length > 0 && <ItemList items={items} />}

// ❌ Evitar - ternários aninhados complexos
{condition1 ? (
  condition2 ? <Component1 /> : <Component2 />
) : (
  condition3 ? <Component3 /> : <Component4 />
)}
```

## 🧪 Padrões de Teste

### Estrutura de Teste
```typescript
describe('ComponentName', () => {
  // Setup
  const defaultProps = {
    prop1: 'test-value',
    onAction: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Happy path
  it('should render with default props', () => {
    render(<ComponentName {...defaultProps} />)
    expect(screen.getByText('test-value')).toBeInTheDocument()
  })

  // Interactions
  it('should call onAction when button is clicked', () => {
    render(<ComponentName {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(defaultProps.onAction).toHaveBeenCalled()
  })

  // Edge cases
  it('should handle disabled state', () => {
    render(<ComponentName {...defaultProps} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## 📚 Recursos Adicionais

- [Padrões de Código](./CODING_STANDARDS.md)
- [Guia de Testes](./TESTING_GUIDE.md)
- [Documentação JSDoc](./JSDOC_GUIDE.md)
- [Guia de Performance](./PERFORMANCE_GUIDE.md)
