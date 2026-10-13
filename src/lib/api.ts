import type { Difficulty, QuizPayload, ResultPayload } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(SUPABASE_URL && ANON_KEY)

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`
}

async function call<T>(name: string, init: RequestInit & { query?: Record<string, string> } = {}): Promise<T> {
  if (!isConfigured) throw new Error('Supabase is not configured. Copy .env.example to .env and fill in your keys.')
  const url = new URL(fnUrl(name))
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v)
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY!,
      Authorization: `Bearer ${ANON_KEY}`,
      ...init.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status)
  return body as T
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function fetchQuiz(difficulty: Difficulty, playerId: string): Promise<QuizPayload> {
  return call<QuizPayload>('get-quiz', { query: { difficulty, player_id: playerId } })
}

export function submitAttempt(
  quizId: string,
  playerId: string,
  answers: Record<string, string | null>,
): Promise<ResultPayload> {
  return call<ResultPayload>('submit-attempt', {
    method: 'POST',
    body: JSON.stringify({ quiz_id: quizId, player_id: playerId, answers }),
  })
}
