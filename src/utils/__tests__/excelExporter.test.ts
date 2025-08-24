/**
 * Testes para o sistema de exportação Excel
 */

import { describe, expect, it } from 'vitest';
import {
    convertRegistrationsToExportData,
    generateDataStats
} from '../excelExporter';

describe('Excel Exporter', () => {
  const mockRegistrations = [
    {
      id: '1',
      patient: {
        nome: 'João Silva',
        telefone: '11999887766',
        email: 'joao@email.com',
        cpf: '12345678901'
      },
      event_date: {
        date: '2025-01-15',
        start_time: '09:00:00',
        event: {
          city: 'São Paulo'
        }
      },
      status: 'confirmed',
      created_at: '2025-01-10T10:00:00Z'
    },
    {
      id: '2',
      patient: {
        nome: 'Maria Santos',
        telefone: '11888776655',
        email: 'maria@email.com',
        cpf: '98765432109'
      },
      event_date: {
        date: '2025-01-16',
        start_time: '14:30:00',
        event: {
          city: 'Rio de Janeiro'
        }
      },
      status: 'pending',
      created_at: '2025-01-11T15:30:00Z'
    }
  ];

  describe('convertRegistrationsToExportData', () => {
    it('deve converter registrações para formato de exportação', () => {
      const result = convertRegistrationsToExportData(mockRegistrations);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        nome: 'João Silva',
        telefone: '11999887766',
        email: 'joao@email.com',
        cidade: 'São Paulo',
        dataEvento: '2025-01-15',
        horario: '09:00:00',
        status: 'confirmed',
        agendadoEm: '2025-01-10T10:00:00Z',
        cpf: '12345678901',
        endereco: '',
        observacoes: ''
      });
    });

    it('deve lidar com dados faltantes', () => {
      const incompleteData = [{
        id: '1',
        patient: { nome: 'Teste' },
        event_date: { event: {} },
        status: 'confirmed'
      }];

      const result = convertRegistrationsToExportData(incompleteData);

      expect(result[0]).toEqual({
        nome: 'Teste',
        telefone: '',
        email: '',
        cidade: '',
        dataEvento: '',
        horario: '',
        status: 'confirmed',
        agendadoEm: '',
        cpf: '',
        endereco: '',
        observacoes: ''
      });
    });
  });

  describe('generateDataStats', () => {
    it('deve gerar estatísticas corretas', () => {
      const exportData = convertRegistrationsToExportData(mockRegistrations);
      const stats = generateDataStats(exportData);

      expect(stats.total).toBe(2);
      expect(stats.confirmados).toBe(1);
      expect(stats.pendentes).toBe(1);
      expect(stats.cidades).toBe(2);
    });

    it('deve lidar com array vazio', () => {
      const stats = generateDataStats([]);

      expect(stats.total).toBe(0);
      expect(stats.confirmados).toBe(0);
      expect(stats.pendentes).toBe(0);
      expect(stats.cidades).toBe(0);
    });
  });
});
