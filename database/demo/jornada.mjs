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

import sql from "mssql";

const API = process.env.API_URL ?? "http://localhost:8080";
const PASSWORD = "Demo1234";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => sleep(Number(process.env.PAUSA_MS ?? 1500));

const fmt = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const brl = (v) => (v == null ? "valor a combinar" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
const MEALS = { CAFE_DA_MANHA: "café da manhã", LANCHE_DA_MANHA: "lanche da manhã", ALMOCO: "almoço", LANCHE_DA_TARDE: "lanche da tarde", JANTAR: "jantar", CEIA: "ceia", OUTRO: "outro" };
const GOALS = { EMAGRECER: "emagrecer", GANHAR_MASSA: "ganhar massa", ALIMENTACAO_SAUDAVEL: "comer melhor", RELACAO_COM_A_COMIDA: "relação com a comida", ANSIEDADE: "ansiedade", SONO: "sono", ENERGIA: "energia", AUTOESTIMA: "autoestima" };
const kg = (n) => `${String(n).replace(".", ",")} kg`;
const cut = (text, size = 70) => (text.length > size ? text.slice(0, size) + "…" : text);

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
  for (const p of search.items) {
    const how = [p.offersOnline && "online", p.offersInPerson && `presencial em ${p.officeCity}/${p.officeState}`].filter(Boolean).join(" e ");
    say(`${p.name} · ${brl(p.consultationPrice)} · ${stars(p.ratingAverage)} ${p.ratingAverage} · atende ${how}`);
  }
  const camila = search.items.find((p) => p.name === "Camila Rocha");

  await step(`2. Perfil da ${camila.name}: especialidades, avaliações e horários livres`);
  say(`Especialidades: ${camila.specialties.map((s) => s.name).join(", ")}`);
  const reviews = (await api("GET", `/api/professionals/${camila.id}/reviews?size=2`)).data;
  for (const r of reviews.items) say(`"${r.comment}" — ${r.patientName} ${stars(r.rating)}`);
  const days = (await api("GET", `/api/professionals/${camila.id}/slots?days=7`)).data;
  for (const d of days.slice(0, 2)) say(`${d.weekday}: ${d.slots.map((s) => s.time).join("  ")}`);

  await step("3. A paciente Ana agenda uma consulta online e conta como está (triagem)");
  const ana = await login("ana");
  const screening = { reason: "Quero organizar os lanches da tarde.", symptoms: "Fome forte no fim do dia.", moodScore: 4 };
  // Primeiro horário livre em que a Ana também está livre (ela já tem consultas marcadas)
  let booked;
  for (const candidate of days.flatMap((d) => d.slots)) {
    booked = await api("POST", "/api/appointments", ana, { professionalId: camila.id, startsAt: candidate.startsAt, modality: "ONLINE", notes: "Agendada ao vivo na apresentação", screening });
    if (booked.status === 201) break;
  }
  if (booked?.status !== 201) throw new Error(`não foi possível agendar: ${booked?.data?.detail}`);
  say(`Agendada: ${fmt(booked.data.startsAt)} · ${brl(booked.data.price)}`);
  say(`Link da videochamada: ${booked.data.videoUrl}`);
  say("E-mails enviados para a Ana e para a Camila → veja no Mailpit (http://localhost:8025)");
  const again = await api("POST", "/api/appointments", ana, { professionalId: camila.id, startsAt: booked.data.startsAt });
  say(`Tentar o mesmo horário de novo: ${again.status} — "${again.data.detail}"`);

  await step("4. A nutricionista se prepara: notificação, triagem, questionário inicial e diário da Ana");
  const camilaToken = await login("camila");
  const unread = (await api("GET", "/api/notifications/unread-count", camilaToken)).data.count;
  const latest = (await api("GET", "/api/notifications?size=1", camilaToken)).data.items[0];
  say(`Sininho da Camila: ${unread} não lidas · última: "${latest.title}"`);
  const triage = (await api("GET", `/api/appointments/${booked.data.id}/screening`, camilaToken)).data;
  say(`Triagem: "${triage.reason}" · sintomas: "${triage.symptoms}"`);
  const anaId = booked.data.patient.id;
  const intake = (await api("GET", `/api/patients/${anaId}/intake`, camilaToken)).data;
  say(`Questionário inicial: objetivos: ${intake.goals.map((g) => GOALS[g]).join(", ")} · ${intake.mealsPerDay} refeições/dia · sono ${intake.sleepQuality}/5 · estresse ${intake.stressLevel}/5`);
  const meals = (await api("GET", `/api/patients/${anaId}/meals?size=4`, camilaToken)).data;
  for (const m of meals.items) say(`Diário: ${MEALS[m.mealType]} · ${cut(m.description, 45)}${m.photoUrl ? " · 📷 com foto" : ""}`);
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
  say(`Pesagens: ${progress.progress.filter((p) => p.weightKg).map((p) => kg(p.weightKg)).reverse().join(" → ")}`);

  await step("7. Registro da consulta (prontuário): a profissional vê tudo, a paciente só as orientações");
  const past = (await api("GET", "/api/appointments?scope=PAST", ana)).data;
  const withRecord = past.find((a) => a.professional.name === "Camila Rocha" && a.status === "COMPLETED");
  const asProfessional = (await api("GET", `/api/appointments/${withRecord.id}/record`, camilaToken)).data;
  const asPatient = (await api("GET", `/api/appointments/${withRecord.id}/record`, ana)).data;
  say(`Camila (anotações privadas): "${cut(asProfessional.privateNotes)}"`);
  say(`Ana (anotações privadas): ${asPatient.privateNotes === null ? "não recebe — só a profissional lê" : "⚠ visível"}`);
  say(`Ana (orientações): "${cut(asPatient.patientGuidance.replaceAll("\n", " "))}"`);

  await step("8. A Ana avalia a consulta que já fez com a psicóloga");
  const toReview = past.find((a) => a.canReview);
  if (toReview) {
    const before = (await api("GET", `/api/professionals/${toReview.professional.id}`)).data;
    await api("POST", `/api/appointments/${toReview.id}/review`, ana, { rating: 5, comment: "Me ajudou muito a lidar com a ansiedade." });
    const after = (await api("GET", `/api/professionals/${toReview.professional.id}`)).data;
    say(`${toReview.professional.name}: nota ${before.ratingAverage} (${before.ratingCount}) → ${after.ratingAverage} (${after.ratingCount})`);
  } else {
    say("(nenhuma consulta pendente de avaliação; rode npm run seed para recriar a demonstração)");
  }

  await step("9. Segurança e LGPD: cada um só vê o que é seu, e o banco guarda tudo cifrado");
  const pedro = await login("pedro");
  say(`Outro paciente abrindo a consulta da Ana: ${(await api("GET", `/api/appointments/${booked.data.id}`, pedro)).status} (não existe para ele)`);
  say(`Outro paciente lendo o questionário da Ana: ${(await api("GET", `/api/patients/${anaId}/intake`, pedro)).status} (proibido)`);
  say(`Sem login: ${(await api("GET", "/api/appointments")).status} (precisa entrar)`);
  const db = await sql.connect({
    server: "localhost",
    port: Number(process.env.MSSQL_PORT || 1433),
    user: process.env.NUTRIMENTE_DB_USER,
    password: process.env.NUTRIMENTE_DB_PASSWORD,
    database: "NutriMente",
    options: { trustServerCertificate: true },
  });
  try {
    const raw = (await db.request().input("id", sql.BigInt, anaId)
      .query("SELECT cpf, birth_date FROM users WHERE id = @id")).recordset[0];
    const me = (await api("GET", "/api/me", ana)).data;
    say(`CPF da Ana direto no banco: ${raw.cpf.slice(0, 28)}…   (cifrado, AES-256)`);
    say(`CPF da Ana na tela dela:    ${me.cpfMasked}   (a API abre e ainda mascara)`);
  } finally {
    await db.close();
  }
  const exported = (await api("GET", "/api/me/export", ana)).data;
  const sections = Object.entries(exported).filter(([, v]) => Array.isArray(v) && v.length > 0).map(([k]) => k);
  say(`"Baixar meus dados" (LGPD): ${sections.length} seções com dados — ${sections.slice(0, 6).join(", ")}…`);

  await step("10. Limpeza: cancelar a consulta agendada ao vivo");
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
