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

## Deployment

Two GitHub Actions workflows deploy on push to `main`:

- `.github/workflows/deploy-pages.yml` — builds the frontend and publishes it to GitHub Pages at `https://bhnrathore.github.io/QuizApp/`.
- `.github/workflows/deploy-supabase.yml` — deploys the edge functions whenever `supabase/functions/**` or `supabase/config.toml` changes.

One-time setup in the GitHub repo:

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Secrets and variables → Actions → New repository secret:**

   | Secret | Where to find it |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
   | `SUPABASE_PROJECT_ID` | Supabase → Project Settings → General → Reference ID |
   | `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → Generate new token |

Database migrations (`supabase/migrations/*.sql`) are not applied automatically — run them in the SQL editor as described above.

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
