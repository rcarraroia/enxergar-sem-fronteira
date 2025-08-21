/**
 * COMPONENTE ULTRA SIMPLES PARA TESTE
 * Sem hooks, sem dependências, só React puro
 */

import React from 'react'

const AdminCampaignsV2 = () => {
  console.log('🔥 CAMPANHAS V2 CARREGADO!', {
    url: window.location.href,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString()
  })

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#00ff00',
      color: '#000000',
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        ✅ CAMPANHAS V2 - FUNCIONANDO!
      </h1>
      
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        <strong>URL:</strong> {window.location.href}
      </div>
      
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        <strong>Pathname:</strong> {window.location.pathname}
      </div>
      
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        <strong>Timestamp:</strong> {new Date().toLocaleString()}
      </div>

      <div style={{ fontSize: '18px', marginTop: '40px' }}>
        <p>✅ TELA VERDE = Roteamento funcionando perfeitamente!</p>
        <p>❌ Dashboard = Ainda há problema de redirecionamento</p>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#00cc00',
        borderRadius: '8px'
      }}>
        <h2>Status do Sistema:</h2>
        <ul>
          <li>✅ React Router: OK</li>
          <li>✅ Componente: Carregado</li>
          <li>✅ Rota: /admin-v2/campaigns</li>
          <li>✅ Import: Correto</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminCampaignsV2