import { useMemo } from 'react'
import type { Difficulty, StoredResult } from '../types'
import { DIFFICULTIES } from '../types'
import { loadResult, todayUtc } from '../lib/storage'
import { isConfigured } from '../lib/api'

interface Props {
  onStart: (difficulty: Difficulty) => void
  onViewResult: (result: StoredResult) => void
}

const LABELS: Record<Difficulty, { title: string; blurb: string }> = {
  easy: { title: 'Easy', blurb: 'Warm up with the basics' },
  medium: { title: 'Medium', blurb: 'A solid daily challenge' },
  hard: { title: 'Hard', blurb: 'For the true trivia nerd' },
}

export default function Home({ onStart, onViewResult }: Props) {
  const today = todayUtc()
  const played = useMemo(() => {
    const map: Partial<Record<Difficulty, StoredResult>> = {}
    for (const d of DIFFICULTIES) {
      const r = loadResult(today, d)
      if (r) map[d] = r
    }
    return map
  }, [today])

  const dateLabel = new Date(today + 'T00:00:00Z').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-zinc-400">{dateLabel}</p>
        <h1 className="mt-2 text-4xl font-bold">Daily Trivia</h1>
        <p className="mt-2 text-zinc-400">
          Five questions across science, history, film &amp; TV, tech, and books. One shot per day.
        </p>
      </header>

      {!isConfigured && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Supabase isn't configured yet. Copy <code>.env.example</code> to <code>.env</code> and add your project URL
          and anon key.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {DIFFICULTIES.map((d) => {
          const result = played[d]
          return (
            <button
              key={d}
              onClick={() => (result ? onViewResult(result) : onStart(d))}
              className="group flex flex-col items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-indigo-500 hover:bg-zinc-800/60"
            >
              <span className="text-lg font-semibold">{LABELS[d].title}</span>
              <span className="text-sm text-zinc-400">{LABELS[d].blurb}</span>
              <span className="mt-2 text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
                {result ? `Played · ${result.score}/${result.max_score} · view results →` : 'Play →'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
