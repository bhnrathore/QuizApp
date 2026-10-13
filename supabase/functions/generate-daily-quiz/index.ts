import { ensureAllQuizzes, serviceClient } from "../_shared/quiz.ts";
import { handleOptions, isIsoDate, json, todayUtc } from "../_shared/utils.ts";

// Invoked by pg_cron daily; protected by the service role key so clients can't trigger it.
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayUtc();
  if (!isIsoDate(date)) return json({ error: "Invalid date" }, 400);

  try {
    const ids = await ensureAllQuizzes(serviceClient(), date);
    return json({ date, quizzes: ids });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
