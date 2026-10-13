export type Difficulty = 'easy' | 'medium' | 'hard'
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export interface Question {
  id: string
  interest: string
  category: string
  question: string
  options: string[]
}

export interface QuizPayload {
  quiz_id: string
  date: string
  difficulty: Difficulty
  already_played: boolean
  total_players: number
  questions: Question[]
}

export interface HistogramBin {
  score: number
  count: number
}

export interface ResultPayload {
  score: number
  max_score: number
  percentile: number
  total_players: number
  histogram: HistogramBin[]
  correct_answers: Record<string, string>
}

export interface StoredResult extends ResultPayload {
  quiz_id: string
  date: string
  difficulty: Difficulty
  questions: Question[]
  answers: Record<string, string | null>
}
