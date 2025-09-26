#!/usr/bin/env python3
"""
🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA PATIENTS
Conecta diretamente ao Supabase para identificar a causa real do erro 409
"""

from supabase import create_client, Client
import json
from datetime import datetime

# Configurações extraídas de src/integrations/supabase/client.ts
SUPABASE_URL = "https://uoermayoxjaaomzjmuhp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc"

def print_section(title):
    """Imprime seção formatada"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print('='*60)

def diagnose_patients_table():
    """Diagnóstico completo da tabela patients"""

    print("🚀 Iniciando diagnóstico do Supabase...")

    try:
        # Conectar ao Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Conexão com Supabase estabelecida")

        # 1. VERIFICAR EXISTÊNCIA E ESTRUTURA DA TABELA
        print_section("ESTRUTURA DA TABELA PATIENTS")

        try:
            # Tentar buscar um registro para verificar estrutura
            sample_response = supabase.table('patients').select('*').limit(1).execute()
            print(f"✅ Tabela 'patients' existe")

            if sample_response.data:
                print(f"📊 Estrutura detectada: {list(sample_response.data[0].keys())}")
            else:
                print("📊 Tabela vazia - buscando estrutura via inserção de teste...")

        except Exception as e:
            print(f"❌ Erro ao acessar tabela 'patients': {e}")
            return

        # 2. CONTAR REGISTROS EXISTENTES
        print_section("CONTAGEM DE REGISTROS")

        try:
            count_response = supabase.table('patients').select('*', count='exact').execute()
            total_patients = count_response.count
            print(f"📊 Total de pacientes: {total_patients}")

        except Exception as e:
            print(f"❌ Erro ao contar registros: {e}")
            total_patients = 0

        # 3. VERIFICAR CPF E EMAIL ESPECÍFICOS
        print_section("VERIFICAÇÃO DE DUPLICATAS")

        test_cpf = "11228730695"
        test_email = "pablook1515@yahoo.com.br"

        # Verificar CPF
        try:
            cpf_response = supabase.table('patients').select('*').eq('cpf', test_cpf).execute()
            if cpf_response.data:
                print(f"⚠️  CPF {test_cpf} JÁ EXISTE:")
                for record in cpf_response.data:
                    print(f"   - ID: {record['id']}")
                    print(f"   - Nome: {record['nome']}")
                    print(f"   - Email: {record['email']}")
                    print(f"   - Criado: {record['created_at']}")
            else:
                print(f"✅ CPF {test_cpf} NÃO existe no banco")

        except Exception as e:
            print(f"❌ Erro ao verificar CPF: {e}")

        # Verificar Email
        try:
            email_response = supabase.table('patients').select('*').eq('email', test_email).execute()
            if email_response.data:
                print(f"⚠️  Email {test_email} JÁ EXISTE:")
                for record in email_response.data:
                    print(f"   - ID: {record['id']}")
                    print(f"   - Nome: {record['nome']}")
                    print(f"   - CPF: {record['cpf']}")
                    print(f"   - Criado: {record['created_at']}")
            else:
                print(f"✅ Email {test_email} NÃO existe no banco")

        except Exception as e:
            print(f"❌ Erro ao verificar email: {e}")

        # 4. TESTE DE INSERÇÃO REAL
        print_section("TESTE DE INSERÇÃO DIRETA")

        test_data = {
            'nome': 'TESTE PYTHON DIAGNÓSTICO',
            'email': 'teste.python.diagnostico@example.com',
            'telefone': '11999999999',
            'cpf': '99999999999',
            'data_nascimento': '1990-01-01',
            'consentimento_lgpd': True
        }

        try:
            print("🧪 Tentando inserção de teste...")
            insert_response = supabase.table('patients').insert(test_data).execute()

            if insert_response.data:
                print("✅ INSERÇÃO FUNCIONOU! O problema NÃO é RLS ou constraints básicas")
                print(f"📊 Registro criado: {insert_response.data[0]['id']}")

                # Limpar teste
                delete_response = supabase.table('patients').delete().eq('email', test_data['email']).execute()
                print("🧹 Registro de teste removido")

            else:
                print("❌ Inserção falhou sem dados retornados")

        except Exception as e:
            print(f"❌ ERRO NA INSERÇÃO: {e}")
            print(f"🔍 Tipo do erro: {type(e)}")

            # Tentar extrair detalhes do erro
            if hasattr(e, 'details'):
                print(f"📋 Detalhes: {e.details}")
            if hasattr(e, 'message'):
                print(f"💬 Mensagem: {e.message}")
            if hasattr(e, 'code'):
                print(f"🔢 Código: {e.code}")

        # 5. TESTE COM DADOS EXATOS DO FORMULÁRIO
        print_section("TESTE COM DADOS EXATOS DO FORMULÁRIO")

        exact_data = {
            'nome': 'RENATO MAGNO C ALVES',
            'email': 'pablook1515@yahoo.com.br',
            'telefone': '31989527170',
            'cpf': '11228730695',
            'data_nascimento': '1991-03-17',
            'consentimento_lgpd': True
        }

        try:
            print("🎯 Tentando inserção com dados EXATOS do formulário...")
            exact_insert_response = supabase.table('patients').insert(exact_data).execute()

            if exact_insert_response.data:
                print("✅ INSERÇÃO COM DADOS EXATOS FUNCIONOU!")
                print(f"📊 Registro criado: {exact_insert_response.data[0]['id']}")

                # NÃO remover - deixar para teste do formulário
                print("⚠️  Registro mantido para teste do formulário")

            else:
                print("❌ Inserção com dados exatos falhou")

        except Exception as e:
            print(f"❌ ERRO COM DADOS EXATOS: {e}")
            print("🔍 Este é provavelmente o mesmo erro do formulário!")

        # 6. LISTAR ÚLTIMOS REGISTROS
        print_section("ÚLTIMOS REGISTROS")

        try:
            recent_response = supabase.table('patients').select('id, nome, email, cpf, created_at').order('created_at', desc=True).limit(5).execute()

            if recent_response.data:
                print("📋 Últimos 5 registros:")
                for i, record in enumerate(recent_response.data, 1):
                    print(f"   {i}. {record['nome']} ({record['email']}) - {record['created_at']}")
            else:
                print("📋 Nenhum registro encontrado")

        except Exception as e:
            print(f"❌ Erro ao listar registros: {e}")

        print_section("DIAGNÓSTICO CONCLUÍDO")
        print("🎯 Verifique os resultados acima para identificar o problema!")

    except Exception as e:
        print(f"💥 ERRO CRÍTICO na conexão: {e}")
        print("🔍 Verifique se as credenciais estão corretas")

if __name__ == "__main__":
    diagnose_patients_table()
