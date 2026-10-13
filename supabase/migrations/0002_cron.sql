-- Schedule daily generation at 00:05 UTC. Requires pg_cron + pg_net (enable in Dashboard > Database > Extensions).
-- Replace the two placeholders before running; or store them in Vault and read via vault.decrypted_secrets.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'generate-daily-quiz',
  '5 0 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-quiz',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
