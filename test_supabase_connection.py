#!/usr/bin/env python3
"""
Script para testar conexão com Supabase e validar correções da Fase 1
Execute: python test_supabase_connection.py
"""

import psycopg2
import os
from urllib.parse import urlparse

def test_supabase_connection():
    """Testa conexão com Supabase e valida correções"""
    
    # Você precisa definir sua DATABASE_URL do Supabase
    # Exemplo: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
    database_url = os.getenv('DATABASE_URL') or input("Digite sua DATABASE_URL do Supabase: ")
    
    try:
        # Parse da URL
        url = urlparse(database_url)
        
        # Conectar ao banco
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            database=url.path[1:],  # Remove '/' do início
            user=url.username,
            password=url.password
        )
        
        cursor = conn.cursor()
        
        print("✅ Conexão com Supabase estabelecida!")
        
        # Teste 1: Verificar se campo 'role' foi adicionado
        print("\n🔍 Teste 1: Verificando campo 'role' na tabela organizers...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'organizers' AND column_name = 'role'
        """)
        
        role_column = cursor.fetchone()
        if role_column:
            print(f"✅ Campo 'role' encontrado: {role_column}")
        else:
            print("❌ Campo 'role' não encontrado - migração não aplicada")
        
        # Teste 2: Verificar políticas RLS
        print("\n🔍 Teste 2: Verificando políticas RLS...")
        cursor.execute("""
            SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE tablename IN ('patients', 'organizers', 'events', 'registrations')
            ORDER BY tablename, policyname
        """)
        
        policies = cursor.fetchall()
        print(f"✅ Encontradas {len(policies)} políticas RLS:")
        for policy in policies:
            print(f"  - {policy[1]}.{policy[2]}")
        
        # Teste 3: Verificar Edge Functions
        print("\n🔍 Teste 3: Verificando se Edge Function existe...")
        # Nota: Edge Functions não aparecem no schema do PostgreSQL
        print("ℹ️  Edge Functions devem ser verificadas no dashboard do Supabase")
        
        # Teste 4: Contar registros
        print("\n🔍 Teste 4: Contando registros para métricas...")
        
        tables_to_count = ['patients', 'events', 'registrations', 'organizers']
        for table in tables_to_count:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  - {table}: {count} registros")
            except Exception as e:
                print(f"  - {table}: Erro ao contar - {e}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Testes concluídos com sucesso!")
        print("\n📋 Próximos passos:")
        print("1. Verifique o painel admin no browser")
        print("2. Teste a exportação de relatórios")
        print("3. Confirme se o login funciona sem tela branca")
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        print("\n💡 Dicas:")
        print("1. Verifique se a DATABASE_URL está correta")
        print("2. Confirme se o IP está liberado no Supabase")
        print("3. Verifique se as credenciais estão corretas")

if __name__ == "__main__":
    test_supabase_connection()