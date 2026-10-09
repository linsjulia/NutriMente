// =============================================================
// Dados de DEMONSTRAÇÃO do NutriMente
//
//   cd database/demo
//   npm install        (só na primeira vez)
//   npm run seed
//
// Precisa do back-end no ar (docker compose up -d --build).
//
// O que cria:
//   - 8 profissionais APROVADOS (4 nutricionistas, 4 psicólogos) com foto,
//     bio, valor, especialidades, horários de atendimento e avaliações
//   - 1 profissional PENDENTE (para mostrar a aprovação pelo admin)
//   - 6 pacientes, entre eles a paciente de demonstração (Ana Souza) com
//     consultas futuras (uma confirmada, com link de vídeo), no histórico e
//     2 planos de ação (nutrição e psicologia) já em andamento
//
// Pode rodar quantas vezes quiser: antes de criar, APAGA só as contas
// @nutrimente.demo (e as consultas/avaliações delas). Nada mais é tocado.
//
// Como funciona: usa a PRÓPRIA API para cadastrar, aprovar e agendar (assim
// valem as mesmas regras e senhas do uso real) e o banco direto só para o
// que a API não faz: confirmar e-mail sem abrir o Mailpit, consultas no
// PASSADO e avaliações (ainda sem rota na API).
// =============================================================

import sql from "mssql";

const API = process.env.API_URL ?? "http://localhost:8080";
const MAILPIT = `http://localhost:${process.env.MAILPIT_UI_PORT ?? 8025}`;
const DOMAIN = "nutrimente.demo";
const PASSWORD = "Demo1234";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
/** Fuso da agenda (o mesmo da API): consultas passadas às 10:00 daqui */
const UTC_OFFSET_HOURS = -3; // America/Sao_Paulo (sem horário de verão desde 2019)

// -------------------------------------------------------------
// Quem será criado
// -------------------------------------------------------------

/** Dias: 0 = domingo, 1 = segunda ... 6 = sábado */
const weekdays = (days, ranges) => days.flatMap((d) => ranges.map(([startTime, endTime]) => ({ dayOfWeek: d, startTime, endTime })));

const PROFESSIONALS = [
  {
    key: "camila", name: "Camila Rocha", type: "NUTRICIONISTA", gender: "FEMALE", photo: "/doctor/nutricionista3.jpg", price: 180,
    bio: "Nutricionista com foco em comportamento alimentar. Ajudo você a fazer as pazes com a comida, sem dietas restritivas e com metas que cabem na sua rotina.",
    specialties: ["Nutrição Comportamental", "Emagrecimento"],
    windows: weekdays([1, 2, 3, 4, 5], [["08:00", "12:00"], ["14:00", "18:00"]]),
    reviews: [
      [5, "A Camila é muito acolhedora. Pela primeira vez não me senti julgada pelo que como."],
      [5, "Plano simples de seguir e as metas semanais me ajudaram muito."],
      [4, "Gostei bastante, só achei a primeira consulta um pouco corrida."],
    ],
  },
  {
    key: "rafael", name: "Rafael Costa", type: "NUTRICIONISTA", gender: "MALE", photo: "/doctor/pfp.png", price: 150,
    bio: "Nutrição esportiva para quem treina: hipertrofia, emagrecimento e desempenho em corrida, com plano ajustado à sua rotina de treinos.",
    specialties: ["Nutrição Esportiva", "Nutrição Clínica"],
    windows: [...weekdays([1, 2, 3, 4, 5], [["07:00", "11:00"]]), ...weekdays([6], [["08:00", "12:00"]])],
    reviews: [
      [5, "Melhorei meu rendimento na corrida em poucas semanas."],
      [4, "Muito técnico e explica tudo com paciência."],
    ],
  },
  {
    key: "larissa", name: "Larissa Santos", type: "NUTRICIONISTA", gender: "FEMALE", photo: "/doctor/pfp3.png", price: 130,
    bio: "Atendo gestantes, crianças e famílias vegetarianas e veganas. Alimentação equilibrada em todas as fases da vida.",
    specialties: ["Vegetarianismo e Veganismo", "Nutrição Materno-Infantil"],
    windows: [...weekdays([2, 4], [["13:00", "19:00"]]), ...weekdays([6], [["09:00", "13:00"]])],
    reviews: [
      [5, "Me ajudou a montar uma alimentação vegana completa durante a gravidez."],
      [5, "Atenciosa e cheia de receitas práticas."],
    ],
  },
  {
    key: "helena", name: "Helena Martins", type: "NUTRICIONISTA", gender: "FEMALE", photo: "/doctor/nutricionista.jpg", price: 220,
    bio: "Mais de 20 anos de experiência em nutrição clínica: diabetes, hipertensão, colesterol e reeducação alimentar.",
    specialties: ["Nutrição Clínica", "Emagrecimento"],
    windows: weekdays([1, 3, 5], [["09:00", "17:00"]]),
    reviews: [
      [5, "Meus exames melhoraram muito depois do acompanhamento."],
      [5, "Profissional experiente e muito clara nas orientações."],
      [4, "Excelente, mas a agenda é bem concorrida."],
    ],
  },
  {
    key: "mariana", name: "Mariana Ribeiro", type: "PSICOLOGO", gender: "FEMALE", photo: "/doctor/pfp2.png", price: 200,
    bio: "Psicóloga clínica com abordagem cognitivo-comportamental. Trabalho com ansiedade, estresse e organização da rotina.",
    specialties: ["Ansiedade", "Terapia Cognitivo-Comportamental"],
    windows: weekdays([1, 2, 3, 4, 5], [["09:00", "12:00"], ["15:00", "20:00"]]),
    reviews: [
      [5, "As técnicas que aprendi nas sessões mudaram meu dia a dia."],
      [5, "Escuta atenta e muito profissional."],
    ],
  },
  {
    key: "lucas", name: "Lucas Ferreira", type: "PSICOLOGO", gender: "MALE", photo: "/doctor/doctor-pfp.png", price: 160, online: false, // sem cadastro no e-Psi: só presencial
    bio: "Psicólogo especializado em transtornos alimentares e imagem corporal. Atendo adolescentes e adultos, em parceria com nutricionistas.",
    specialties: ["Transtornos Alimentares", "Autoestima e Imagem Corporal"],
    windows: weekdays([1, 3, 5], [["14:00", "21:00"]]),
    reviews: [
      [5, "Foi essencial no meu tratamento junto com a nutricionista."],
      [4, "Muito respeitoso e paciente."],
    ],
  },
  {
    key: "juliana", name: "Juliana Alves", type: "PSICOLOGO", gender: "FEMALE", photo: "/doctor/psicologo2.jpg", price: 180,
    bio: "Psicologia da saúde: acompanhamento de pessoas com doenças crônicas, depressão e mudanças de hábitos.",
    specialties: ["Depressão", "Psicologia da Saúde"],
    windows: weekdays([2, 4], [["08:00", "18:00"]]),
    reviews: [[5, "Me senti acolhida desde a primeira sessão."]],
  },
  {
    key: "beatriz", name: "Beatriz Lima", type: "PSICOLOGO", gender: "FEMALE", photo: "/doctor/psicologo3.jpg", price: 140,
    bio: "Atendimento à noite para quem trabalha durante o dia. Ansiedade, autoestima e relacionamento com o corpo.",
    specialties: ["Ansiedade", "Autoestima e Imagem Corporal"],
    windows: weekdays([1, 2, 3, 4], [["18:00", "22:00"]]),
    reviews: [
      [4, "Horário à noite salvou minha rotina."],
      [5, "Ótima profissional, recomendo."],
    ],
  },
];

/** Fica PENDENTE: aparece na fila de aprovação do admin */
const PENDING = {
  key: "andre", name: "André Nogueira", type: "PSICOLOGO", gender: "MALE",
  bio: "Psicólogo recém-chegado à plataforma, com foco em ansiedade em universitários.",
};

const PATIENTS = [
  { key: "ana", name: "Ana Souza", gender: "FEMALE", birthDate: "1995-04-12", phone: "11987651234", photo: "/patient/paciente2.png" },
  { key: "pedro", name: "Pedro Henrique Lima", gender: "MALE", birthDate: "1988-09-30", phone: "21998762345" },
  { key: "fernanda", name: "Fernanda Oliveira", gender: "FEMALE", birthDate: "1992-01-18", phone: "31997653456" },
  { key: "gustavo", name: "Gustavo Pereira", gender: "MALE", birthDate: "1985-06-05", phone: "41996544567" },
  { key: "patricia", name: "Patrícia Gomes", gender: "FEMALE", birthDate: "1979-11-22", phone: "51995435678" },
  { key: "rodrigo", name: "Rodrigo Almeida", gender: "MALE", birthDate: "2000-02-14", phone: "61994326789" },
];

const emailOf = (key) => `${key}@${DOMAIN}`;

// -------------------------------------------------------------
// Utilidades
// -------------------------------------------------------------

const log = (message) => console.log(`  ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Chama a API. Se ela responder 429 (limite de tentativas por minuto nas
 * rotas de login/cadastro), espera o tempo pedido em Retry-After e tenta de novo.
 */
async function api(method, path, { token, body } = {}) {
  for (;;) {
    const response = await fetch(API + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 429) {
      const wait = Number(response.headers.get("Retry-After") ?? 30);
      log(`… limite de tentativas da API atingido, aguardando ${wait}s`);
      await sleep(wait * 1000 + 500);
      continue;
    }
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const errors = data?.errors ? ` ${JSON.stringify(data.errors)}` : "";
      throw new Error(`${method} ${path} -> ${response.status} ${data?.detail ?? ""}${errors}`);
    }
    return data;
  }
}

const login = async (email, password = PASSWORD) =>
  (await api("POST", "/api/auth/login", { body: { email, password } })).accessToken;

/** CPF válido e único (dígitos verificadores calculados) */
const usedCpfs = new Set();
function randomCpf() {
  for (;;) {
    const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    const check = (len) => {
      const sum = d.slice(0, len).reduce((acc, digit, i) => acc + digit * (len + 1 - i), 0);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    d.push(check(9));
    d.push(check(10));
    const cpf = d.join("");
    if (!/^(\d)\1{10}$/.test(cpf) && !usedCpfs.has(cpf)) {
      usedCpfs.add(cpf);
      return cpf;
    }
  }
}

/** Número de conselho aleatório: CRN "3-12345" (regiões 1 a 11) ou CRP "06/123456" (01 a 24) */
function randomCouncil(type) {
  const n = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  return type === "NUTRICIONISTA"
    ? `${n(1, 11)}-${n(10000, 99999)}`
    : `${String(n(1, 24)).padStart(2, "0")}/${n(100000, 999999)}`;
}

/** Celular aleatório válido (DDD 11, 9 na frente) para quem não tem um definido */
const randomPhone = () => `119${String(10000000 + Math.floor(Math.random() * 89999999))}`;

/**
 * Um horário no PASSADO que respeita a agenda do profissional: volta a partir
 * de "daysAgo" até cair num dia em que ele atende e usa a hora de início da
 * janela daquele dia (+ "offset" horas, sem passar do fim). Assim o histórico
 * nunca mostra consulta num domingo para quem não atende aos domingos.
 * "used" evita que o mesmo paciente tenha duas consultas no mesmo horário.
 */
function pastSlot(professional, daysAgo, offset, patientId, used) {
  for (let back = daysAgo; ; back++) {
    const local = new Date(Date.now() + UTC_OFFSET_HOURS * 3600_000);
    local.setUTCDate(local.getUTCDate() - back);
    const window = professional.windows.find((w) => w.dayOfWeek === local.getUTCDay());
    if (!window) continue;
    const start = Number(window.startTime.slice(0, 2));
    const lastStart = Number(window.endTime.slice(0, 2)) - 1;
    const hour = Math.min(start + offset, lastStart);
    const startsAt = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour - UTC_OFFSET_HOURS));
    const key = `${patientId}|${startsAt.toISOString()}`;
    if (used.has(key)) continue;
    used.add(key);
    return startsAt;
  }
}

// -------------------------------------------------------------
// Etapas
// -------------------------------------------------------------

async function checkServices() {
  try {
    const health = await fetch(`${API}/actuator/health`).then((r) => r.json());
    if (health.status !== "UP") throw new Error(health.status);
  } catch (error) {
    throw new Error(`A API não está respondendo em ${API}. Rode "docker compose up -d --build" e espere ficar healthy. (${error.message})`);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD precisam estar no .env (o admin aprova os profissionais).");
  }
}

/** Apaga as contas @nutrimente.demo e tudo o que depende delas */
async function removePreviousDemo(db) {
  const ids = (await db.query(`SELECT id FROM users WHERE email LIKE '%@${DOMAIN}'`)).recordset.map((r) => r.id);
  if (ids.length === 0) {
    log("nenhum dado de demonstração anterior");
    return;
  }
  const list = ids.join(",");
  const inDemo = `(${list})`;
  // Ordem importa: primeiro o que aponta para consultas e pessoas, por último as contas
  await db.query(`
    DELETE FROM reviews       WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo};
    DELETE FROM appointment_records WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo});
    DELETE FROM appointment_screenings WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo});
    DELETE FROM refunds       WHERE payment_id IN (SELECT p.id FROM payments p JOIN appointments a ON a.id = p.appointment_id
                                                   WHERE a.patient_id IN ${inDemo} OR a.professional_id IN ${inDemo});
    DELETE FROM payments      WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo});
    DELETE FROM action_plans  WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo};
    DELETE FROM conversations WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo};
    DELETE FROM appointments  WHERE patient_id IN ${inDemo} OR professional_id IN ${inDemo};
    DELETE FROM users         WHERE id IN ${inDemo};
  `);
  log(`${ids.length} contas de demonstração anteriores removidas`);
}

/** Confirma o e-mail (sem precisar abrir o Mailpit) e coloca a foto */
async function verifyAndSetPhoto(db, email, photo) {
  await db.request()
    .input("email", sql.NVarChar, email)
    .input("photo", sql.NVarChar, photo ?? null)
    .query("UPDATE users SET email_verified = 1, photo_url = @photo WHERE email = @email");
  return (await db.request().input("email", sql.NVarChar, email).query("SELECT id FROM users WHERE email = @email"))
    .recordset[0].id;
}

async function createPatients(db) {
  const created = {};
  for (const p of PATIENTS) {
    const email = emailOf(p.key);
    await api("POST", "/api/auth/register/patient", {
      body: {
        name: p.name, email, password: PASSWORD, cpf: randomCpf(), birthDate: p.birthDate,
        telephone: p.phone ?? randomPhone(), gender: p.gender, acceptTerms: true, acceptHealthData: true,
      },
    });
    created[p.key] = { ...p, email, id: await verifyAndSetPhoto(db, email, p.photo) };
    log(`paciente ${p.name}`);
  }
  return created;
}

async function createProfessionals(db, specialtyIdByName) {
  const created = {};
  for (const p of [...PROFESSIONALS, PENDING]) {
    const email = emailOf(p.key);
    await api("POST", "/api/auth/register/professional", {
      body: {
        name: p.name, email, password: PASSWORD, cpf: randomCpf(), birthDate: "1984-03-10",
        telephone: randomPhone(), professionalType: p.type, documentProfessional: randomCouncil(p.type),
        bio: p.bio, acceptTerms: true,
      },
    });
    const id = await verifyAndSetPhoto(db, email, p.photo);
    if (p.price) {
      const token = await login(email);
      await api("PUT", "/api/me/professional-profile", {
        token,
        body: {
          bio: p.bio,
          consultationPrice: p.price,
          // Cadastro no e-Psi / e-Nutricionista: sem ele, só consulta presencial
          telehealthRegistered: p.online ?? true,
          specialtyIds: p.specialties.map((name) => {
            const sid = specialtyIdByName[`${p.type}:${name}`];
            if (!sid) throw new Error(`Especialidade "${name}" não encontrada (rodou o seed do banco?)`);
            return sid;
          }),
        },
      });
      await api("PUT", "/api/me/availability", { token, body: { windows: p.windows } });
      created[p.key] = { ...p, email, id, token };
    } else {
      created[p.key] = { ...p, email, id };
    }
    log(`profissional ${p.name}${p.price ? "" : " (pendente)"}`);
  }
  return created;
}

async function approve(professionals) {
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  for (const p of Object.values(professionals)) {
    if (!p.price) continue; // o pendente fica para a demonstração
    await api("PATCH", `/api/admin/professionals/${p.id}/verification`, { token: admin, body: { status: "APPROVED" } });
  }
  log(`${PROFESSIONALS.length} profissionais aprovados pelo admin`);
}

/**
 * Consultas PASSADAS (já realizadas) com avaliação: a API não deixa agendar
 * no passado, então entram direto no banco. Também atualiza a nota média.
 */
async function createHistory(db, professionals, patients) {
  // Pacientes que avaliam (a Ana entra em casos específicos abaixo)
  const reviewers = ["pedro", "fernanda", "gustavo", "patricia", "rodrigo"].map((k) => patients[k]);
  let reviewCount = 0;
  const used = new Set();

  const insertCompleted = async (patient, professional, daysAgo, offset) => {
    const startsAt = pastSlot(professional, daysAgo, offset, patient.id, used);
    const endsAt = new Date(startsAt.getTime() + 50 * 60_000);
    const createdAt = new Date(startsAt.getTime() - 3 * 24 * 3600_000);
    const result = await db.request()
      .input("patient", sql.BigInt, patient.id)
      .input("professional", sql.BigInt, professional.id)
      .input("startsAt", sql.DateTime2, startsAt)
      .input("endsAt", sql.DateTime2, endsAt)
      .input("price", sql.Decimal(10, 2), professional.price)
      .input("createdAt", sql.DateTime2, createdAt)
      .query(`INSERT INTO appointments (patient_id, professional_id, starts_at, ends_at, status, modality, price, created_at, updated_at)
              OUTPUT INSERTED.id
              VALUES (@patient, @professional, @startsAt, @endsAt, 'COMPLETED', 'ONLINE', @price, @createdAt, @endsAt)`);
    return { id: result.recordset[0].id, endsAt };
  };

  const insertReview = async (appointment, patient, professional, rating, comment) => {
    await db.request()
      .input("appointment", sql.BigInt, appointment.id)
      .input("patient", sql.BigInt, patient.id)
      .input("professional", sql.BigInt, professional.id)
      .input("rating", sql.TinyInt, rating)
      .input("comment", sql.NVarChar, comment)
      .input("createdAt", sql.DateTime2, new Date(appointment.endsAt.getTime() + 3600_000))
      .query(`INSERT INTO reviews (appointment_id, patient_id, professional_id, rating, comment, created_at)
              VALUES (@appointment, @patient, @professional, @rating, @comment, @createdAt)`);
    reviewCount++;
  };

  for (const [index, def] of PROFESSIONALS.entries()) {
    const professional = professionals[def.key];
    for (const [i, [rating, comment]] of def.reviews.entries()) {
      const patient = reviewers[(index + i) % reviewers.length];
      const appointment = await insertCompleted(patient, professional, 10 + i * 7, i + 1);
      await insertReview(appointment, patient, professional, rating, comment);
    }
  }

  // Histórico da paciente de demonstração: uma consulta avaliada e uma sem
  // avaliação (para mostrar "Avaliar" quando a tela existir)
  const ana = patients.ana;
  const withCamila = await insertCompleted(ana, professionals.camila, 21, 2);
  await insertReview(withCamila, ana, professionals.camila, 5, "Primeira consulta incrível, saí com um plano possível de seguir!");
  const withMariana = await insertCompleted(ana, professionals.mariana, 6, 1);

  // Registro das consultas (prontuário). Pela API, e não direto no banco:
  // a API grava o texto criptografado, e só ela tem a chave.
  await api("PUT", `/api/appointments/${withCamila.id}/record`, {
    token: professionals.camila.token,
    body: {
      privateNotes: "Primeira consulta. Queixa: beliscar à noite e pular o café da manhã. Sem restrições alimentares. "
        + "Relata ansiedade no trabalho; sugerido acompanhamento psicológico.",
      patientGuidance: "1. Tomar café da manhã todos os dias (pão integral, ovo e fruta).\n"
        + "2. Beber 2 L de água: deixe a garrafa à vista na mesa.\n3. Jantar até as 20h.",
    },
  });
  await api("PUT", `/api/appointments/${withMariana.id}/record`, {
    token: professionals.mariana.token,
    body: {
      privateNotes: "Sessão 1. Ansiedade ligada à rotina de trabalho, com episódios de comer emocional à noite. "
        + "Boa vinculação. Plano: registro de emoções e técnicas de respiração.",
      patientGuidance: "Anote no app, ao fim do dia, como foi seu humor. Quando sentir ansiedade: respiração 4-7-8, três vezes.",
    },
  });

  // Nota média e quantidade de avaliações de cada profissional
  await db.query(`
    UPDATE p SET rating_average = r.avg_rating, rating_count = r.total
    FROM professionals p
    JOIN (SELECT professional_id, CAST(AVG(CAST(rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) AS avg_rating, COUNT(*) AS total
          FROM reviews GROUP BY professional_id) r ON r.professional_id = p.user_id
    WHERE p.user_id IN (${Object.values(professionals).map((p) => p.id).join(",")})
  `);
  log(`consultas realizadas, ${reviewCount} avaliações e 2 registros de consulta da Ana`);
}

/** Primeiro horário livre do profissional a pelo menos "hoursAhead" horas daqui */
async function slotAfter(professional, hoursAhead, taken) {
  const days = await api("GET", `/api/professionals/${professional.id}/slots?days=21`);
  const limit = Date.now() + hoursAhead * 3600_000;
  const slot = days.flatMap((d) => d.slots).find((s) => new Date(s.startsAt).getTime() > limit && !taken.has(s.startsAt));
  if (!slot) throw new Error(`Sem horário livre para ${professional.name} depois de ${hoursAhead} h`);
  taken.add(slot.startsAt);
  return slot.startsAt;
}

/** Consultas FUTURAS, pelo caminho normal da API (com e-mails e regras de agenda) */
async function createUpcoming(professionals, patients) {
  const taken = new Set();
  const tokens = {};
  const tokenOf = async (key) => (tokens[key] ??= await login(patients[key].email));
  const book = async (patientKey, professionalKey, hoursAhead, modality = "ONLINE", notes = null) => {
    const startsAt = await slotAfter(professionals[professionalKey], hoursAhead, taken);
    return api("POST", "/api/appointments", {
      token: await tokenOf(patientKey),
      body: { professionalId: professionals[professionalKey].id, startsAt, modality, notes },
    });
  };

  // Paciente de demonstração: uma confirmada (com link de vídeo) e uma agendada
  const anaCamila = await book("ana", "camila", 48, "ONLINE", "Retorno: quero ajustar o plano para a rotina de trabalho.");
  await api("POST", `/api/appointments/${anaCamila.id}/confirm`, { token: professionals.camila.token });
  await book("ana", "mariana", 96, "ONLINE", "Primeira sessão.");

  // Agenda movimentada da profissional de demonstração (Camila)
  await book("pedro", "camila", 50, "PRESENCIAL", "Primeira consulta, quero emagrecer com saúde.");
  await book("fernanda", "camila", 70);
  await book("gustavo", "camila", 120);
  // Outros profissionais com consultas marcadas
  await book("patricia", "helena", 48, "PRESENCIAL");
  await book("gustavo", "mariana", 72);
  await book("rodrigo", "rafael", 30);
  log("8 consultas futuras agendadas (1 confirmada)");
}

/** Data local (AAAA-MM-DD) de "daysAgo" dias atrás, no fuso da agenda */
function localDate(daysAgo = 0) {
  const d = new Date(Date.now() + UTC_OFFSET_HOURS * 3600_000);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Planos de ação da paciente de demonstração (pela API, como o profissional
 * e a paciente fariam nas telas):
 * - Camila (nutrição): metas, cardápio e checklist, com os últimos 6 dias já
 *   marcados e HOJE em aberto (para marcar ao vivo na apresentação), e peso
 * - Mariana (psicologia): rotina de autocuidado. Os dois juntos mostram o
 *   acompanhamento integrado nutrição + psicologia
 */
async function createPlans(professionals, patients) {
  const ana = patients.ana;
  const anaToken = await login(ana.email);
  const camila = professionals.camila;
  const mariana = professionals.mariana;

  const nutrition = await api("POST", "/api/plans", {
    token: camila.token,
    body: {
      patientId: ana.id,
      title: "Reeducação alimentar sem neura",
      description: "Comer com regularidade, mais fibras e água, sem cortar nada que você gosta. Revisamos juntas a cada 15 dias.",
      startDate: localDate(6),
      endDate: localDate(-60),
      goals: [
        { description: "Perder 3 kg com saúde", targetValue: 3, unit: "kg", dueDate: localDate(-60) },
        { description: "Comer frutas em 2 refeições por dia" },
        { description: "Caminhar 30 minutos, 3 vezes por semana" },
      ],
      meals: [
        { mealType: "CAFE_DA_MANHA", mealTime: "07:30", description: "Pão integral com ovo mexido e uma fruta (mamão ou banana)" },
        { mealType: "LANCHE_MANHA", mealTime: "10:00", description: "Iogurte natural com aveia" },
        { mealType: "ALMOCO", mealTime: "12:30", description: "Metade do prato com salada e legumes, arroz, feijão e uma proteína grelhada" },
        { mealType: "LANCHE_TARDE", mealTime: "16:00", description: "Uma fruta e um punhado de castanhas" },
        { mealType: "JANTAR", mealTime: "19:30", description: "Sopa de legumes com frango desfiado ou omelete com salada" },
      ],
      checklist: [
        { description: "Beber 2 litros de água", frequency: "DAILY" },
        { description: "Comer pelo menos 2 frutas", frequency: "DAILY" },
        { description: "Não pular o café da manhã", frequency: "DAILY" },
        { description: "Planejar as refeições da semana", frequency: "WEEKLY" },
        { description: "Fazer exame de sangue de rotina", frequency: "ONCE" },
      ],
    },
  });

  // Marcações dos últimos 6 dias (hoje fica em aberto). 1 = fez, 0 = não fez
  const pattern = {
    "Beber 2 litros de água": [1, 1, 0, 1, 1, 1],
    "Comer pelo menos 2 frutas": [1, 0, 1, 1, 0, 1],
    "Não pular o café da manhã": [1, 1, 1, 1, 1, 1],
  };
  for (const item of nutrition.checklist) {
    const marks = pattern[item.description];
    if (!marks) continue;
    for (const [i, done] of marks.entries()) {
      await api("PUT", `/api/plans/${nutrition.summary.id}/checklist/${item.id}/${localDate(6 - i)}`, {
        token: anaToken,
        body: { completed: done === 1 },
      });
    }
  }
  const weekly = nutrition.checklist.find((i) => i.frequency === "WEEKLY");
  await api("PUT", `/api/plans/${nutrition.summary.id}/checklist/${weekly.id}/${localDate(2)}`, { token: anaToken, body: { completed: true } });
  const fruitGoal = nutrition.goals.find((g) => g.description.startsWith("Comer frutas"));
  await api("PUT", `/api/plans/${nutrition.summary.id}/goals/${fruitGoal.id}`, { token: anaToken, body: { completed: true } });

  // Progresso: pesagens da paciente e uma observação da nutricionista
  await api("POST", `/api/plans/${nutrition.summary.id}/progress`, {
    token: anaToken, body: { recordDate: localDate(6), weightKg: 72.4, moodScore: 3, notes: "Começando! Um pouco ansiosa com a mudança." },
  });
  await api("POST", `/api/plans/${nutrition.summary.id}/progress`, {
    token: anaToken, body: { recordDate: localDate(1), weightKg: 71.6, moodScore: 4, notes: "Semana boa, só esqueci a água num dia corrido." },
  });
  await api("POST", `/api/plans/${nutrition.summary.id}/progress`, {
    token: camila.token, body: { recordDate: localDate(1), notes: "Ótima adesão ao café da manhã. Próximo foco: frutas no lanche da tarde." },
  });

  const psychology = await api("POST", "/api/plans", {
    token: mariana.token,
    body: {
      patientId: ana.id,
      title: "Rotina de autocuidado",
      description: "Pequenos hábitos para reconhecer e lidar com a ansiedade no dia a dia.",
      startDate: localDate(4),
      goals: [{ description: "Identificar 3 gatilhos de ansiedade" }, { description: "Dormir antes da meia-noite em 5 dias da semana" }],
      checklist: [
        { description: "Respiração guiada (5 minutos)", frequency: "DAILY" },
        { description: "Escrever no diário de emoções", frequency: "DAILY" },
      ],
    },
  });
  for (const item of psychology.checklist) {
    const marks = item.description.startsWith("Respiração") ? [1, 1, 0, 1] : [1, 0, 1, 1];
    for (const [i, done] of marks.entries()) {
      await api("PUT", `/api/plans/${psychology.summary.id}/checklist/${item.id}/${localDate(4 - i)}`, {
        token: anaToken,
        body: { completed: done === 1 },
      });
    }
  }
  log("2 planos de ação para a Ana (nutrição e psicologia), com checklist e progresso dos últimos dias");
}

async function clearMailpit() {
  try {
    await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
    log("caixa do Mailpit limpa (a demonstração começa sem e-mails antigos)");
  } catch {
    log("Mailpit não respondeu; os e-mails do cadastro continuam lá (não atrapalha)");
  }
}

// -------------------------------------------------------------

async function main() {
  console.log("\nNutriMente: criando dados de demonstração\n");
  await checkServices();
  const db = await sql.connect({
    server: "localhost",
    port: Number(process.env.MSSQL_PORT || 1433),
    user: process.env.NUTRIMENTE_DB_USER,
    password: process.env.NUTRIMENTE_DB_PASSWORD,
    database: "NutriMente",
    options: { trustServerCertificate: true },
  });
  try {
    console.log("1. Limpando a demonstração anterior");
    await removePreviousDemo(db);

    const specialties = await api("GET", "/api/specialties");
    const specialtyIdByName = Object.fromEntries(specialties.map((s) => [`${s.type}:${s.name}`, s.id]));

    console.log("2. Pacientes");
    const patients = await createPatients(db);
    console.log("3. Profissionais (perfil, especialidades e horários)");
    const professionals = await createProfessionals(db, specialtyIdByName);
    console.log("4. Aprovação pelo admin");
    await approve(professionals);
    console.log("5. Histórico: consultas realizadas e avaliações");
    await createHistory(db, professionals, patients);
    console.log("6. Próximas consultas");
    await createUpcoming(professionals, patients);
    console.log("7. Planos de ação");
    await createPlans(professionals, patients);
    console.log("8. Mailpit");
    await clearMailpit();
  } finally {
    await db.close();
  }

  console.log(`
Pronto! Contas para a apresentação (senha de todas: ${PASSWORD})

  Paciente      ana@${DOMAIN}       consultas, histórico e 2 planos de ação (checklist de hoje em aberto)
  Profissional  camila@${DOMAIN}    nutricionista com agenda movimentada
  Psicóloga     mariana@${DOMAIN}
  Admin         ${ADMIN_EMAIL}  (senha do .env) -> "${PENDING.name}" aguardando aprovação

Site: http://localhost:3000   E-mails: ${MAILPIT}
`);
}

main().catch((error) => {
  console.error(`\nFalhou: ${error.message}\n`);
  process.exit(1);
});
