/* Assistente RT — atendimento guiado.
   Não usa IA externa: entende as dúvidas mais comuns (com erros de digitação),
   responde de forma direta, coleta nome, serviço e melhor período e
   entrega tudo pronto para a equipe no WhatsApp. */
(() => {
  const fab = document.querySelector(".chat-fab");
  const box = document.getElementById("chat");
  if (!fab || !box) return;
  const body = box.querySelector(".chat__body");
  const quick = box.querySelector(".chat__quick");
  const form = box.querySelector(".chat__form");
  const input = document.getElementById("chat-input");
  const waLink = window.RT_waLink || ((m) => `https://wa.me/5564992724619?text=${encodeURIComponent(m)}`);
  const track = (n, p) => window.RT_track && window.RT_track(n, p || {});
  const ctx = { nome: "", interesses: new Set(), duvidas: [], periodo: "", etapa: null, ultimo: null };
  let started = false;

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const cap = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

  const aberto = () => {
    try {
      const p = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      const wd = p.find((x) => x.type === "weekday").value.replace(".", "");
      const h = parseInt(p.find((x) => x.type === "hour").value, 10);
      return !["sáb", "dom"].includes(wd) && h >= 9 && h < 19;
    } catch (e) { return true; }
  };

  /* ---------- base de respostas ---------- */
  // k: palavras-chave (sem acento). i: interesse registrado. q: próximas sugestões.
  const R = {
    servicos: { k: ["servico", "servicos", "o que voces fazem", "o que fazem", "tratamentos", "procedimentos", "lista", "cardapio", "opcoes"],
      t: "Na RT você encontra:\n• <b>Depilação a laser</b>, para mulheres e homens\n• <b>Rosto</b>: limpeza de pele, toxina botulínica, harmonização e tratamentos faciais\n• <b>Corpo</b>: estrias, enzimas, varizes (conforme indicação) e drenagem linfática\n• <b>Massagens</b>: relaxante, esportiva e com drenagem\n• <b>Olhar</b>: design de sobrancelhas e cílios\n\nQual desses você quer conhecer?",
      q: ["Depilação a laser", "Rosto", "Corpo", "Massagens", "Sobrancelhas e cílios"] },
    laser: { k: ["laser", "depilacao", "depilar", "pelo", "pelos", "virilha", "perna", "axila", "buco", "barba", "costas", "torax", "abdomen", "braco", "intima", "foliculite", "encravado", "gilete", "lamina", "cera"],
      t: "A depilação a laser reduz os pelos aos poucos, sessão a sessão, e ajuda muito quem sofre com pelo encravado e foliculite.\n\nÁreas: virilha completa, pernas completas ou meia perna, braços, axilas, faixa de barba, abdômen, tórax, costas e outras regiões.\n\nTudo começa com uma <b>avaliação</b> da sua pele e do seu pelo.",
      i: "Depilação a laser", q: ["Dói?", "Quantas sessões?", "Como me preparar", "Valores", "Quero agendar"] },
    dor: { k: ["doi", "dor", "machuca", "incomoda", "arde", "queima", "sensivel"],
      t: "A sensação é de um calor rápido, tipo um beliscãozinho. Áreas mais sensíveis, como a virilha, incomodam um pouco mais, mas a intensidade é ajustada para o seu conforto. E com menos pelo a cada sessão, fica cada vez mais tranquilo.",
      q: ["Quantas sessões?", "Como me preparar", "Quero agendar"] },
    sessoes: { k: ["sessao", "sessoes", "quantas vezes", "quanto tempo", "resultado", "definitivo", "definitiva", "intervalo", "de quanto em quanto"],
      t: "O número de sessões depende da área, da cor e espessura do pelo, do tipo de pele e de fatores hormonais. O intervalo entre as sessões também varia por área, e a equipe define o ideal para você.\n\nNa avaliação a gente te passa uma estimativa para o seu caso.",
      q: ["Valores", "Dói?", "Quero agendar"] },
    duracao: { k: ["demora", "dura quanto", "duracao", "tempo de sessao", "quanto tempo leva", "rapido"],
      t: "Depende da área: regiões pequenas, como axila e buço, são rapidinhas. Áreas grandes, como pernas completas, levam mais tempo. A equipe te informa a duração exata quando agendar.",
      q: ["Quero agendar", "Valores"] },
    preparo: { k: ["preparar", "preparo", "raspar", "antes da sessao", "antes", "posso ir", "creme", "desodorante"],
      t: "Para o laser:\n• Raspe a área com lâmina 1 a 2 dias antes\n• Nada de cera, pinça ou depilador nas semanas anteriores\n• Venha com a pele limpa, sem cremes ou desodorante na área\n• Evite sol e bronzeamento nos dias antes\n\nNa confirmação do horário a equipe reforça tudo.",
      q: ["Cuidados depois", "Quero agendar"] },
    depois: { k: ["depois da sessao", "pos sessao", "pos laser", "apos", "cuidados", "vermelh", "bolinha", "irritou", "academia", "piscina"],
      t: "Depois da sessão:\n• Protetor solar todos os dias na área tratada\n• Evite sol, esfoliação e calor intenso por alguns dias\n• Vermelhidão leve e bolinhas ao redor do pelo podem aparecer e costumam passar rápido\n\nQualquer reação diferente, fale com a equipe.",
      q: ["Quero agendar", "Falar com a equipe"] },
    sol: { k: ["sol", "praia", "verao", "bronze", "bronzeada", "clube", "piscina no sol"],
      t: "Dá para fazer laser no verão, sim, com cuidado: protetor solar diário e nada de bronzeamento nos dias antes e depois das sessões. Quem começa agora chega ao fim do verão bem mais tranquila.",
      q: ["Como me preparar", "Quero agendar"] },
    pele: { k: ["pele negra", "pele morena", "morena", "negra", "parda", "pele escura", "fototipo", "pelo branco", "pelo loiro", "loiro", "ruivo", "branco"],
      t: "Cada pele e cada pelo pedem parâmetros diferentes. Pelos muito claros, brancos ou ruivos costumam responder menos ao laser. Por isso a <b>avaliação</b> é tão importante: é nela que a gente vê se o laser é indicado e como ajustar para você.",
      q: ["Quero agendar", "Falar com a equipe"] },
    gestante: { k: ["gravida", "gestante", "gestacao", "gravidez", "amamentando", "amamentacao"],
      t: "Durante a gestação, a maioria dos procedimentos estéticos, incluindo o laser, costuma ser adiada por precaução. Na amamentação, vale conversar com a equipe e com o seu médico. Massagens podem ter versões adaptadas: pergunte para a equipe.",
      q: ["Falar com a equipe"] },
    menor: { k: ["menor", "menor de idade", "adolescente", "filha", "filho", "15 anos", "16 anos", "17 anos"],
      t: "Para menores de idade, as condições são combinadas direto com a equipe, junto com o responsável. Me chama no WhatsApp que a gente explica certinho.",
      q: ["Falar com a equipe"] },
    valores: { k: ["valor", "valores", "preco", "precos", "quanto custa", "custa", "quanto e", "quanto fica", "promocao", "promo", "pacote", "desconto", "orcamento"],
      t: "Os valores dependem do serviço, da área e do número de sessões, e às vezes temos pacotes especiais. A equipe te passa tudo certinho pelo WhatsApp, junto com as formas de pagamento.",
      q: ["Formas de pagamento", "Quero agendar"], wa: true },
    pagamento: { k: ["pagamento", "pagar", "parcela", "parcelar", "pix", "cartao", "boleto", "crediario", "credito", "debito", "a prazo"],
      t: "Não precisa ter cartão de crédito: na RT tem <b>crediário próprio</b>, boleto e outras formas de pagamento. A equipe te mostra a condição que funciona melhor para você.",
      q: ["Valores", "Quero agendar"] },
    rosto: { k: ["rosto", "facial", "limpeza", "limpeza de pele", "mancha", "acne", "espinha", "cravo", "poro", "oleosidade", "pele do rosto"],
      t: "Para o rosto temos <b>limpeza de pele</b> e tratamentos faciais, pensados para o seu tipo de pele, além de toxina botulínica e harmonização facial.",
      i: "Tratamentos faciais", q: ["Botox", "Harmonização", "Quero agendar"] },
    botox: { k: ["botox", "toxina", "botulinica", "ruga", "rugas", "linha de expressao", "pe de galinha", "testa"],
      t: "A toxina botulínica (botox) suaviza linhas de expressão. É feita por <b>profissional habilitado</b> e sempre depois de uma avaliação individual, que define se é indicado e em quais pontos.\n\nPor aqui eu não indico procedimento, mas a equipe tira todas as suas dúvidas.",
      i: "Toxina botulínica", q: ["Valores", "Quero agendar"] },
    harmo: { k: ["harmonizacao", "harmonizar", "preenchimento", "labio", "boca", "queixo", "mandibula", "olheira"],
      t: "A harmonização facial é planejada para valorizar os traços que você já tem. É feita por <b>profissional habilitado</b>, depois de uma avaliação individual.\n\nA equipe explica as opções e o que faz sentido para o seu rosto.",
      i: "Harmonização facial", q: ["Valores", "Quero agendar"] },
    estrias: { k: ["estria", "estrias", "marcas", "cicatriz"],
      t: "O tratamento de estrias é feito com protocolo personalizado para melhorar textura, tom e uniformidade da pele. O número de sessões depende do tipo e do tempo da estria, e isso é avaliado antes de começar.",
      i: "Tratamento de estrias", q: ["Valores", "Quero agendar"] },
    corpo: { k: ["corpo", "corporal", "enzima", "enzimas", "gordura", "localizada", "barriga", "culote", "flacidez", "celulite"],
      t: "Para o corpo temos aplicação de enzimas, tratamento de estrias, drenagem linfática e tratamentos para varizes, sempre conforme indicação e avaliação profissional.",
      i: "Tratamentos corporais", q: ["Estrias", "Varizes", "Drenagem", "Quero agendar"] },
    varizes: { k: ["variz", "varizes", "vasinho", "vasinhos", "microvarizes", "perna roxa"],
      t: "Fazemos tratamento para varizes e vasinhos <b>conforme indicação e habilitação profissional</b>. Antes de tudo é feita uma avaliação para ver se o seu caso é indicado para o procedimento.",
      i: "Tratamento de varizes", q: ["Valores", "Quero agendar"] },
    drenagem: { k: ["drenagem", "linfatica", "inchaco", "inchada", "retencao", "liquido", "pos operatorio"],
      t: "A drenagem linfática ajuda a reduzir o inchaço e a sensação de peso nas pernas. Temos também massagem com drenagem. Se for pós-operatório, conte para a equipe para combinarmos com a orientação do seu médico.",
      i: "Drenagem linfática", q: ["Massagens", "Quero agendar"] },
    massagem: { k: ["massagem", "massagens", "relaxante", "esportiva", "relaxar", "estresse", "tensao", "dor nas costas", "contratura", "treino"],
      t: "Temos massagem <b>relaxante</b>, <b>esportiva</b> (ótima para quem treina) e <b>com drenagem</b>. Uma hora só sua, com horário marcado.",
      i: "Massagem", q: ["Drenagem", "Valores", "Quero agendar"] },
    olhar: { k: ["sobrancelha", "sobrancelhas", "cilios", "cilio", "olhar", "design", "henna", "lash"],
      t: "Fazemos design de sobrancelhas pensado para o formato do seu rosto e procedimentos para cílios. A equipe te conta as técnicas disponíveis na agenda.",
      i: "Sobrancelhas e cílios", q: ["Valores", "Quero agendar"] },
    homens: { k: ["homem", "homens", "masculino", "marido", "namorado", "noivo", "meu esposo", "pra ele"],
      t: "Atendemos sim, com discrição e horário marcado! Os homens procuram muito a depilação a laser de barba, tórax, costas e abdômen, além de massagens e limpeza de pele.",
      q: ["Depilação a laser", "Massagens", "Quero agendar"] },
    avaliacao: { k: ["avaliacao", "primeira vez", "primeira consulta", "como funciona", "consulta"],
      t: "Na avaliação a gente conversa sobre o que você quer, analisa sua pele e monta o protocolo certo para você, com número de sessões e valores. Sem compromisso e com horário marcado.",
      q: ["Quero agendar", "Valores"] },
    local: { k: ["onde", "endereco", "localizacao", "fica onde", "chegar", "mapa", "bairro", "rua"],
      t: "Ficamos na <b>Rua Gumercindo Inocêncio de Oliveira, 408, Jardim Santa Fé, Morrinhos - GO</b>. Atendemos quem é da cidade, da região e da zona rural.",
      q: ["Horário", "Quero agendar"], mapa: true },
    horario: { k: ["horario", "abre", "fecha", "funciona", "sabado", "domingo", "aberto", "hoje", "amanha", "que horas"],
      t: "Atendemos de <b>segunda a sexta, das 9h às 19h</b>, sempre com horário marcado. Assim você não espera e é atendida na sua hora.",
      q: ["Quero agendar", "Endereço"] },
    agendar: { k: ["agendar", "agenda", "marcar", "horario disponivel", "vaga", "quero fazer", "quero marcar", "reservar", "atendimento"],
      t: "", fluxo: true },
    humano: { k: ["atendente", "humano", "pessoa", "falar com alguem", "whatsapp", "zap", "ligar", "telefone", "numero"],
      t: "Claro! Nossa equipe responde pelo WhatsApp (64) 99272-4619. Já deixei sua mensagem pronta:", wa: true },
    obrigado: { k: ["obrigad", "valeu", "brigad", "agradeco", "otimo", "perfeito", "show", "top"],
      t: "Imagina! Se surgir qualquer outra dúvida, é só chamar. 💛", q: ["Quero agendar", "Serviços"] }
  };
  const alias = {
    "Serviços": "servicos", "Depilação a laser": "laser", "Dói?": "dor", "Quantas sessões?": "sessoes",
    "Como me preparar": "preparo", "Cuidados depois": "depois", "Valores": "valores", "Formas de pagamento": "pagamento",
    "Rosto": "rosto", "Botox": "botox", "Harmonização": "harmo", "Corpo": "corpo", "Estrias": "estrias", "Varizes": "varizes",
    "Drenagem": "drenagem", "Massagens": "massagem", "Sobrancelhas e cílios": "olhar", "Atende homens?": "homens",
    "Endereço": "local", "Horário": "horario", "Endereço e horário": "local", "Quero agendar": "agendar", "Falar com a equipe": "humano"
  };
  const START = ["Quero agendar", "Depilação a laser", "Serviços", "Valores", "Dói?", "Formas de pagamento", "Endereço e horário", "Atende homens?"];

  /* ---------- entendimento do texto ---------- */
  const lev1 = (a, b) => { // distância de edição <= 1
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++e > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return e + (a.length - i) + (b.length - j) <= 1;
  };
  const score = (n, words, key) => {
    let s = 0;
    for (const k of R[key].k) {
      if (k.includes(" ")) { if (n.includes(k)) s += 3; continue; }
      if (words.some((w) => w === k || (k.length >= 4 && w.length > k.length && w.startsWith(k)))) s += 2;
      else if (k.length >= 5 && words.some((w) => lev1(w, k))) s += 1.5;
      else if (n.includes(k) && k.length >= 4) s += 1;
    }
    return s;
  };
  const PRIOR = ["agendar", "valores", "pagamento", "dor", "sessoes", "duracao", "preparo", "depois", "gestante", "menor", "pele", "sol",
    "botox", "harmo", "estrias", "varizes", "drenagem", "homens", "avaliacao", "horario", "local", "humano", "rosto", "corpo", "massagem", "olhar", "laser", "servicos", "obrigado"];
  const detect = (text) => {
    const n = norm(text); const words = n.split(" ");
    if (/^(oi+|ola|bom dia|boa tarde|boa noite|e ai|opa|hello|oii+)\b/.test(n) && words.length <= 4) return { key: "greet" };
    const ranked = PRIOR.map((k, idx) => ({ k, s: score(n, words, k) - idx * 0.001 })).filter((x) => x.s > 0.9).sort((a, b) => b.s - a.s);
    if (!ranked.length) return null;
    // tema + assunto: "quanto custa virilha" => valores, e registra laser como interesse
    const main = ranked[0].k;
    const extra = ranked.slice(1).map((x) => x.k).filter((k) => R[k].i);
    return { key: main, extra };
  };

  /* ---------- interface ---------- */
  const scroll = () => { body.scrollTop = body.scrollHeight; };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const add = (html, who, raw) => {
    const d = document.createElement("div");
    d.className = "msg msg--" + who;
    if (raw) d.textContent = html; else d.innerHTML = html;
    body.appendChild(d); scroll();
    return d;
  };
  const waMessage = () => {
    let m = "Olá! Vim pelo site da RT.";
    if (ctx.nome) m = `Olá! Meu nome é ${ctx.nome} e vim pelo site da RT.`;
    if (ctx.interesses.size) m += ` Tenho interesse em: ${[...ctx.interesses].join(", ")}.`;
    if (ctx.periodo) m += ` Prefiro atendimento ${ctx.periodo}.`;
    const d = ctx.duvidas.filter(Boolean);
    if (d.length) m += ` Minha dúvida: ${d.slice(-2).join(" / ")}`;
    return m;
  };
  const addWa = (bubble, label) => {
    const a = document.createElement("a");
    a.className = "msg__wa"; a.target = "_blank"; a.rel = "noopener";
    a.href = waLink(waMessage());
    a.textContent = label || "Continuar no WhatsApp →";
    a.addEventListener("click", () => track("whatsapp_click", { origem: "assistente" }));
    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(a);
    if (!aberto()) {
      const n = document.createElement("small");
      n.style.cssText = "display:block;margin-top:.5rem;opacity:.8";
      n.textContent = "Estamos fora do horário agora. Pode mandar sua mensagem que respondemos no próximo dia útil a partir das 9h.";
      bubble.appendChild(n);
    }
    scroll();
  };
  const addMap = (bubble) => {
    const a = document.createElement("a");
    a.className = "msg__wa"; a.style.background = "var(--wine)"; a.target = "_blank"; a.rel = "noopener";
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Rua Gumercindo Inocêncio de Oliveira, 408, Jardim Santa Fé, Morrinhos - GO");
    a.textContent = "Abrir no mapa →";
    a.addEventListener("click", () => track("como_chegar", { origem: "assistente" }));
    bubble.appendChild(document.createElement("br")); bubble.appendChild(a);
  };
  const setQuick = (list, main) => {
    quick.innerHTML = "";
    (list || START).forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      if (main && i === 0) b.classList.add("is-main");
      b.addEventListener("click", () => { add(label, "me", true); handle(label, true); });
      quick.appendChild(b);
    });
  };
  const reply = (fn, len) => {
    const t = document.createElement("div");
    t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t); scroll();
    setTimeout(() => { t.remove(); fn(); }, Math.min(1300, 450 + (len || 120) * 2));
  };
  const nomeDe = (t) => {
    const m = norm(t).match(/(?:meu nome e|me chamo|sou a|sou o|sou)\s+([a-z]+)/);
    const n = m ? m[1] : (t.trim().split(/\s+/).length <= 3 ? t.trim().split(/\s+/)[0] : "");
    return n && n.length >= 2 && n.length <= 20 ? cap(n.toLowerCase()) : "";
  };

  /* ---------- fluxo de agendamento ---------- */
  const SERV = ["Depilação a laser", "Limpeza de pele", "Toxina botulínica", "Harmonização facial", "Estrias", "Enzimas", "Varizes", "Massagem", "Drenagem linfática", "Sobrancelhas e cílios"];
  const fluxo = (passo, valor) => {
    if (passo === "inicio") {
      ctx.etapa = "nome";
      track("lead_inicio");
      return reply(() => { add(ctx.nome ? `Vamos lá, ${ctx.nome}! ` + "Qual serviço você quer agendar?" : "Ótimo! Vou deixar tudo pronto para a equipe. Pra começar, qual é o seu nome?", "bot"); if (ctx.nome) { ctx.etapa = "servico"; setQuick(SERV); } else setQuick([]); });
    }
    if (passo === "nome") {
      ctx.nome = nomeDe(valor) || ctx.nome;
      ctx.etapa = "servico";
      return reply(() => { add(`Prazer${ctx.nome ? ", " + esc(ctx.nome) : ""}! Qual serviço você quer agendar? Pode escolher mais de um, um de cada vez.`, "bot"); setQuick(ctx.interesses.size ? ["Já escolhi, continuar", ...SERV] : SERV, ctx.interesses.size > 0); });
    }
    if (passo === "servico") {
      if (valor !== "Já escolhi, continuar") ctx.interesses.add(valor);
      ctx.etapa = "periodo";
      return reply(() => { add(`Anotado: <b>${esc([...ctx.interesses].join(", "))}</b>.\nQual período fica melhor para você?`, "bot"); setQuick(["Manhã", "Tarde", "Fim da tarde", "Tanto faz"]); });
    }
    if (passo === "periodo") {
      ctx.periodo = { "Manhã": "pela manhã", "Tarde": "à tarde", "Fim da tarde": "no fim da tarde", "Tanto faz": "em qualquer horário" }[valor] || norm(valor);
      ctx.etapa = null;
      track("lead_completo", { servico: [...ctx.interesses].join(", ") });
      return reply(() => {
        const b = add(`Prontinho${ctx.nome ? ", " + esc(ctx.nome) : ""}! Sua mensagem já está montada. É só tocar no botão que a equipe confirma o horário com você:`, "bot");
        addWa(b, "Enviar no WhatsApp →");
        setQuick(["Como me preparar", "Endereço", "Serviços"]);
      });
    }
  };

  /* ---------- respostas ---------- */
  const answer = (key, extra) => {
    const r = R[key];
    if (!r) return fallback();
    if (r.fluxo) return fluxo("inicio");
    if (r.i) { ctx.interesses.add(r.i); track("servico_interesse", { servico: r.i }); }
    (extra || []).forEach((k) => R[k].i && ctx.interesses.add(R[k].i));
    ctx.ultimo = key;
    track("chat_resposta", { tema: key });
    reply(() => {
      const b = add(r.t, "bot");
      if (r.wa) addWa(b);
      if (r.mapa) addMap(b);
      const q = r.q ? [...r.q] : START.slice();
      if (!q.includes("Quero agendar")) q.push("Quero agendar");
      if (!q.includes("Falar com a equipe") && !r.wa) q.push("Falar com a equipe");
      setQuick(q);
    }, r.t.length);
  };
  const fallback = () => reply(() => {
    const b = add("Essa eu prefiro deixar com a nossa equipe, pra te responder com certeza. Já deixei sua pergunta na mensagem:", "bot");
    addWa(b);
    setQuick(START);
  });

  const handle = (text, fromChip) => {
    // fluxo de agendamento em andamento
    if (ctx.etapa === "nome" && !fromChip) return fluxo("nome", text);
    if (ctx.etapa === "servico" && (SERV.includes(text) || text === "Já escolhi, continuar")) return fluxo("servico", text);
    if (ctx.etapa === "periodo" && ["Manhã", "Tarde", "Fim da tarde", "Tanto faz"].includes(text)) return fluxo("periodo", text);
    if (ctx.etapa === "servico" && !fromChip) {
      const d = detect(text);
      const k = d && d.key !== "greet" ? d.key : null;
      if (k && R[k].i) return fluxo("servico", R[k].i);
      ctx.interesses.add(text.slice(0, 40));
      return fluxo("servico", "Já escolhi, continuar");
    }
    if (ctx.etapa === "periodo" && !fromChip) return fluxo("periodo", text);
    ctx.etapa = null;
    if (fromChip && alias[text]) return answer(alias[text]);
    const d = detect(text);
    if (!d || !["agendar", "obrigado"].includes(d.key)) ctx.duvidas.push(text.slice(0, 160));
    if (!d) return fallback();
    if (d.key === "greet") return reply(() => { add("Oi! Que bom te ver por aqui. Me conta: qual tratamento te interessa ou qual é a sua dúvida?", "bot"); setQuick(START); });
    answer(d.key, d.extra);
  };

  const open = (origem) => {
    box.hidden = false; fab.setAttribute("aria-expanded", true);
    nudge && nudge.remove();
    if (!started) {
      started = true;
      add(`${aberto() ? "Oi" : "Oi, boa noite"}! Sou a assistente da <b>RT Estética Avançada</b>.\nTiro dúvidas rápidas e já deixo seu agendamento pronto para a equipe no WhatsApp. Por onde começamos?`, "bot");
      setQuick(START, true);
    }
    track("chat_open", { origem: typeof origem === "string" ? origem : "botao" });
    if (window.matchMedia("(pointer: fine)").matches) setTimeout(() => input.focus({ preventScroll: true }), 100);
  };
  const close = () => { box.hidden = true; fab.setAttribute("aria-expanded", false); fab.focus(); };

  fab.addEventListener("click", () => open("botao"));
  document.querySelectorAll("[data-open-chat]").forEach((b) => b.addEventListener("click", () => open("pagina")));
  box.querySelector(".chat__close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) close(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add(text, "me", true);
    handle(text, false);
  });

  /* ---------- convite discreto (uma vez por visita) ---------- */
  let nudge = null;
  let seen = false;
  try { seen = sessionStorage.getItem("rt_nudge") === "1"; } catch (e) {}
  if (!seen) {
    setTimeout(() => {
      if (started || !box.hidden) return;
      nudge = document.createElement("div");
      nudge.className = "chat-nudge"; nudge.setAttribute("role", "status");
      nudge.innerHTML = "Ficou com alguma dúvida sobre o laser ou os valores? <b>Me pergunta aqui</b> 😊<button type=\"button\" aria-label=\"Fechar aviso\">×</button>";
      nudge.addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") { nudge.remove(); return; } open("convite"); });
      document.body.appendChild(nudge);
      try { sessionStorage.setItem("rt_nudge", "1"); } catch (e) {}
      track("chat_convite");
    }, 22000);
  }
})();
