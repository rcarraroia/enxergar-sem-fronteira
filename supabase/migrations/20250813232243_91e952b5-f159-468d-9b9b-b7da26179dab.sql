
-- Update the organizer record with the actual user UUID
-- Replace 'ACTUAL_USER_UUID_HERE' with the UUID from the Supabase dashboard
UPDATE public.organizers 
SET id = 'ACTUAL_USER_UUID_HERE'
WHERE email = 'rcarraro@admin.enxergar';
