# Sistema de Exportação Excel

Sistema completo para exportação de dados para Excel seguindo o formato do gabarito WaSeller.

## 📋 Visão Geral

O sistema de exportação Excel foi desenvolvido para:
- Seguir exatamente o formato do gabarito WaSeller
- Aplicar formatação profissional (cores, bordas, estilos)
- Tratar e formatar dados automaticamente
- Oferecer opções de exportação completa ou básica
- Gerar nomes de arquivo descritivos automaticamente

## 🚀 Como Usar

### 1. Componente ExcelExportButton

```tsx
import { ExcelExportButton } from '@/components/admin/ExcelExportButton';

<ExcelExportButton
  data={registrations}
  selectedCity="São Paulo"
  selectedDate="2025-01-15"
  isLoading={false}
/>
```

### 2. Hook useExcelExport

```tsx
import { useExcelExport } from '@/hooks/useExcelExport';

const { isExporting, exportRegistrations } = useExcelExport({
  onSuccess: (filename, stats) => {
    console.log(`Exportado: ${filename}`, stats);
  }
});

// Exportar dados
await exportRegistrations(data, {
  includeAllFields: true,
  selectedCity: 'São Paulo',
  selectedDate: '2025-01-15'
});
```

### 3. Função Direta

```tsx
import { exportToExcel, convertRegistrationsToExportData } from '@/utils/excelExporter';

const exportData = convertRegistrationsToExportData(registrations);
await exportToExcel(exportData, {
  filename: 'meu_relatorio.xlsx',
  sheetName: 'Dados'
});
```

## 📊 Formato dos Dados

### Campos Exportados

| Campo | Descrição | Formatação |
|-------|-----------|------------|
| Nome Completo | Nome do paciente | Texto |
| Telefone | Telefone formatado | (XX) XXXXX-XXXX |
| E-mail | Email do paciente | Texto |
| Cidade | Cidade do evento | Texto |
| Data do Evento | Data formatada | DD/MM/AAAA |
| Horário | Horário do evento | HH:MM |
| Status | Status da inscrição | Confirmado/Pendente/etc |
| Data de Agendamento | Data de criação | DD/MM/AAAA |
| CPF | CPF do paciente | Opcional |
| Endereço | Endereço do paciente | Opcional |
| Observações | Observações extras | Opcional |

### Formatação Automática

- **Telefones**: Formatados para padrão brasileiro
- **Datas**: Convertidas para DD/MM/AAAA
- **Horários**: Padronizados para HH:MM
- **Status**: Traduzidos para português

## 🎨 Estilos Aplicados

### Cabeçalhos
- Fundo azul (#366092)
- Texto branco
- Negrito
- Centralizado
- Bordas pretas

### Dados
- Linhas alternadas (cinza claro)
- Bordas cinza claras
- Alinhamento à esquerda
- Larguras de coluna otimizadas

### Colunas
- Nome: 25 caracteres
- Telefone: 15 caracteres
- Email: 30 caracteres
- Cidade: 15 caracteres
- Data: 12 caracteres
- Horário: 10 caracteres
- Status: 12 caracteres
- Agendamento: 15 caracteres
- CPF: 15 caracteres
- Endereço: 30 caracteres
- Observações: 20 caracteres

## 🔒 Opções de Privacidade

### Exportação Completa
- Inclui todos os campos
- CPF e endereço visíveis
- Para uso interno administrativo

### Exportação Básica
- Remove CPF e endereço
- Mantém dados essenciais
- Para compartilhamento externo

## 📁 Nomenclatura de Arquivos

Formato automático: `agendamentos_{cidade}_{data}_{timestamp}.xlsx`

Exemplos:
- `agendamentos_sao_paulo_2025_01_15_143022.xlsx`
- `agendamentos_todas_cidades_2025_01_15_143022.xlsx`

## 🛠️ Configuração

### Dependências Necessárias

```bash
npm install xlsx file-saver
npm install @types/file-saver --save-dev
```

### Importações

```tsx
// Componente pronto
import { ExcelExportButton } from '@/components/admin/ExcelExportButton';

// Hook personalizado
import { useExcelExport } from '@/hooks/useExcelExport';

// Funções utilitárias
import {
  exportToExcel,
  convertRegistrationsToExportData,
  generateDataStats
} from '@/utils/excelExporter';
```

## 📈 Estatísticas Geradas

O sistema gera automaticamente estatísticas dos dados:

```typescript
{
  total: 150,
  confirmados: 120,
  pendentes: 25,
  compareceram: 100,
  cancelados: 5,
  cidades: 3,
  periodoInicio: '2025-01-01',
  periodoFim: '2025-01-31'
}
```

## 🔧 Personalização

### Modificar Estilos

Edite a função `applyWorksheetStyles` em `src/utils/excelExporter.ts`:

```typescript
// Alterar cor do cabeçalho
worksheet[cellAddress].s = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "SUA_COR_AQUI" } },
  // ...
};
```

### Adicionar Campos

1. Atualize a interface `ExportData`
2. Modifique `convertRegistrationsToExportData`
3. Ajuste os cabeçalhos em `processExportData`

### Alterar Formatação

Modifique as funções de formatação:
- `formatPhone()` - Telefones
- `formatDate()` - Datas
- `formatTime()` - Horários
- `formatStatus()` - Status

## 🐛 Troubleshooting

### Erro: "Cannot read property 'length'"
- Verifique se os dados não estão vazios
- Confirme que `data` é um array válido

### Arquivo não baixa
- Verifique se o navegador permite downloads
- Confirme que não há bloqueadores de popup

### Formatação incorreta
- Verifique os dados de origem
- Confirme que as funções de formatação estão funcionando

### Erro de memória
- Para datasets muito grandes (>10k registros)
- Considere implementar paginação ou chunks

## 📝 Exemplos de Uso

### Página de Relatórios
```tsx
// Já implementado em src/pages/ReportsTemp.tsx
<ExcelExportButton
  data={registrations}
  selectedCity={selectedCity}
  selectedDate={selectedDate}
  isLoading={isLoading}
/>
```

### Dashboard Admin
```tsx
const { exportRegistrations } = useExcelExport();

const handleQuickExport = async () => {
  await exportRegistrations(todayRegistrations, {
    includeAllFields: false,
    filename: 'agendamentos_hoje.xlsx'
  });
};
```

### Página de Eventos
```tsx
const exportEventData = async (eventId: string) => {
  const eventRegistrations = registrations.filter(r => r.event_id === eventId);
  await exportRegistrations(eventRegistrations, {
    includeAllFields: true,
    filename: `evento_${eventId}_registrations.xlsx`
  });
};
```

## 🔄 Atualizações Futuras

### Planejadas
- [ ] Suporte a múltiplas planilhas
- [ ] Gráficos automáticos
- [ ] Templates personalizáveis
- [ ] Exportação em lotes
- [ ] Agendamento de exportações

### Melhorias Possíveis
- [ ] Compressão de arquivos grandes
- [ ] Preview antes da exportação
- [ ] Histórico de exportações
- [ ] Integração com Google Sheets
- [ ] Assinatura digital dos arquivos

---

**Desenvolvido para:** Sistema Enxergar sem Fronteiras
**Formato Base:** Gabarito WaSeller
**Última Atualização:** Janeiro 2025
