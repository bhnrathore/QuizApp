import { useState } from 'react'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import type { Difficulty, StoredResult } from './types'

type View = { name: 'home' } | { name: 'quiz'; difficulty: Difficulty } | { name: 'results'; result: StoredResult }

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10">
        {view.name === 'home' && (
          <Home
            onStart={(difficulty) => setView({ name: 'quiz', difficulty })}
            onViewResult={(result) => setView({ name: 'results', result })}
          />
        )}
        {view.name === 'quiz' && (
          <Quiz
            difficulty={view.difficulty}
            onFinish={(result) => setView({ name: 'results', result })}
            onBack={() => setView({ name: 'home' })}
          />
        )}
        {view.name === 'results' && <Results result={view.result} onHome={() => setView({ name: 'home' })} />}
      </main>
      <footer className="pb-8 text-center text-xs text-zinc-500">
        Questions from{' '}
        <a href="https://opentdb.com" className="underline hover:text-zinc-300" target="_blank" rel="noreferrer">
          Open Trivia Database
        </a>{' '}
        ·{' '}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          className="underline hover:text-zinc-300"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>
      </footer>
    </div>
  )
}
