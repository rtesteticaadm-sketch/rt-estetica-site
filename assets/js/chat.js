/* Assistente RT — atendimento guiado com respostas prontas.
   Não usa IA externa: responde as dúvidas básicas e encaminha para o WhatsApp
   com a mensagem já organizada. */
(() => {
  const fab = document.querySelector(".chat-fab");
  const box = document.getElementById("chat");
  const body = box.querySelector(".chat__body");
  const quick = box.querySelector(".chat__quick");
  const form = box.querySelector(".chat__form");
  const input = document.getElementById("chat-input");
  const waLink = window.RT_waLink || ((m) => `https://wa.me/5564992724619?text=${encodeURIComponent(m)}`);
  const track = (n, p) => window.RT_track && window.RT_track(n, p || {});
  const ctx = { interesses: new Set(), duvida: "" };
  let started = false;

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // horário de Morrinhos (America/Sao_Paulo)
  const aberto = () => {
    try {
      const p = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      const wd = p.find((x) => x.type === "weekday").value.replace(".", "");
      const h = parseInt(p.find((x) => x.type === "hour").value, 10);
      return !["sáb", "dom"].includes(wd) && h >= 9 && h < 19;
    } catch (e) { return true; }
  };

  const R = {
    servicos: {
      k: ["servico", "servicos", "o que voces fazem", "tratamento", "procedimento", "lista"],
      t: "Fazemos:\n• Depilação a laser\n• Limpeza de pele, botox, harmonização facial e tratamentos faciais\n• Estrias, aplicação de enzimas, varizes e vasinhos (conforme indicação), drenagem linfática\n• Massagem relaxante, esportiva e com drenagem\n• Design de sobrancelhas e procedimentos para cílios\n\nQual desses te interessa?",
      q: ["Depilação a laser", "Rosto", "Corpo", "Massagens", "Sobrancelhas e cílios"]
    },
    laser: {
      k: ["laser", "depila", "pelo", "virilha", "perna", "axila", "buco", "barba", "costas", "torax", "abdomen", "braco"],
      t: "A depilação a laser reduz os pelos aos poucos, sessão após sessão. Atendemos virilha, pernas completas ou meia perna, braços, faixa de barba, abdômen, tórax, costas e outras regiões.\n\nAntes de começar fazemos uma avaliação da sua pele e do seu pelo.",
      i: "Depilação a laser", q: ["Dói?", "Quantas sessões?", "Como me preparar", "Valores"]
    },
    dor: {
      k: ["doi", "dor", "machuca", "incomoda", "arde"],
      t: "A maioria das pessoas sente um calor rápido ou um leve beliscão. A intensidade é ajustada para o seu conforto durante a sessão.",
      q: ["Quantas sessões?", "Como me preparar", "Falar com a equipe"]
    },
    sessoes: {
      k: ["sessao", "sessoes", "quantas vezes", "quanto tempo", "resultado"],
      t: "Depende da área, da cor e espessura do pelo, do tipo de pele e de fatores hormonais. Na avaliação a gente te passa uma estimativa para o seu caso.",
      q: ["Valores", "Falar com a equipe"]
    },
    preparo: {
      k: ["preparar", "preparo", "raspar", "antes da sessao", "cuidado", "sol", "praia"],
      t: "Para o laser:\n• Raspe a área com lâmina antes da sessão\n• Não use cera nem pinça nas semanas anteriores\n• Venha com a pele limpa, sem cremes\n• Evite sol na região\n\nNo agendamento mandamos todas as orientações.",
      q: ["Agendar", "Endereço e horário"]
    },
    valores: {
      k: ["valor", "valores", "preco", "precos", "quanto custa", "custa", "pagamento", "parcela", "pix", "cartao", "promo"],
      t: "Os valores dependem do serviço, da área e do número de sessões. Nossa equipe te passa tudo certinho pelo WhatsApp, junto com as formas de pagamento.",
      wa: true
    },
    rosto: {
      k: ["rosto", "facial", "limpeza", "pele", "mancha", "acne", "cravo", "botox", "toxina", "ruga", "harmoniza", "preenchimento"],
      t: "Para o rosto temos limpeza de pele, tratamentos faciais, botox (toxina botulínica) e harmonização facial.\n\nBotox e harmonização são feitos por profissional habilitado e sempre depois de uma avaliação individual. Por aqui eu não consigo indicar procedimento, mas a equipe tira todas as suas dúvidas.",
      i: "Tratamentos faciais", q: ["Valores", "Falar com a equipe"]
    },
    corpo: {
      k: ["corpo", "corporal", "estria", "enzima", "gordura", "localizada", "variz", "varizes", "vasinho", "drenagem", "inchaco", "celulite"],
      t: "Para o corpo temos tratamento de estrias, aplicação de enzimas, drenagem linfática e tratamentos para varizes e vasinhos, conforme indicação e habilitação profissional.\n\nTudo começa com uma avaliação.",
      i: "Tratamentos corporais", q: ["Valores", "Falar com a equipe"]
    },
    massagem: {
      k: ["massagem", "relaxante", "esportiva", "relaxar", "estresse", "tensao", "dor nas costas"],
      t: "Temos massagem relaxante, massagem esportiva (ótima para quem treina) e massagem com drenagem. Os horários são marcados pelo WhatsApp.",
      i: "Massagem", q: ["Agendar", "Valores"]
    },
    olhar: {
      k: ["sobrancelha", "cilios", "cilio", "olhar", "design"],
      t: "Fazemos design de sobrancelhas pensado para o formato do seu rosto e procedimentos para cílios. Pergunte para a equipe quais técnicas estão disponíveis na agenda.",
      i: "Sobrancelhas e cílios", q: ["Agendar", "Valores"]
    },
    homens: {
      k: ["homem", "homens", "masculino", "marido", "namorado"],
      t: "Atendemos sim! Temos atendimento masculino para depilação a laser (barba, tórax, costas, abdômen e outras áreas), massagens e tratamentos de pele.",
      q: ["Depilação a laser", "Massagens", "Agendar"]
    },
    local: {
      k: ["onde", "endereco", "localizacao", "fica", "chegar", "horario", "abre", "funciona", "sabado", "domingo", "aberto"],
      t: "Ficamos na Rua Gumercindo Inocêncio de Oliveira, 408, Jardim Santa Fé, Morrinhos - GO.\n\nAtendemos de segunda a sexta, das 9h às 19h, sempre com horário marcado. Atendemos também quem vem da região e da zona rural.",
      q: ["Agendar", "Serviços"]
    },
    agendar: {
      k: ["agendar", "agenda", "marcar", "horario disponivel", "vaga", "quero fazer", "avaliacao"],
      t: "Perfeito! Vou te passar para a nossa equipe no WhatsApp com a sua mensagem já pronta.",
      wa: true
    }
  };
  const alias = {
    "Serviços": "servicos", "Depilação a laser": "laser", "Dói?": "dor", "Quantas sessões?": "sessoes",
    "Como me preparar": "preparo", "Valores": "valores", "Rosto": "rosto", "Corpo": "corpo",
    "Massagens": "massagem", "Sobrancelhas e cílios": "olhar", "Atende homens?": "homens",
    "Endereço e horário": "local", "Agendar": "agendar", "Falar com a equipe": "agendar"
  };
  const START = ["Serviços", "Depilação a laser", "Valores", "Dói?", "Endereço e horário", "Atende homens?", "Falar com a equipe"];

  const scroll = () => { body.scrollTop = body.scrollHeight; };
  const add = (text, who) => {
    const d = document.createElement("div");
    d.className = "msg msg--" + who;
    d.textContent = text;
    body.appendChild(d); scroll();
    return d;
  };
  const waMessage = () => {
    let m = "Olá! Vim pelo site da RT.";
    if (ctx.interesses.size) m += ` Tenho interesse em: ${[...ctx.interesses].join(", ")}.`;
    if (ctx.duvida) m += ` Minha dúvida: ${ctx.duvida}`;
    return m;
  };
  const addWa = (bubble) => {
    const a = document.createElement("a");
    a.className = "msg__wa"; a.target = "_blank"; a.rel = "noopener";
    a.href = waLink(waMessage());
    a.textContent = "Continuar no WhatsApp →";
    a.addEventListener("click", () => track("whatsapp_click", { origem: "assistente" }));
    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(a);
    if (!aberto()) {
      const n = document.createElement("small");
      n.style.display = "block"; n.style.marginTop = ".5rem"; n.style.opacity = ".8";
      n.textContent = "Estamos fora do horário agora. Pode mandar sua mensagem que respondemos no próximo dia útil a partir das 9h.";
      bubble.appendChild(n);
    }
    scroll();
  };
  const setQuick = (list) => {
    quick.innerHTML = "";
    (list || START).forEach((label) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => { add(label, "me"); answer(alias[label]); });
      quick.appendChild(b);
    });
  };
  const reply = (fn) => {
    const t = document.createElement("div");
    t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t); scroll();
    setTimeout(() => { t.remove(); fn(); }, 550);
  };
  const answer = (key) => {
    const r = R[key];
    if (!r) return fallback();
    if (r.i) { ctx.interesses.add(r.i); track("servico_interesse", { servico: r.i }); }
    track("chat_resposta", { tema: key });
    reply(() => {
      const b = add(r.t, "bot");
      if (r.wa || key === "agendar") addWa(b);
      setQuick(r.q ? [...r.q, ...(r.q.includes("Falar com a equipe") || r.wa ? [] : ["Falar com a equipe"])] : START);
    });
  };
  const fallback = () => reply(() => {
    const b = add("Essa eu prefiro deixar com a nossa equipe, para te responder com certeza. Já deixei sua dúvida pronta na mensagem:", "bot");
    addWa(b);
    setQuick(START);
  });
  const detect = (text) => {
    const n = norm(text);
    const order = ["valores", "agendar", "dor", "sessoes", "preparo", "homens", "local", "rosto", "corpo", "massagem", "olhar", "laser", "servicos"];
    for (const key of order) if (R[key].k.some((k) => n.includes(k))) return key;
    if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(n)) return "greet";
    return null;
  };

  const open = () => {
    box.hidden = false; fab.setAttribute("aria-expanded", true);
    if (!started) {
      started = true;
      add("Oi! Sou a assistente virtual da RT Estética Avançada.\nPosso tirar dúvidas rápidas sobre nossos serviços. Para agendar, eu te passo para a nossa equipe no WhatsApp.", "bot");
      setQuick(START);
    }
    track("chat_open");
    setTimeout(() => input.focus({ preventScroll: true }), 100);
  };
  const close = () => { box.hidden = true; fab.setAttribute("aria-expanded", false); fab.focus(); };

  fab.addEventListener("click", open);
  document.querySelectorAll("[data-open-chat]").forEach((b) => b.addEventListener("click", open));
  box.querySelector(".chat__close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) close(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add(text, "me");
    ctx.duvida = text.slice(0, 180);
    const key = detect(text);
    if (key === "greet") return reply(() => { add("Oi! Me conta: qual tratamento te interessa ou qual é a sua dúvida?", "bot"); setQuick(START); });
    key ? answer(key) : fallback();
  });
})();
