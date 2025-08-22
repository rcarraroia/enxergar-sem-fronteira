/**
 * TESTE SIMPLES PARA PÁGINA DE MENSAGENS
 */

import { AdminLayout } from '@/components/admin-v2/shared/Layout'

export default function TestMessagesPage() {
  return (
    <AdminLayout 
      title="Mensagens (Teste)" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Mensagens', path: '/admin/messages' }
      ]}
    >
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Página de Mensagens - Teste</h1>
        <p>Esta é uma página de teste para verificar se o roteamento está funcionando.</p>
      </div>
    </AdminLayout>
  )
}