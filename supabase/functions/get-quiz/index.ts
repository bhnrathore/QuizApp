import { ensureQuiz, serviceClient } from "../_shared/quiz.ts";
import { handleOptions, isDifficulty, json, todayUtc } from "../_shared/utils.ts";

// Returns today's quiz for a difficulty with correct answers stripped.
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const difficulty = url.searchParams.get("difficulty");
  const playerId = url.searchParams.get("player_id");
  if (!isDifficulty(difficulty)) return json({ error: "Invalid difficulty" }, 400);

  const date = todayUtc();
  const supabase = serviceClient();

  try {
    const quiz = await ensureQuiz(supabase, date, difficulty);

    let alreadyPlayed = false;
    if (playerId) {
      const { count } = await supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quiz.id)
        .eq("player_id", playerId);
      alreadyPlayed = (count ?? 0) > 0;
    }

    const { count: totalPlayers } = await supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quiz.id);

    return json({
      quiz_id: quiz.id,
      date,
      difficulty,
      already_played: alreadyPlayed,
      total_players: totalPlayers ?? 0,
      questions: quiz.questions.map(({ correct_answer: _c, ...q }) => q),
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
