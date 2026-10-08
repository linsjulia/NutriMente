// =============================================================
// PLANO B da apresentação: a jornada completa do NutriMente narrada no
// terminal, falando com a API de verdade.
//
//   cd database/demo
//   npm run jornada
//
// Use se alguma tela não estiver pronta (ou travar) na hora: cada passo
// mostra o que o sistema fez, e os e-mails aparecem no Mailpit
// (http://localhost:8025) na mesma hora.
//
// Precisa dos dados de demonstração (npm run seed). A jornada AGENDA,
// CONFIRMA e CANCELA uma consulta de verdade: depois de usar, rode
// "npm run seed" de novo para voltar ao estado inicial da demonstração.
// =============================================================

const API = process.env.API_URL ?? "http://localhost:8080";
const PASSWORD = "Demo1234";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => sleep(Number(process.env.PAUSA_MS ?? 1500));

const fmt = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const brl = (v) => (v == null ? "valor a combinar" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

async function api(method, path, token, body) {
  for (;;) {
    const r = await fetch(API + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) {
      await sleep((Number(r.headers.get("Retry-After")) || 30) * 1000 + 500);
      continue;
    }
    const text = await r.text();
    return { status: r.status, data: text ? JSON.parse(text) : null };
  }
}
const login = async (who) => (await api("POST", "/api/auth/login", null, { email: `${who}@nutrimente.demo`, password: PASSWORD })).data.accessToken;

const step = async (title) => {
  await pause();
  console.log(`\n\x1b[1;34m▶ ${title}\x1b[0m`);
};
const say = (text) => console.log(`  ${text}`);

async function main() {
  console.log("\n\x1b[1mNutriMente — jornada completa (API ao vivo)\x1b[0m");

  await step("1. Visitante busca uma nutricionista de comportamento alimentar, até R$ 200");
  const specialties = (await api("GET", "/api/specialties?type=NUTRICIONISTA")).data;
  const comportamental = specialties.find((s) => s.name === "Nutrição Comportamental");
  const search = (await api("GET", `/api/professionals?type=NUTRICIONISTA&specialty=${comportamental.id}&maxPrice=200`)).data;
  for (const p of search.items) say(`${p.name} · ${brl(p.consultationPrice)} · ${stars(p.ratingAverage)} ${p.ratingAverage} (${p.ratingCount} avaliações)`);
  const camila = search.items.find((p) => p.name === "Camila Rocha");

  await step(`2. Perfil da ${camila.name}: especialidades, avaliações e horários livres`);
  say(`Especialidades: ${camila.specialties.map((s) => s.name).join(", ")}`);
  const reviews = (await api("GET", `/api/professionals/${camila.id}/reviews?size=2`)).data;
  for (const r of reviews.items) say(`"${r.comment}" — ${r.patientName} ${stars(r.rating)}`);
  const days = (await api("GET", `/api/professionals/${camila.id}/slots?days=7`)).data;
  for (const d of days.slice(0, 2)) say(`${d.weekday}: ${d.slots.map((s) => s.time).join("  ")}`);

  await step("3. A paciente Ana entra e agenda uma consulta online");
  const ana = await login("ana");
  // Primeiro horário livre em que a Ana também está livre (ela já tem consultas marcadas)
  let booked;
  for (const candidate of days.flatMap((d) => d.slots)) {
    booked = await api("POST", "/api/appointments", ana, { professionalId: camila.id, startsAt: candidate.startsAt, modality: "ONLINE", notes: "Agendada ao vivo na apresentação" });
    if (booked.status === 201) break;
  }
  if (booked?.status !== 201) throw new Error(`não foi possível agendar: ${booked?.data?.detail}`);
  const slot = { startsAt: booked.data.startsAt };
  say(`Agendada: ${fmt(booked.data.startsAt)} · ${brl(booked.data.price)}`);
  say(`Link da videochamada: ${booked.data.videoUrl}`);
  say("E-mails enviados para a Ana e para a Camila → veja no Mailpit (http://localhost:8025)");
  const again = await api("POST", "/api/appointments", ana, { professionalId: camila.id, startsAt: slot.startsAt });
  say(`Tentar o mesmo horário de novo: ${again.status} — "${again.data.detail}"`);

  await step("4. A nutricionista vê a notificação e confirma");
  const camilaToken = await login("camila");
  const unread = (await api("GET", "/api/notifications/unread-count", camilaToken)).data.count;
  const latest = (await api("GET", "/api/notifications?size=1", camilaToken)).data.items[0];
  say(`Sininho da Camila: ${unread} não lidas · última: "${latest.title}" — ${latest.body}`);
  const confirmed = await api("POST", `/api/appointments/${booked.data.id}/confirm`, camilaToken);
  say(`Consulta ${confirmed.data.status === "CONFIRMED" ? "CONFIRMADA" : confirmed.data.status} → a Ana recebe e-mail e notificação`);

  await step("5. Acompanhamento: o plano de ação da Ana");
  const plans = (await api("GET", "/api/plans", ana)).data;
  for (const p of plans) {
    say(`${p.title} (${p.professional.name}): metas ${p.goalsCompleted}/${p.goalsTotal} · checklist de hoje ${p.checklistDoneToday}/${p.checklistTotalToday} · adesão na semana ${p.adherence7d}%`);
  }
  const nutrition = plans.find((p) => p.professional.name === "Camila Rocha");
  const detail = (await api("GET", `/api/plans/${nutrition.id}`, ana)).data;
  for (const c of detail.checklist.filter((i) => i.frequency === "DAILY")) {
    say(`[${c.history.map((h) => (h.completed ? "■" : "□")).join("")}] ${c.description}`);
  }

  await step("6. A Ana marca o checklist de hoje e registra o peso");
  const water = detail.checklist.find((i) => i.description.startsWith("Beber"));
  const checked = (await api("PUT", `/api/plans/${nutrition.id}/checklist/${water.id}/${detail.today}`, ana, { completed: true })).data;
  say(`"${water.description}" marcado → checklist de hoje ${checked.summary.checklistDoneToday}/${checked.summary.checklistTotalToday} · adesão ${checked.summary.adherence7d}%`);
  const progress = (await api("POST", `/api/plans/${nutrition.id}/progress`, ana, { weightKg: 71.2, moodScore: 5, notes: "Registrado ao vivo na apresentação" })).data;
  say(`Pesagens: ${progress.progress.filter((p) => p.weightKg).map((p) => `${p.weightKg} kg`).reverse().join(" → ")}`);

  await step("7. A Ana avalia a consulta que já fez com a psicóloga");
  const past = (await api("GET", "/api/appointments?scope=PAST", ana)).data;
  const toReview = past.find((a) => a.canReview);
  if (toReview) {
    const before = (await api("GET", `/api/professionals/${toReview.professional.id}`)).data;
    await api("POST", `/api/appointments/${toReview.id}/review`, ana, { rating: 5, comment: "Me ajudou muito a lidar com a ansiedade." });
    const after = (await api("GET", `/api/professionals/${toReview.professional.id}`)).data;
    say(`${toReview.professional.name}: nota ${before.ratingAverage} (${before.ratingCount}) → ${after.ratingAverage} (${after.ratingCount})`);
  } else {
    say("(nenhuma consulta pendente de avaliação; rode npm run seed para recriar a demonstração)");
  }

  await step("8. Segurança: cada um só vê o que é seu");
  const pedro = await login("pedro");
  say(`Outro paciente abrindo a consulta da Ana: ${(await api("GET", `/api/appointments/${booked.data.id}`, pedro)).status} (não existe para ele)`);
  say(`Paciente tentando editar horários de atendimento: ${(await api("PUT", "/api/me/availability", ana, { windows: [] })).status} (proibido)`);
  say(`Sem login: ${(await api("GET", "/api/appointments")).status} (precisa entrar)`);

  await step("9. Limpeza: cancelar a consulta agendada ao vivo");
  const byPatient = await api("POST", `/api/appointments/${booked.data.id}/cancel`, ana, { reason: "Era só uma demonstração" });
  if (byPatient.status === 200) {
    say(`A Ana cancelou → ${byPatient.data.status}; o horário volta a ficar livre`);
  } else {
    // Regra: o paciente só cancela até 24 h antes; o profissional, até o início
    say(`A Ana tenta cancelar: ${byPatient.status} — "${byPatient.data.detail}"`);
    const byProfessional = await api("POST", `/api/appointments/${booked.data.id}/cancel`, camilaToken, { reason: "Era só uma demonstração" });
    say(`A Camila cancela → ${byProfessional.data.status}; o horário volta a ficar livre e a Ana é avisada`);
  }

  console.log("\n\x1b[1;32m✔ Jornada completa.\x1b[0m Para voltar ao estado inicial da demonstração: npm run seed\n");
}

main().catch((error) => {
  console.error(`\nFalhou: ${error.message}\nA API está no ar? (docker compose ps) Rodou npm run seed?\n`);
  process.exit(1);
});
