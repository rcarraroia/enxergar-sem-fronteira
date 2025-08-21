/**
 * COMPONENTE DE DEBUG ULTRA SIMPLES
 * Sem hooks, sem dependências, só HTML puro
 */

const DebugCampaigns = () => {
  console.log('🔥 COMPONENTE DEBUG CARREGADO!', {
    url: window.location.href,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString()
  })

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ff0000',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🚨 DEBUG CAMPAIGNS - FUNCIONANDO!
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
        <p>✅ Se você está vendo esta tela VERMELHA, o roteamento está funcionando!</p>
        <p>❌ Se você está vendo o Dashboard, há um problema de redirecionamento.</p>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#990000',
        borderRadius: '8px'
      }}>
        <h2>Informações de Debug:</h2>
        <ul>
          <li>Componente: DebugCampaigns</li>
          <li>Arquivo: src/pages/admin-v2/Campaigns/debug.tsx</li>
          <li>Rota esperada: /admin-v2/campaigns</li>
          <li>React Router: Funcionando</li>
        </ul>
      </div>
    </div>
  )
}

export default DebugCampaigns