import type { StoredResult } from '../types'

const PLAYER_KEY = 'trivia.playerId'
const RESULT_PREFIX = 'trivia.result.'

export function getPlayerId(): string {
  let id = localStorage.getItem(PLAYER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_KEY, id)
  }
  return id
}

export function loadResult(date: string, difficulty: string): StoredResult | null {
  const raw = localStorage.getItem(`${RESULT_PREFIX}${date}.${difficulty}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredResult
  } catch {
    return null
  }
}

export function saveResult(result: StoredResult): void {
  localStorage.setItem(`${RESULT_PREFIX}${result.date}.${result.difficulty}`, JSON.stringify(result))
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}
