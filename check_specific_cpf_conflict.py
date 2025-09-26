#!/usr/bin/env python3
"""
🔍 VERIFICAR CPF ESPECÍFICO QUE ESTÁ CAUSANDO CONFLITO
"""

from supabase import create_client, Client

# Configurações
SUPABASE_URL = "https://uoermayoxjaaomzjmuhp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc"

def check_cpf_conflict():
    """Verificar CPF que está causando conflito"""

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # CPF que está causando erro (sem formatação)
    conflicting_cpf = "71596100672"

    print(f"🔍 Verificando CPF: {conflicting_cpf}")
    print("="*50)

    try:
        # Buscar registro existente
        response = supabase.table('patients').select('*').eq('cpf', conflicting_cpf).execute()

        if response.data:
            print(f"⚠️  CPF {conflicting_cpf} JÁ EXISTE no banco!")
            print("\n📋 Dados do registro existente:")

            for record in response.data:
                print(f"   - ID: {record['id']}")
                print(f"   - Nome: {record['nome']}")
                print(f"   - Email: {record['email']}")
                print(f"   - CPF: {record['cpf']}")
                print(f"   - Telefone: {record.get('telefone', 'N/A')}")
                print(f"   - Criado em: {record['created_at']}")
                print(f"   - Atualizado em: {record['updated_at']}")

                if record.get('diagnostico'):
                    print(f"   - Diagnóstico: {record['diagnostico']}")

                print("-" * 40)
        else:
            print(f"✅ CPF {conflicting_cpf} NÃO existe no banco")

    except Exception as e:
        print(f"❌ Erro ao verificar CPF: {e}")

    # Verificar também com formatação
    formatted_cpf = "715.961.006-72"
    print(f"\n🔍 Verificando CPF formatado: {formatted_cpf}")

    try:
        response2 = supabase.table('patients').select('*').eq('cpf', formatted_cpf).execute()

        if response2.data:
            print(f"⚠️  CPF formatado {formatted_cpf} também existe!")
        else:
            print(f"✅ CPF formatado {formatted_cpf} não existe")

    except Exception as e:
        print(f"❌ Erro ao verificar CPF formatado: {e}")

if __name__ == "__main__":
    check_cpf_conflict()
