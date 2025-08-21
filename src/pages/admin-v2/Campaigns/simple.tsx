/**
 * TESTE SIMPLES - CAMPANHAS
 */

import React from 'react'

const AdminCampaignsV2Simple = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎯 MÓDULO DE CAMPANHAS</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Gestão de Campanhas de Doação</h2>
          <p className="text-gray-600 mb-4">
            Este é o módulo de campanhas funcionando! 🎉
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Total de Campanhas</h3>
              <p className="text-2xl font-bold text-blue-600">1</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Campanhas Ativas</h3>
              <p className="text-2xl font-bold text-green-600">1</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Total Arrecadado</h3>
              <p className="text-2xl font-bold text-purple-600">R$ 0,00</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900">Doadores</h3>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Campanha de Teste</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium">Campanha de Natal 2024</h4>
              <p className="text-sm text-gray-600">Meta: R$ 50.000,00</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">0% da meta atingida</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCampaignsV2Simple