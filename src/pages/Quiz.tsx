import { useEffect, useState } from 'react'
import type { Difficulty, QuizPayload, StoredResult } from '../types'
import { ApiError, fetchQuiz, submitAttempt } from '../lib/api'
import { getPlayerId, saveResult } from '../lib/storage'

interface Props {
  difficulty: Difficulty
  onFinish: (result: StoredResult) => void
  onBack: () => void
}

type Phase = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; quiz: QuizPayload }

export default function Quiz({ difficulty, onFinish, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchQuiz(difficulty, getPlayerId())
      .then((quiz) => {
        if (cancelled) return
        if (quiz.already_played) {
          setPhase({ kind: 'error', message: "You've already played this difficulty today. Come back tomorrow!" })
          return
        }
        setPhase({ kind: 'ready', quiz })
      })
      .catch((e: unknown) => {
        if (!cancelled) setPhase({ kind: 'error', message: (e as Error).message })
      })
    return () => {
      cancelled = true
    }
  }, [difficulty])

  if (phase.kind === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
        <p>Preparing today's {difficulty} quiz…</p>
        <p className="text-xs text-zinc-500">First load of the day can take ~30 s while questions are fetched.</p>
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-zinc-300">{phase.message}</p>
        <button onClick={onBack} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
          Back
        </button>
      </div>
    )
  }

  const { quiz } = phase
  const q = quiz.questions[index]
  const selected = answers[q.id] ?? null
  const isLast = index === quiz.questions.length - 1

  async function next() {
    if (!isLast) {
      setIndex(index + 1)
      return
    }
    setSubmitting(true)
    try {
      const result = await submitAttempt(quiz.quiz_id, getPlayerId(), answers)
      const stored: StoredResult = {
        ...result,
        quiz_id: quiz.quiz_id,
        date: quiz.date,
        difficulty,
        questions: quiz.questions,
        answers,
      }
      saveResult(stored)
      onFinish(stored)
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 409 ? 'Already submitted today.' : (e as Error).message
      setPhase({ kind: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span className="capitalize">{difficulty}</span>
        <span>
          {index + 1} / {quiz.questions.length}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded bg-zinc-800">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-indigo-400">{q.interest}</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{q.question}</h2>
      </div>

      <div className="grid gap-3">
        {q.options.map((opt) => {
          const active = selected === opt
          return (
            <button
              key={opt}
              onClick={() => setAnswers({ ...answers, [q.id]: opt })}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                active
                  ? 'border-indigo-500 bg-indigo-500/15 text-white'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => (index === 0 ? onBack() : setIndex(index - 1))}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          {index === 0 ? 'Cancel' : 'Previous'}
        </button>
        <button
          onClick={next}
          disabled={!selected || submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  )
}
