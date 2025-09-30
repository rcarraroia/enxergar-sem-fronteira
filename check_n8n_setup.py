#!/usr/bin/env python3
from supabase import create_client, Client

SUPABASE_URL = "https://uoermayoxjaaomzjmuhp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc"

def check_setup():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("🔍 Verificando setup para N8N...")

    # 1. Verificar tabela registration_notifications
    try:
        result = supabase.table('registration_notifications').select('*').limit(1).execute()
        print("✅ Tabela registration_notifications existe")
        if result.data:
            print(f"   Colunas: {list(result.data[0].keys())}")
    except Exception as e:
        print(f"❌ registration_notifications: {str(e)[:80]}...")

    # 2. Verificar função get_registration_details
    try:
        reg_sample = supabase.table('registrations').select('id').limit(1).execute()
        if reg_sample.data:
            test_id = reg_sample.data[0]['id']
            func_result = supabase.rpc('get_registration_details', {'reg_id': test_id}).execute()
            print("✅ Função get_registration_details existe")
            if func_result.data:
                print(f"   Retorna: {list(func_result.data[0].keys()) if func_result.data else 'dados vazios'}")
    except Exception as e:
        print(f"❌ get_registration_details: {str(e)[:80]}...")

    # 3. Verificar campos delivery na tabela registrations
    try:
        reg_sample = supabase.table('registrations').select('*').limit(1).execute()
        if reg_sample.data:
            columns = list(reg_sample.data[0].keys())
            if 'delivery_date' in columns:
                print("✅ Campo delivery_date existe")
            else:
                print("❌ Campo delivery_date NÃO existe")

            if 'delivery_status' in columns:
                print("✅ Campo delivery_status existe")
            else:
                print("❌ Campo delivery_status NÃO existe")
    except Exception as e:
        print(f"❌ Erro ao verificar campos: {str(e)[:80]}...")

    print("\n🎯 Verificação concluída!")

if __name__ == "__main__":
    check_setup()
