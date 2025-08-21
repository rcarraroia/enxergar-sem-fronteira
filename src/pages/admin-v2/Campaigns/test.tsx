/**
 * COMPONENTE DE TESTE PARA CAMPANHAS
 * Para verificar se o roteamento está funcionando
 */

import React from 'react'

const TestCampaigns = () => {
  return (
    <div className="min-h-screen bg-red-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-red-800 mb-4">
          🚨 TESTE DE CAMPANHAS - FUNCIONANDO!
        </h1>
        <p className="text-lg text-red-700 mb-4">
          Se você está vendo esta página, significa que:
        </p>
        <ul className="list-disc list-inside text-red-700 space-y-2">
          <li>✅ A rota /admin-v2/campaigns está funcionando</li>
          <li>✅ O React Router está carregando o componente correto</li>
          <li>✅ O problema não é de roteamento básico</li>
        </ul>
        <div className="mt-8 p-4 bg-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">
            URL atual: {window.location.pathname}
          </p>
          <p className="text-red-800">
            Timestamp: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestCampaigns