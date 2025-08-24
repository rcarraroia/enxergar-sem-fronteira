# Convenções de Documentação JSDoc

Este documento estabelece as convenções para documentação inline usando JSDoc no projeto "Enxergar sem Fronteira".

## Padrões Gerais

### Estrutura Básica
```typescript
/**
 * Descrição breve da função/componente/interface
 *
 * Descrição mais detalhada se necessário, explicando:
 * - O que a função faz
 * - Quando usar
 * - Comportamentos especiais
 *
 * @param paramName - Descrição do parâmetro
 * @returns Descrição do retorno
 *
 * @example
 * ```typescript
 * // Exemplo de uso
 * const result = myFunction('input');
 * ```
 */
```

### Componentes React
```typescript
/**
 * Componente que [descrição da funcionalidade]
 *
 * @param children - Componentes filhos
 * @param propName - Descrição da prop
 *
 * @example
 * ```tsx
 * <MyComponent propName="value">
 *   <ChildComponent />
 * </MyComponent>
 * ```
 */
```

### Hooks Personalizados
```typescript
/**
 * Hook para [descrição da funcionalidade]
 *
 * Fornece funcionalidades para:
 * - Funcionalidade 1
 * - Funcionalidade 2
 *
 * @returns Objeto com funções e estado
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useMyHook();
 * ```
 */
```

### Interfaces e Tipos
```typescript
/**
 * Interface que define [descrição]
 * @interface InterfaceName
 */
interface InterfaceName {
  /** Descrição da propriedade */
  property: string;
}
```

## Convenções Específicas

### Funções Utilitárias
- Sempre incluir `@param` para cada parâmetro
- Sempre incluir `@returns` para o valor de retorno
- Incluir `@example` com caso de uso real
- Mencionar comportamentos especiais (valores vazios, erros, etc.)

### Componentes de UI
- Documentar todas as props principais
- Incluir exemplo de uso típico
- Mencionar dependências de contexto (useAuth, etc.)

### Hooks
- Listar todas as funcionalidades fornecidas
- Documentar o formato do objeto retornado
- Incluir exemplo prático de uso

### Validações e Schemas
- Explicar quais campos são validados
- Mencionar regras de validação específicas
- Incluir exemplo de dados válidos

## Tags JSDoc Utilizadas

### Tags Obrigatórias
- `@param` - Para todos os parâmetros
- `@returns` - Para valores de retorno
- `@example` - Para demonstrar uso

### Tags Opcionais
- `@interface` - Para interfaces TypeScript
- `@throws` - Para erros que podem ser lançados
- `@deprecated` - Para código obsoleto
- `@since` - Para indicar versão de introdução

### Tags Específicas do Projeto
- `@hook` - Para identificar hooks personalizados
- `@component` - Para componentes React principais

## Exemplos por Categoria

### Hook de Autenticação
```typescript
/**
 * Hook personalizado para acessar o contexto de autenticação
 * Fornece acesso ao usuário logado, seu papel, estado de carregamento e funções de autenticação
 *
 * @returns Objeto com dados e funções de autenticação
 * @throws Error se usado fora do AuthProvider
 *
 * @example
 * ```tsx
 * const { user, userRole, isAdmin, signIn, signOut } = useAuth();
 *
 * if (isAdmin) {
 *   // Renderizar interface de admin
 * }
 * ```
 */
```

### Componente de Proteção
```typescript
/**
 * Componente que protege rotas baseado em autenticação e permissões de usuário
 * Verifica se o usuário está autenticado e possui as permissões necessárias
 *
 * @param children - Componentes filhos a serem renderizados se o acesso for permitido
 * @param requireAdmin - Se true, requer que o usuário seja admin
 * @param allowedRoles - Array de roles permitidos para acessar a rota
 *
 * @example
 * ```tsx
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
```

### Função Utilitária
```typescript
/**
 * Formata um número de telefone brasileiro aplicando máscara
 *
 * @param value - Número de telefone sem formatação
 * @returns Telefone formatado no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 *
 * @example
 * ```typescript
 * formatPhoneNumber("11999887766") // "(11) 99988-7766"
 * formatPhoneNumber("1133334444") // "(11) 3333-4444"
 * ```
 */
```

### Schema de Validação
```typescript
/**
 * Schema de validação Zod para dados de pacientes
 * Valida nome, CPF, email, telefone, data de nascimento e consentimento LGPD
 *
 * @example
 * ```typescript
 * const result = patientValidationSchema.safeParse({
 *   nome: "João Silva",
 *   cpf: "123.456.789-00",
 *   email: "joao@email.com",
 *   telefone: "(11) 99999-9999",
 *   consentimento_lgpd: true
 * });
 * ```
 */
```

## Boas Práticas

### ✅ Fazer
- Usar linguagem clara e objetiva
- Incluir exemplos práticos
- Documentar comportamentos especiais
- Manter documentação atualizada
- Usar português para descrições
- Usar inglês para nomes de parâmetros/propriedades

### ❌ Evitar
- Documentação genérica demais
- Repetir informações óbvias
- Documentação desatualizada
- Exemplos que não funcionam
- Misturar idiomas na mesma descrição

## Ferramentas

### Extensões VSCode Recomendadas
- **Auto Comment Blocks**: Gera blocos JSDoc automaticamente
- **Document This**: Facilita criação de documentação
- **TypeScript Importer**: Ajuda com imports e tipos

### Validação
- ESLint com regras para JSDoc
- TypeScript para validação de tipos
- Prettier para formatação consistente

## Checklist de Revisão

Antes de fazer commit, verificar:

- [ ] Todas as funções exportadas têm documentação JSDoc
- [ ] Todos os parâmetros estão documentados
- [ ] Exemplos de uso estão incluídos
- [ ] Comportamentos especiais estão mencionados
- [ ] Interfaces e tipos complexos estão documentados
- [ ] Documentação está em português claro
- [ ] Exemplos funcionam corretamente

## Manutenção

### Quando Atualizar
- Ao adicionar novos parâmetros
- Ao mudar comportamento de funções
- Ao refatorar interfaces
- Ao corrigir bugs que afetam comportamento documentado

### Revisão Periódica
- Verificar documentação durante code reviews
- Atualizar exemplos quando necessário
- Remover documentação de código obsoleto
- Melhorar clareza baseado em feedback

---

Esta documentação deve ser seguida por todos os desenvolvedores do projeto para manter consistência e qualidade na documentação do código.
