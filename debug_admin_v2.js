/**
 * SCRIPT DE DEBUG - ADMIN V2 DASHBOARD
 * Teste de conectividade e funcionalidade
 */

console.log('🔍 INICIANDO DEBUG DO ADMIN V2...')

// Simular teste de conectividade
const testSupabaseConnection = async () => {
  try {
    console.log('📡 Testando conexão com Supabase...')
    
    // Verificar se o Supabase está acessível
    const response = await fetch('https://uoermayoxjaaomzjmuhp.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc'
      }
    })
    
    if (response.ok) {
      console.log('✅ Conexão com Supabase OK')
      return true
    } else {
      console.error('❌ Erro na conexão:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ Erro crítico na conexão:', error)
    return false
  }
}

// Simular teste das queries
const testQueries = async () => {
  console.log('🔍 Testando queries do dashboard...')
  
  const queries = [
    { name: 'patients', table: 'patients' },
    { name: 'events', table: 'events' },
    { name: 'registrations', table: 'registrations' },
    { name: 'event_dates', table: 'event_dates' }
  ]
  
  for (const query of queries) {
    try {
      const response = await fetch(`https://uoermayoxjaaomzjmuhp.supabase.co/rest/v1/${query.table}?select=count`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc',
          'Prefer': 'count=exact'
        }
      })
      
      if (response.ok) {
        console.log(`✅ Query ${query.name} OK`)
      } else {
        console.error(`❌ Query ${query.name} falhou:`, response.status)
      }
    } catch (error) {
      console.error(`❌ Erro na query ${query.name}:`, error)
    }
  }
}

// Executar testes
const runDebug = async () => {
  console.log('🚀 Executando debug completo...')
  
  const connectionOk = await testSupabaseConnection()
  if (connectionOk) {
    await testQueries()
  }
  
  console.log('✅ Debug concluído!')
}

// Executar se estiver no browser
if (typeof window !== 'undefined') {
  runDebug()
}