# Daily Trivia

One shared 5-question quiz per day (science, history, film & TV, tech, books), three difficulties, anonymous play, and a score-distribution comparison against everyone else who played.

- Frontend: Vite + React + TypeScript + Tailwind + Recharts
- Backend: Supabase (Postgres + Edge Functions + pg_cron)
- Questions: [Open Trivia DB](https://opentdb.com) (CC BY-SA 4.0)

## Setup

Requires Node 20.19+ / 22.12+ (`nvm use 22`).

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Supabase

1. Create a project at https://supabase.com.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Deploy the edge functions:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy get-quiz submit-attempt generate-daily-quiz
   ```
4. (Optional, recommended) Enable `pg_cron` and `pg_net` under Database → Extensions, fill in the placeholders in `supabase/migrations/0002_cron.sql`, and run it. This pre-generates each day's quizzes at 00:05 UTC. Without it, the first player of the day triggers generation (~25 s wait).

### Generate today's quizzes manually

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-quiz" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Layout

```
src/
  pages/Home.tsx          difficulty picker, shows already-played state
  pages/Quiz.tsx          one question at a time, submits answers
  pages/Results.tsx       score, percentile, distribution curve, review
  components/ScoreDistribution.tsx
  lib/api.ts              edge function client
  lib/storage.ts          anonymous player id + cached results
supabase/
  migrations/             schema, RLS, histogram RPC, cron schedule
  functions/
    generate-daily-quiz/  fetches from OpenTDB, upserts 3 quizzes/day
    get-quiz/             returns today's quiz with answers stripped
    submit-attempt/       scores server-side, returns percentile + histogram
```
