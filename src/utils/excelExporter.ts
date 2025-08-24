/**
 * Excel Exporter - Sistema de exportação de dados para Excel
 * Segue o formato do grito WaSeller
 */

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Tipos para os dados de exportação
export interface ExportData {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  dataEvento: string;
  horario: string;
  status: string;
  agendadoEm: string;
  cpf?: string;
  endereco?: string;
  observacoes?: string;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  formatData?: boolean;
}

/**
 * Formata telefone para o padrão brasileiro
 */
const formatPhone = (phone: string): string => {
  if (!phone) return '';

  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');

  // Formata conforme o tamanho
  if (numbers.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return phone; // Retorna original se não conseguir formatar
};

/**
 * Formata data para o padrão brasileiro
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

/**
 * Formata horário para o padrão HH:MM
 */
const formatTime = (timeString: string): string => {
  if (!timeString) return '';

  // Se já está no formato HH:MM, retorna
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }

  // Se está no formato HH:MM:SS, remove os segundos
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeString.slice(0, 5);
  }

  return timeString;
};

/**
 * Normaliza status para português
 */
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'confirmed': 'Confirmado',
    'pending': 'Pendente',
    'attended': 'Compareceu',
    'cancelled': 'Cancelado',
    'no_show': 'Não Compareceu'
  };

  return statusMap[status] || status;
};

/**
 * Processa e formata os dados para exportação
 */
const processExportData = (data: ExportData[], formatData: boolean = true): any[][] => {
  const headers = [
    'Nome Completo',
    'Telefone',
    'E-mail',
    'Cidade',
    'Data do Evento',
    'Horário',
    'Status',
    'Data de Agendamento',
    'CPF',
    'Endereço',
    'Observações'
  ];

  const processedData = data.map(item => [
    item.nome || '',
    formatData ? formatPhone(item.telefone) : item.telefone,
    item.email || '',
    item.cidade || '',
    formatData ? formatDate(item.dataEvento) : item.dataEvento,
    formatData ? formatTime(item.horario) : item.horario,
    formatData ? formatStatus(item.status) : item.status,
    formatData ? formatDate(item.agendadoEm) : item.agendadoEm,
    item.cpf || '',
    item.endereco || '',
    item.observacoes || ''
  ]);

  return [headers, ...processedData];
};

/**
 * Aplica estilos ao worksheet seguindo o padrão do gabarito
 */
const applyWorksheetStyles = (worksheet: XLSX.WorkSheet, data: any[][]) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Configurar larguras das colunas
  const columnWidths = [
    { wch: 25 }, // Nome Completo
    { wch: 15 }, // Telefone
    { wch: 30 }, // E-mail
    { wch: 15 }, // Cidade
    { wch: 12 }, // Data do Evento
    { wch: 10 }, // Horário
    { wch: 12 }, // Status
    { wch: 15 }, // Data de Agendamento
    { wch: 15 }, // CPF
    { wch: 30 }, // Endereço
    { wch: 20 }  // Observações
  ];

  worksheet['!cols'] = columnWidths;

  // Aplicar estilos aos cabeçalhos
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Aplicar bordas e alinhamento aos dados
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };

      // Aplicar cores alternadas nas linhas
      if (row % 2 === 0) {
        worksheet[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" } };
      }
    }
  }

  return worksheet;
};

/**
 * Exporta dados para Excel seguindo o formato do gabarito
 */
export const exportToExcel = async (
  data: ExportData[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const {
      filename = `relatorio_agendamentos_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName = 'Agendamentos',
      includeHeaders = true,
      formatData = true
    } = options;

    // Processar dados
    const processedData = processExportData(data, formatData);

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(processedData);

    // Aplicar estilos
    applyWorksheetStyles(worksheet, processedData);

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar buffer do arquivo
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true
    });

    // Criar blob e fazer download
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, filename);

    console.log(`✅ Arquivo Excel exportado: ${filename}`);

  } catch (error) {
    console.error('❌ Erro ao exportar Excel:', error);
    throw new Error('Falha na exportação do arquivo Excel');
  }
};

/**
 * Converte dados de registração para formato de exportação
 */
export const convertRegistrationsToExportData = (registrations: any[]): ExportData[] => {
  return registrations.map(reg => ({
    nome: reg.patient?.nome || '',
    telefone: reg.patient?.telefone || '',
    email: reg.patient?.email || '',
    cidade: reg.event_date?.event?.city || '',
    dataEvento: reg.event_date?.date || '',
    horario: reg.event_date?.start_time || '',
    status: reg.status || '',
    agendadoEm: reg.created_at || '',
    cpf: reg.patient?.cpf || '',
    endereco: reg.patient?.endereco || '',
    observacoes: reg.observacoes || ''
  }));
};

/**
 * Gera estatísticas dos dados para incluir no relatório
 */
export const generateDataStats = (data: ExportData[]) => {
  const stats = {
    total: data.length,
    confirmados: data.filter(d => d.status === 'confirmed' || d.status === 'Confirmado').length,
    pendentes: data.filter(d => d.status === 'pending' || d.status === 'Pendente').length,
    compareceram: data.filter(d => d.status === 'attended' || d.status === 'Compareceu').length,
    cancelados: data.filter(d => d.status === 'cancelled' || d.status === 'Cancelado').length,
    cidades: [...new Set(data.map(d => d.cidade).filter(Boolean))].length,
    periodoInicio: data.length > 0 ? Math.min(...data.map(d => new Date(d.dataEvento).getTime())) : null,
    periodoFim: data.length > 0 ? Math.max(...data.map(d => new Date(d.dataEvento).getTime())) : null
  };

  return {
    ...stats,
    periodoInicioFormatted: stats.periodoInicio ? new Date(stats.periodoInicio).toLocaleDateString('pt-BR') : '',
    periodoFimFormatted: stats.periodoFim ? new Date(stats.periodoFim).toLocaleDateString('pt-BR') : ''
  };
};

export default {
  exportToExcel,
  convertRegistrationsToExportData,
  generateDataStats
};
