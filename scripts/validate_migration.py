#!/usr/bin/env python3
"""
Script para validar se a migração pode ser aplicada com segurança
Verifica a estrutura atual da tabela registrations
"""

import os
import sys
from supabase import create_client, Client

def validate_migration():
    """Valida se a migração pode ser aplicada com segurança"""

    # Configuração do Supabase
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não encontradas")
        print("Configure as variáveis de ambiente antes de executar")
        return False

    try:
        supabase: Client = create_client(url, key)

        print("🔍 Validando estrutura da tabela registrations...")

        # Verificar se a tabela existe e tem dados
        result = supabase.table('registrations').select('id').limit(1).execute()

        if not result.data:
            print("⚠️  Tabela registrations está vazia ou não existe")
            return False

        print(f"✅ Tabela registrations encontrada")

        # Contar registros totais
        count_result = supabase.table('registrations').select('id', count='exact').execute()
        total_registrations = count_result.count

        print(f"📊 Total de registros: {total_registrations}")

        # Verificar registros recentes (últimas 24h)
        from datetime import datetime, timedelta
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()

        recent_result = supabase.table('registrations')\
            .select('id', count='exact')\
            .gte('created_at', yesterday)\
            .execute()

        recent_count = recent_result.count
        print(f"📈 Registros nas últimas 24h: {recent_count}")

        if recent_count > 0:
            print("⚠️  ATENÇÃO: Há registros recentes. Aplicar migração com cautela!")

        # Verificar se os novos campos já existem
        try:
            test_result = supabase.table('registrations')\
                .select('attendance_confirmed')\
                .limit(1)\
                .execute()

            print("⚠️  Campo 'attendance_confirmed' já existe na tabela")
            return False

        except Exception:
            print("✅ Novos campos não existem ainda - migração pode prosseguir")

        print("\n🎯 RESUMO DA VALIDAÇÃO:")
        print(f"   - Tabela registrations: ✅ Existe")
        print(f"   - Total de registros: {total_registrations}")
        print(f"   - Registros recentes: {recent_count}")
        print(f"   - Novos campos: ✅ Não existem ainda")

        if recent_count > 0:
            print("\n⚠️  RECOMENDAÇÃO: Aguardar período de menor atividade para aplicar migração")
        else:
            print("\n✅ SEGURO: Migração pode ser aplicada")

        return True

    except Exception as e:
        print(f"❌ Erro ao validar migração: {e}")
        return False

if __name__ == "__main__":
    success = validate_migration()
    sys.exit(0 if success else 1)
