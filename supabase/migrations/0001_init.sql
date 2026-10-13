-- Daily quizzes: one row per (date, difficulty). `questions` holds correct answers; never exposed directly.
create table if not exists public.daily_quizzes (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  questions jsonb not null,
  created_at timestamptz not null default now(),
  unique (quiz_date, difficulty)
);

-- One attempt per anonymous player per quiz.
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.daily_quizzes(id) on delete cascade,
  player_id uuid not null,
  answers jsonb not null,
  score int not null check (score >= 0),
  created_at timestamptz not null default now(),
  unique (quiz_id, player_id)
);

create index if not exists attempts_quiz_id_score_idx on public.attempts (quiz_id, score);

-- Lock everything down; edge functions use the service role.
alter table public.daily_quizzes enable row level security;
alter table public.attempts enable row level security;
revoke all on public.daily_quizzes from anon, authenticated;
revoke all on public.attempts from anon, authenticated;

-- Counts of attempts per score for a quiz; zero-filled from 0..max_score.
create or replace function public.get_score_histogram(p_quiz_id uuid, p_max_score int)
returns table (score int, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.score, coalesce(count(a.id), 0) as count
  from generate_series(0, p_max_score) as s(score)
  left join public.attempts a on a.quiz_id = p_quiz_id and a.score = s.score
  group by s.score
  order by s.score;
$$;

revoke all on function public.get_score_histogram(uuid, int) from public, anon, authenticated;
