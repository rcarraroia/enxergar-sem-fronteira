# Organização de Imports

Este documento define as regras para organização de imports no projeto.

## 📋 Ordem de Imports

### 1. **React e Tipos do React** (Primeiro)
```typescript
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode, MouseEvent, ChangeEvent } from 'react'
```

### 2. **Bibliotecas Externas** (Ordem alfabética)
```typescript
import { toast } from 'sonner'
import { z } from 'zod'
import clsx from 'clsx'
```

### 3. **Componentes UI (shadcn/ui)**
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

### 4. **Componentes Customizados** (Por categoria)
```typescript
// Componentes de formulário
import { ValidatedInput } from '@/components/forms/ValidatedInput'
import { PatientForm } from '@/components/forms/PatientForm'

// Componentes de layout
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

// Componentes específicos
import { PatientCard } from '@/components/patients/PatientCard'
import { EventList } from '@/components/events/EventList'
```

### 5. **Hooks Customizados**
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useFormValidation } from '@/hooks/useValidation'
import { usePatients } from '@/hooks/usePatients'
```

### 6. **Utilitários e Helpers**
```typescript
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { validateCPF, sanitizeString } from '@/lib/validation/utils'
```

### 7. **Tipos e Interfaces**
```typescript
import type { Patient } from '@/types/patient'
import type { Event } from '@/types/event'
import type { ApiResponse } from '@/types/api'
```

### 8. **Constantes e Configurações**
```typescript
import { API_ENDPOINTS } from '@/lib/constants/api'
import { VALIDATION_MESSAGES } from '@/lib/constants/messages'
import { ROUTES } from '@/lib/constants/routes'
```

### 9. **Estilos** (Por último)
```typescript
import './ComponentName.css'
import styles from './ComponentName.module.css'
```

## 🔧 Regras Específicas

### Agrupamento por Linha em Branco
```typescript
// Grupo 1: React
import React, { useState } from 'react'
import type { ReactNode } from 'react'

// Grupo 2: Bibliotecas externas
import { toast } from 'sonner'
import { z } from 'zod'

// Grupo 3: Componentes UI
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Grupo 4: Componentes customizados
import { PatientForm } from '@/components/forms/PatientForm'

// Grupo 5: Hooks
import { usePatients } from '@/hooks/usePatients'

// Grupo 6: Utilitários
import { cn } from '@/lib/utils'

// Grupo 7: Tipos
import type { Patient } from '@/types/patient'

// Grupo 8: Constantes
import { API_ENDPOINTS } from '@/lib/constants'
```

### Imports Nomeados vs Default
```typescript
// ✅ Bom - imports nomeados organizados
import {
  Button,
  Card,
  Input
} from '@/components/ui'

// ✅ Bom - default import
import PatientForm from '@/components/forms/PatientForm'

// ✅ Bom - combinação
import React, { useState, useCallback } from 'react'
import PatientForm, { type PatientFormProps } from '@/components/forms/PatientForm'
```

### Imports Longos
```typescript
// ✅ Bom - quebra de linha para imports longos
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

// ✅ Bom - um por linha quando muitos
import {
  validateCPF,
  validateEmail,
  validatePhone,
  sanitizeString,
  formatCurrency,
  formatDate
} from '@/lib/utils'
```

## 📁 Estrutura de Paths

### Paths Absolutos (Preferidos)
```typescript
// ✅ Bom - usar @ alias
import { Button } from '@/components/ui/button'
import { usePatients } from '@/hooks/usePatients'
import { Patient } from '@/types/patient'

// ❌ Evitar - paths relativos longos
import { Button } from '../../../components/ui/button'
import { usePatients } from '../../hooks/usePatients'
```

### Paths Relativos (Quando Apropriado)
```typescript
// ✅ Bom - para arquivos próximos
import { PatientCard } from './PatientCard'
import { PatientForm } from './PatientForm'
import type { PatientProps } from './types'

// ✅ Bom - para subcomponentes
import { PatientHeader } from './components/PatientHeader'
import { PatientActions } from './components/PatientActions'
```

## 🎯 Padrões por Tipo de Arquivo

### Componentes React
```typescript
import React, { useState, useCallback } from 'react'
import type { ReactNode } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useErrorHandler } from '@/hooks/useErrorHandler'

import { cn } from '@/lib/utils'
import type { Patient } from '@/types/patient'
```

### Hooks Customizados
```typescript
import { useState, useCallback, useEffect } from 'react'

import { toast } from 'sonner'

import { validateData } from '@/lib/validation/utils'
import { handleError } from '@/lib/errors'
import type { ValidationResult } from '@/types/validation'
```

### Utilitários
```typescript
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

import type { ValidationOptions } from '@/types/validation'
import { ERROR_MESSAGES } from '@/lib/constants'
```

### Páginas/Rotas
```typescript
import React from 'react'

import { Helmet } from 'react-helmet-async'

import { Button } from '@/components/ui/button'
import { PatientList } from '@/components/patients/PatientList'
import { PatientForm } from '@/components/forms/PatientForm'

import { usePatients } from '@/hooks/usePatients'
import { useErrorHandler } from '@/hooks/useErrorHandler'

import type { Patient } from '@/types/patient'
```

## 🔄 Re-exports

### Barrel Exports (index.ts)
```typescript
// components/ui/index.ts
export { Button } from './button'
export { Card, CardContent, CardHeader, CardTitle } from './card'
export { Input } from './input'
export { Label } from './label'

// hooks/index.ts
export { useErrorHandler } from './useErrorHandler'
export { useFormValidation } from './useValidation'
export { usePatients } from './usePatients'

// types/index.ts
export type { Patient } from './patient'
export type { Event } from './event'
export type { ApiResponse } from './api'
```

### Uso de Barrel Exports
```typescript
// ✅ Bom - usar barrel exports quando disponível
import { Button, Card, Input } from '@/components/ui'
import { useErrorHandler, usePatients } from '@/hooks'
import type { Patient, Event } from '@/types'

// ❌ Evitar - imports individuais quando há barrel
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

## 🚫 Antipadrões

### ❌ Imports Desordenados
```typescript
// ❌ Ruim - ordem incorreta
import { Patient } from '@/types/patient'
import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
```

### ❌ Imports Desnecessários
```typescript
// ❌ Ruim - imports não utilizados
import React, { useState, useEffect, useCallback } from 'react' // useEffect não usado
import { Button, Card, Input } from '@/components/ui' // Card não usado
```

### ❌ Imports Duplicados
```typescript
// ❌ Ruim - imports duplicados
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Button as UIButton } from '@/components/ui' // Duplicado
```

### ❌ Paths Inconsistentes
```typescript
// ❌ Ruim - misturar paths absolutos e relativos
import { Button } from '@/components/ui/button'
import { PatientCard } from '../patients/PatientCard' // Deveria ser @/components/patients/PatientCard
```

## 🛠️ Ferramentas de Automação

### ESLint Rules
```json
{
  "rules": {
    "sort-imports": ["error", {
      "ignoreCase": true,
      "ignoreDeclarationSort": true,
      "ignoreMemberSort": false
    }],
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "newlines-between": "always",
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true
      }
    }]
  }
}
```

### VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### Prettier Plugin
```json
{
  "plugins": ["@trivago/prettier-plugin-sort-imports"],
  "importOrder": [
    "^react",
    "<THIRD_PARTY_MODULES>",
    "^@/components/ui",
    "^@/components",
    "^@/hooks",
    "^@/lib",
    "^@/types",
    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

## 📚 Exemplos Completos

### Componente Complexo
```typescript
// PatientRegistrationForm.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode, ChangeEvent } from 'react'

import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ValidatedInput } from '@/components/forms/ValidatedInput'
import { ErrorDisplay } from '@/components/errors/ErrorDisplay'

import { useFormValidation } from '@/hooks/useValidation'
import { useErrorHandler } from '@/hooks/useErrorHandler'

import { cn } from '@/lib/utils'
import { validateCPF, sanitizeString } from '@/lib/validation/utils'
import { createPatient } from '@/lib/api/patients'

import type { Patient } from '@/types/patient'
import type { ValidationResult } from '@/types/validation'

import { VALIDATION_MESSAGES } from '@/lib/constants/messages'
import { FORM_DEFAULTS } from '@/lib/constants/forms'
```

### Hook Customizado
```typescript
// usePatients.ts
import { useState, useCallback, useEffect } from 'react'

import { toast } from 'sonner'

import { listPatients, createPatient, updatePatient } from '@/lib/api/patients'
import { handleError } from '@/lib/errors'

import type { Patient } from '@/types/patient'
import type { ApiResponse } from '@/types/api'

import { API_ENDPOINTS } from '@/lib/constants/api'
```

## 🔄 Migração Gradual

Para projetos existentes, migre gradualmente:

1. **Configure ferramentas** (ESLint, Prettier)
2. **Organize por arquivo** conforme você edita
3. **Use script de migração** para mudanças em massa
4. **Revise em PRs** para manter consistência

### Script de Organização
```bash
# Organizar imports automaticamente
npx eslint --fix src/**/*.{ts,tsx}

# Verificar organização
npx eslint src/**/*.{ts,tsx} --rule 'import/order: error'
```
