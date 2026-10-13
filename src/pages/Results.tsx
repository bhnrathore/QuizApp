import ScoreDistribution from '../components/ScoreDistribution'
import type { StoredResult } from '../types'

interface Props {
  result: StoredResult
  onHome: () => void
}

function headline(score: number, max: number): string {
  if (score === max) return 'Perfect score!'
  if (score >= max * 0.8) return 'Impressive.'
  if (score >= max * 0.5) return 'Solid effort.'
  if (score > 0) return 'Room to grow.'
  return 'Tough day.'
}

export default function Results({ result, onHome }: Props) {
  const { score, max_score, percentile, total_players, histogram, questions, answers, correct_answers } = result
  const others = total_players - 1

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-zinc-400">
          {result.date} · <span className="capitalize">{result.difficulty}</span>
        </p>
        <h1 className="mt-2 text-4xl font-bold">{headline(score, max_score)}</h1>
        <p className="mt-3 text-5xl font-bold text-indigo-400">
          {score}
          <span className="text-2xl text-zinc-500"> / {max_score}</span>
        </p>
        <p className="mt-3 text-zinc-300">
          {others > 0 ? (
            <>
              You scored better than <span className="font-semibold text-white">{percentile}%</span> of{' '}
              {others} other player{others === 1 ? '' : 's'} today.
            </>
          ) : (
            "You're the first to play this one today. Check back later to see how others did."
          )}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Score distribution</h2>
        <ScoreDistribution histogram={histogram} yourScore={score} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Review</h2>
        {questions.map((q, i) => {
          const chosen = answers[q.id]
          const correct = correct_answers[q.id]
          const ok = chosen === correct
          return (
            <div key={q.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {i + 1}. {q.interest}
              </p>
              <p className="mt-1 font-medium">{q.question}</p>
              <p className={`mt-2 text-sm ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ok ? '✓' : '✗'} {chosen ?? 'No answer'}
              </p>
              {!ok && <p className="text-sm text-zinc-400">Correct: {correct}</p>}
            </div>
          )
        })}
      </section>

      <button onClick={onHome} className="self-center rounded-lg bg-zinc-800 px-5 py-2 text-sm hover:bg-zinc-700">
        Back to home
      </button>
    </div>
  )
}
