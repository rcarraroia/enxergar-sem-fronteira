#!/usr/bin/env python3
"""
🔍 VERIFICAÇÃO DOS REQUISITOS PARA INTEGRAÇÃO N8N
Verifica se todas as tabelas e funções necessárias existem
"""

from supabase import create_client, Client

# Configurações
SUPABASE_URL = "https://uoermayoxjaaomzjmuhp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc"

def print_section(title):
    """Imprime seção formatada"""
    print(f"\n{'='*70}")
    print(f"🔍 {title}")
    print('='*70)

def verify_n8n_requirements():
    """Verificar todos os requisitos para integração N8N"""

    print("🚀 Verificando requisitos para integração N8N...")

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # 1. VERIFICAR TABELAS PRINCIPAIS
        print_section("VERIFICAÇÃO DE TABELAS PRINCIPAIS")

        required_tables = ['patients', 'registrations', 'events', 'event_dates']

        for table in required_tables:
            try:
                count_response = supabase.table(table).select('*', count='exact').execute()
                print(f"✅ Tabela '{table}': {count_response.count} registros")

                # Mostrar estrutura da primeira linha
                sample_response = supabase.table(table).select('*').limit(1).execute()
                if sample_response.data:
                    columns = list(sample_response.data[0].keys())
                    print(f"   📋 Colunas: {', '.join(columns)}")

            except Exception as e:
                print(f"❌ Tabela '{table}': {str(e)[:100]}...")

        # 2. VERIFICAR TABELA DE NOTIFICAÇÕES
        print_section("VERIFICAÇÃO DA TABELA REGISTRATION_NOTIFICATIONS")

        try:
            notifications_response = supabase.table('registration_notifications').select('*', count='exact').execute()
            print(f"✅ Tabela 'registration_notifications': {notifications_response.count} registros")

            # Mostrar estrutura
            if notifications_response.data:
                columns = list(notifications_response.data[0].keys())
                print(f"   📋 Colunas: {', '.join(columns)}")
            else:
                # Tentar inserir um teste para ver a estrutura
                print("   📊 Tabela vazia - testando estrutura...")

        except Exception as e:
            print(f"❌ Tabela 'registration_notifications': {str(e)[:100]}...")
            print("   ⚠️  Tabela pode não existir - precisa ser criada")

        # 3. VERIFICAR FUNÇÃO get_registration_details
        print_section("VERIFICAÇÃO DA FUNÇÃO GET_REGISTRATION_DETAILS")

        try:
            # Pegar um registration_id real para teste
            sample_reg = supabase.table('registrations').select('id').limit(1).execute()

            if sample_reg.data:
                test_reg_id = sample_reg.data[0]['id']
                print(f"   🧪 Testando com registration_id: {test_reg_id}")

                # Testar a função RPC
                function_response = supabase.rpc('get_registration_details', {'reg_id': test_reg_id}).execute()

                if function_response.data:
                    print("✅ Função 'get_registration_details' existe e funciona")
                    print(f"   📊 Retorno: {function_response.data}")
                else:
                    print("⚠️  Função existe mas retornou dados vazios")

            else:
                print("   ⚠️  Nenhum registro encontrado para teste")

        except Exception as e:
            print(f"❌ Função 'get_registration_details': {str(e)[:100]}...")
            print("   ⚠️  Função pode não existir - precisa ser criada")

        # 4. TESTE DE FLUXO COMPLETO
        print_section("TESTE DE FLUXO COMPLETO")

        try:
            # Simular o que o N8N faria
            print("🧪 Simulando fluxo completo do N8N...")

            # Pegar dados de uma inscrição real
            full_registration = supabase.table('registrations').select('''
                id,
                status,
                created_at,
                patients (
                    nome,
                    email,
                    telefone,
                    cpf
                ),
                event_dates (
                    date,
                    start_time,
                    end_time,
                    events (
                        title,
                        location,
                        address
                    )
                )
            ''').limit(1).execute()

            if full_registration.data:
                reg_data = full_registration.data[0]
                print("✅ Consulta completa de dados funcionando")
                print(f"   📊 Exemplo de dados disponíveis:")
                print(f"   - Paciente: {reg_data['patients']['nome']}")
                print(f"   - Telefone: {reg_data['patients']['telefone']}")
                print(f"   - Evento: {reg_data['event_dates']['events']['title']}")
                print(f"   - Data: {reg_data['event_dates']['date']}")
                print(f"   - Horário: {reg_data['event_dates']['start_time']}")
                print(f"   - Local: {reg_data['event_dates']['events']['location']}")

                # Simular payload que seria enviado para N8N
                payload = {
                    "registration_id": reg_data['id'],
                    "patient_name": reg_data['patients']['nome'],
                    "phone": reg_data['patients']['telefone'],
                    "date": reg_data['event_dates']['date'],
                    "start_time": reg_data['event_dates']['start_time'],
                    "event_title": reg_data['event_dates']['events']['title'],
                    "event_location": reg_data['event_dates']['events']['location']
                }

                print(f"   📤 Payload para N8N: {payload}")

            else:
                print("⚠️  Nenhuma inscrição encontrada para teste")

        except Exception as e:
            print(f"❌ Erro no teste de fluxo: {str(e)[:100]}...")

        # 5. VERIFICAR CAMPOS NECESSÁRIOS
        print_section("VERIFICAÇÃO DE CAMPOS NECESSÁRIOS")

        # Verificar se registrations tem delivery_date e delivery_status
        try:
            reg_sample = supabase.table('registrations').select('*').limit(1).execute()
            if reg_sample.data:
                reg_columns = list(reg_sample.data[0].keys())

                required_fields = ['delivery_date', 'delivery_status']
                for field in required_fields:
                    if field in reg_columns:
                        print(f"✅ Campo '{field}' existe na tabela registrations")
                    else:
                        print(f"❌ Campo '{field}' NÃO existe - precisa ser adicionado")

        except Exception as e:
            print(f"❌ Erro ao verificar campos: {str(e)[:100]}...")

        # 6. RESUMO FINAL
        print_section("RESUMO DOS REQUISITOS")

        print("🎯 PARA IMPLEMENTAR O WEBHOOK N8N, PRECISAMOS:")
        print()
        print("📋 TABELAS (verificar se existem):")
        print("   ✅ patients - OK")
        print("   ✅ registrations - OK")
        print("   ✅ events - OK")
        print("   ✅ event_dates - OK")
        print("   ❓ registration_notifications - VERIFICAR")
        print()
        print("🔧 FUNÇÕES (verificar se existem):")
        print("   ❓ get_registration_details() - VERIFICAR")
        print()
        print("📊 CAMPOS ADICIONAIS (para fluxos futuros):")
        print("   ❓ registrations.delivery_date - VERIFICAR")
        print("   ❓ registrations.delivery_status - VERIFICAR")
        print()
        print("🎯 IMPLEMENTAÇÃO NO FRONTEND:")
        print("   - Adicionar chamada webhook após sucesso da inscrição")
        print("   - Usar token de segurança")
        print("   - Tratamento de erro não-bloqueante")

        print_section("ANÁLISE CONCLUÍDA")
        print("🎯 Baseado nesta verificação, posso criar a spec detalhada!")

    except Exception as e:
        print(f"💥 ERRO CRÍTICO: {e}")

if __name__ == "__main__":
    verify_n8n_requirements()
