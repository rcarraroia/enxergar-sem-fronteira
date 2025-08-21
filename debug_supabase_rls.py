#!/usr/bin/env python3
"""
Diagnóstico das políticas RLS da tabela organizers
Conecta diretamente ao PostgreSQL do Supabase
"""

import psycopg2
import os
from urllib.parse import urlparse

def connect_to_supabase():
    """Conecta ao PostgreSQL do Supabase"""
    # URL de conexão fornecida diretamente
    db_url = "postgresql://postgres:7oC536YUOIGPqsPk@db.uoermayoxjaaomzjmuhp.supabase.co:5432/postgres"
    
    try:
        conn = psycopg2.connect(db_url)
        print("✅ Conectado ao Supabase PostgreSQL!")
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return None

def diagnose_organizers_table(conn):
    """Diagnostica a tabela organizers e suas políticas RLS"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("🔍 DIAGNÓSTICO DA TABELA ORGANIZERS")
    print("="*60)
    
    # 1. Verificar se a tabela existe
    print("\n1️⃣ VERIFICANDO SE A TABELA EXISTS:")
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'organizers'
        );
    """)
    table_exists = cursor.fetchone()[0]
    print(f"   Tabela organizers existe: {'✅ SIM' if table_exists else '❌ NÃO'}")
    
    if not table_exists:
        print("❌ Tabela organizers não existe!")
        return
    
    # 2. Verificar colunas da tabela
    print("\n2️⃣ COLUNAS DA TABELA:")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'organizers' AND table_schema = 'public'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"   📋 {col[0]} ({col[1]}) - Nullable: {col[2]} - Default: {col[3]}")
    
    # 3. Verificar se RLS está habilitado
    print("\n3️⃣ STATUS DO RLS:")
    cursor.execute("""
        SELECT rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'organizers' AND schemaname = 'public';
    """)
    rls_status = cursor.fetchone()
    if rls_status:
        print(f"   RLS habilitado: {'✅ SIM' if rls_status[0] else '❌ NÃO'}")
    
    # 4. Listar políticas RLS
    print("\n4️⃣ POLÍTICAS RLS ATIVAS:")
    cursor.execute("""
        SELECT policyname, cmd, permissive, roles, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'organizers' AND schemaname = 'public'
        ORDER BY cmd, policyname;
    """)
    policies = cursor.fetchall()
    if policies:
        for policy in policies:
            print(f"   🛡️ {policy[0]} ({policy[1]})")
            print(f"      Permissive: {policy[2]}")
            print(f"      Roles: {policy[3]}")
            print(f"      Qual: {policy[4]}")
            print(f"      With Check: {policy[5]}")
            print()
    else:
        print("   ❌ Nenhuma política RLS encontrada!")
    
    # 5. Verificar dados na tabela
    print("\n5️⃣ DADOS NA TABELA (primeiros 5 registros):")
    cursor.execute("""
        SELECT id, name, email, status, 
               CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'organizers' AND column_name = 'role') 
                    THEN role ELSE 'N/A' END as role
        FROM organizers 
        ORDER BY created_at DESC 
        LIMIT 5;
    """)
    try:
        records = cursor.fetchall()
        for record in records:
            print(f"   👤 {record[1]} ({record[2]}) - Status: {record[3]} - Role: {record[4]}")
    except Exception as e:
        print(f"   ❌ Erro ao buscar dados: {e}")
    
    # 6. Verificar admin específico
    print("\n6️⃣ VERIFICANDO ADMIN rcarraro@admin.enxergar:")
    cursor.execute("""
        SELECT id, name, email, status,
               CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'organizers' AND column_name = 'role') 
                    THEN role ELSE 'N/A' END as role
        FROM organizers 
        WHERE email = 'rcarraro@admin.enxergar';
    """)
    admin_record = cursor.fetchone()
    if admin_record:
        print(f"   ✅ Admin encontrado: {admin_record[1]} - Status: {admin_record[3]} - Role: {admin_record[4]}")
    else:
        print("   ❌ Admin rcarraro@admin.enxergar NÃO encontrado na tabela!")

def main():
    """Função principal"""
    print("🔍 DIAGNÓSTICO SUPABASE RLS - TABELA ORGANIZERS")
    print("=" * 60)
    
    conn = connect_to_supabase()
    if not conn:
        return
    
    try:
        diagnose_organizers_table(conn)
    except Exception as e:
        print(f"❌ Erro durante diagnóstico: {e}")
    finally:
        conn.close()
        print("\n✅ Conexão fechada.")

if __name__ == "__main__":
    main()