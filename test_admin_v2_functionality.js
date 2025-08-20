/**
 * TESTE DE FUNCIONALIDADE - ADMIN V2 DASHBOARD
 * Script para identificar problemas de conectividade e funcionalidade
 */

console.log('🔍 INICIANDO TESTE DE FUNCIONALIDADE ADMIN V2...')

// Função para testar conectividade com Supabase
const testSupabaseConnection = async () => {
  console.log('📡 Testando conexão com Supabase...')
  
  try {
    const SUPABASE_URL = 'https://uoermayoxjaaomzjmuhp.supabase.co'
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc'
    
    // Teste básico de conectividade
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Conexão com Supabase: OK')
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

// Função para testar queries específicas
const testDatabaseQueries = async () => {
  console.log('🔍 Testando queries do banco de dados...')
  
  const SUPABASE_URL = 'https://uoermayoxjaaomzjmuhp.supabase.co'
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc'
  
  const queries = [
    { name: 'patients', endpoint: '/rest/v1/patients?select=count' },
    { name: 'events', endpoint: '/rest/v1/events?select=count' },
    { name: 'registrations', endpoint: '/rest/v1/registrations?select=count' },
    { name: 'event_dates', endpoint: '/rest/v1/event_dates?select=count' }
  ]
  
  const results = {}
  
  for (const query of queries) {
    try {
      console.log(`🔍 Testando query: ${query.name}`)
      
      const response = await fetch(`${SUPABASE_URL}${query.endpoint}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'count=exact'
        }
      })
      
      if (response.ok) {
        const count = response.headers.get('content-range')
        console.log(`✅ Query ${query.name}: OK (${count})`)
        results[query.name] = 'OK'
      } else {
        console.error(`❌ Query ${query.name}: ERRO ${response.status}`)
        results[query.name] = `ERRO ${response.status}`
      }
    } catch (error) {
      console.error(`❌ Query ${query.name}: EXCEÇÃO`, error)
      results[query.name] = 'EXCEÇÃO'
    }
  }
  
  return results
}

// Função para simular teste de autenticação
const testAuthentication = () => {
  console.log('🔐 Testando autenticação...')
  
  // Verificar se há token no localStorage
  const hasAuth = localStorage.getItem('sb-uoermayoxjaaomzjmuhp-auth-token')
  
  if (hasAuth) {
    console.log('✅ Token de autenticação encontrado')
    return true
  } else {
    console.log('⚠️ Nenhum token de autenticação encontrado')
    return false
  }
}

// Função principal de teste
const runFullTest = async () => {
  console.log('🚀 EXECUTANDO TESTE COMPLETO...')
  console.log('=' .repeat(50))
  
  // Teste 1: Conectividade
  const connectionOk = await testSupabaseConnection()
  
  // Teste 2: Autenticação
  const authOk = testAuthentication()
  
  // Teste 3: Queries do banco
  let queryResults = {}
  if (connectionOk) {
    queryResults = await testDatabaseQueries()
  }
  
  // Resumo dos resultados
  console.log('=' .repeat(50))
  console.log('📊 RESUMO DOS TESTES:')
  console.log(`Conectividade: ${connectionOk ? '✅ OK' : '❌ FALHA'}`)
  console.log(`Autenticação: ${authOk ? '✅ OK' : '⚠️ SEM TOKEN'}`)
  console.log('Queries:', queryResults)
  
  // Diagnóstico
  if (!connectionOk) {
    console.log('🔧 DIAGNÓSTICO: Problema de conectividade com Supabase')
  } else if (!authOk) {
    console.log('🔧 DIAGNÓSTICO: Problema de autenticação - usuário não logado')
  } else {
    console.log('🔧 DIAGNÓSTICO: Conectividade OK - problema pode estar no código React')
  }
  
  console.log('✅ TESTE CONCLUÍDO!')
}

// Executar teste se estiver no browser
if (typeof window !== 'undefined') {
  runFullTest()
} else {
  console.log('Script carregado - execute runFullTest() no console do browser')
}

// Exportar função para uso manual
window.testAdminV2 = runFullTest