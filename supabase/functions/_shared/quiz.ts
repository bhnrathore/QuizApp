import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { DIFFICULTIES, Difficulty, StoredQuestion } from "./utils.ts";

interface InterestSlot {
  interest: string;
  // Alternates by day-of-year so Movies & TV covers both Film and Television.
  categories: number[];
}

const INTEREST_SLOTS: InterestSlot[] = [
  { interest: "Science & Space", categories: [17] },
  { interest: "History", categories: [23] },
  { interest: "Movies & TV", categories: [11, 14] },
  { interest: "Tech & Programming", categories: [18, 30] },
  { interest: "Books & Literature", categories: [10] },
];

const OPENTDB_DELAY_MS = 5200; // API rate limit: 1 request / 5 s / IP

interface OpenTdbQuestion {
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

function decodeB64(s: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dayOfYear(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

async function fetchOne(category: number, difficulty: Difficulty): Promise<OpenTdbQuestion | null> {
  const url = `https://opentdb.com/api.php?amount=1&category=${category}&difficulty=${difficulty}&type=multiple&encode=base64`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.response_code !== 0 || !data.results?.length) return null;
  const q = data.results[0];
  return {
    category: decodeB64(q.category),
    question: decodeB64(q.question),
    correct_answer: decodeB64(q.correct_answer),
    incorrect_answers: q.incorrect_answers.map(decodeB64),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function buildQuestions(date: string, difficulty: Difficulty): Promise<StoredQuestion[]> {
  const parity = dayOfYear(date);
  const out: StoredQuestion[] = [];
  for (const slot of INTEREST_SLOTS) {
    const primary = slot.categories[parity % slot.categories.length];
    const order = [primary, ...slot.categories.filter((c) => c !== primary)];
    let picked: OpenTdbQuestion | null = null;
    for (const cat of order) {
      if (out.length > 0 || cat !== order[0]) await sleep(OPENTDB_DELAY_MS);
      picked = await fetchOne(cat, difficulty);
      if (picked) break;
    }
    if (!picked) throw new Error(`No question for ${slot.interest} (${difficulty})`);
    out.push({
      id: crypto.randomUUID(),
      interest: slot.interest,
      category: picked.category,
      question: picked.question,
      correct_answer: picked.correct_answer,
      options: shuffle([picked.correct_answer, ...picked.incorrect_answers]),
    });
  }
  return out;
}

export async function ensureQuiz(
  supabase: SupabaseClient,
  date: string,
  difficulty: Difficulty,
): Promise<{ id: string; questions: StoredQuestion[] }> {
  const { data: existing } = await supabase
    .from("daily_quizzes")
    .select("id, questions")
    .eq("quiz_date", date)
    .eq("difficulty", difficulty)
    .maybeSingle();
  if (existing) return existing as { id: string; questions: StoredQuestion[] };

  const questions = await buildQuestions(date, difficulty);
  const { data, error } = await supabase
    .from("daily_quizzes")
    .upsert({ quiz_date: date, difficulty, questions }, { onConflict: "quiz_date,difficulty" })
    .select("id, questions")
    .single();
  if (error) throw error;
  return data as { id: string; questions: StoredQuestion[] };
}

export async function ensureAllQuizzes(supabase: SupabaseClient, date: string) {
  const results: Record<string, string> = {};
  for (const d of DIFFICULTIES) {
    const q = await ensureQuiz(supabase, date, d);
    results[d] = q.id;
    await sleep(OPENTDB_DELAY_MS);
  }
  return results;
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}
