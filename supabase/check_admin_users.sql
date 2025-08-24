-- ITEM 3: Usuários admin
SELECT 'Usuários com role admin' as item,
       CONCAT(COUNT(*), ' usuários') as status
FROM public.organizers WHERE role = 'admin';