export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // A partir da Fase 5, aqui é registrado o node-cron que gera lembretes
  // automáticos de follow-up (ver lib/reminders/scheduler.ts).
}
