import { serviceClient } from "../_shared/quiz.ts";
import { handleOptions, json, StoredQuestion } from "../_shared/utils.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Body {
  quiz_id?: unknown;
  player_id?: unknown;
  answers?: unknown;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { quiz_id, player_id, answers } = body;
  if (typeof quiz_id !== "string" || !UUID_RE.test(quiz_id)) return json({ error: "Invalid quiz_id" }, 400);
  if (typeof player_id !== "string" || !UUID_RE.test(player_id)) return json({ error: "Invalid player_id" }, 400);
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return json({ error: "answers must be an object of question_id -> answer" }, 400);
  }
  const answerMap = answers as Record<string, unknown>;

  const supabase = serviceClient();

  const { data: quiz, error: quizErr } = await supabase
    .from("daily_quizzes")
    .select("id, questions")
    .eq("id", quiz_id)
    .maybeSingle();
  if (quizErr) return json({ error: quizErr.message }, 500);
  if (!quiz) return json({ error: "Quiz not found" }, 404);

  const questions = quiz.questions as StoredQuestion[];
  const maxScore = questions.length;

  let score = 0;
  const cleanAnswers: Record<string, string | null> = {};
  for (const q of questions) {
    const a = answerMap[q.id];
    const chosen = typeof a === "string" && q.options.includes(a) ? a : null;
    cleanAnswers[q.id] = chosen;
    if (chosen === q.correct_answer) score++;
  }

  const { error: insertErr } = await supabase
    .from("attempts")
    .insert({ quiz_id, player_id, answers: cleanAnswers, score });
  if (insertErr) {
    if (insertErr.code === "23505") return json({ error: "Already submitted" }, 409);
    return json({ error: insertErr.message }, 500);
  }

  const { data: histRows, error: histErr } = await supabase.rpc("get_score_histogram", {
    p_quiz_id: quiz_id,
    p_max_score: maxScore,
  });
  if (histErr) return json({ error: histErr.message }, 500);

  const histogram = (histRows as { score: number; count: number }[]).map((r) => ({
    score: r.score,
    count: Number(r.count),
  }));
  const total = histogram.reduce((s, r) => s + r.count, 0);
  const below = histogram.filter((r) => r.score < score).reduce((s, r) => s + r.count, 0);
  const tied = histogram.find((r) => r.score === score)?.count ?? 1;
  // Percentile rank with ties split; excludes the player's own attempt from the tie bucket.
  const percentile = total > 1 ? Math.round(((below + (tied - 1) / 2) / (total - 1)) * 100) : 100;

  return json({
    score,
    max_score: maxScore,
    percentile,
    total_players: total,
    histogram,
    correct_answers: Object.fromEntries(questions.map((q) => [q.id, q.correct_answer])),
  });
});
