
-- Adicionar campo city na tabela events
ALTER TABLE public.events ADD COLUMN city text;

-- Migrar dados existentes (extrair cidade do title ou usar parte do location)
UPDATE public.events SET city = 
  CASE 
    WHEN title LIKE '%São Paulo%' THEN 'São Paulo'
    WHEN title LIKE '%Rio%' THEN 'Rio de Janeiro'
    WHEN title LIKE '%Belo Horizonte%' THEN 'Belo Horizonte'
    WHEN title LIKE '%Salvador%' THEN 'Salvador'
    WHEN title LIKE '%Brasília%' THEN 'Brasília'
    WHEN title LIKE '%Fortaleza%' THEN 'Fortaleza'
    WHEN title LIKE '%Recife%' THEN 'Recife'
    WHEN title LIKE '%Porto Alegre%' THEN 'Porto Alegre'
    WHEN title LIKE '%Manaus%' THEN 'Manaus'
    WHEN title LIKE '%Curitiba%' THEN 'Curitiba'
    ELSE COALESCE(SPLIT_PART(location, ' - ', 1), SPLIT_PART(location, ',', -1), 'Cidade não informada')
  END;

-- Tornar campo obrigatório após migração
ALTER TABLE public.events ALTER COLUMN city SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN city SET DEFAULT '';
