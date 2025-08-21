#!/usr/bin/env python3
"""
Verificar estrutura da tabela organizers
"""

import psycopg2

def check_organizers_structure():
    """Verificar estrutura da tabela organizers"""
    db_url = "postgresql://postgres:7oC536YUOIGPqsPk@db.uoermayoxjaaomzjmuhp.supabase.co:5432/postgres"
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        print("🔍 VERIFICANDO ESTRUTURA DA TABELA ORGANIZERS")
        print("=" * 60)
        
        # Verificar colunas da tabela organizers
        cursor.execute("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'organizers' AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        print("\n📋 COLUNAS DA TABELA ORGANIZERS:")
        for col in columns:
            print(f"   • {col[0]} ({col[1]}) - Nullable: {col[2]} - Default: {col[3]}")
        
        # Verificar se existe tabela events e sua estrutura
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'events'
            );
        """)
        
        events_exists = cursor.fetchone()[0]
        print(f"\n📅 TABELA EVENTS EXISTE: {'✅ SIM' if events_exists else '❌ NÃO'}")
        
        if events_exists:
            cursor.execute("""
                SELECT 
                    column_name,
                    data_type
                FROM information_schema.columns 
                WHERE table_name = 'events' AND table_schema = 'public'
                AND column_name LIKE '%organizer%'
                ORDER BY ordinal_position;
            """)
            
            event_organizer_cols = cursor.fetchall()
            print("\n📋 COLUNAS RELACIONADAS A ORGANIZER NA TABELA EVENTS:")
            for col in event_organizer_cols:
                print(f"   • {col[0]} ({col[1]})")
        
        # Verificar algumas linhas da tabela organizers
        cursor.execute("""
            SELECT id, name, email 
            FROM organizers 
            LIMIT 3;
        """)
        
        sample_data = cursor.fetchall()
        print(f"\n👥 DADOS DE EXEMPLO (3 primeiros):")
        for row in sample_data:
            print(f"   • ID: {row[0]} | Nome: {row[1]} | Email: {row[2]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    check_organizers_structure()