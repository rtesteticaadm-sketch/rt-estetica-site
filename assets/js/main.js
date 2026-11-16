/* RT Estética Avançada — interações */
(() => {
  const WA_NUMBER = "5564992724619";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

  /* ---------- links de WhatsApp ---------- */
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = waLink(el.dataset.wa);
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ---------- ano no rodapé ---------- */
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav__burger");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".nav__links a").forEach((a) =>
    a.addEventListener("click", () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); })
  );

  /* ---------- reveal ao rolar ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.01, rootMargin: "0px 0px 8% 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 60}ms`;
    io.observe(el);
  });

  /* ---------- brilho que segue o cursor ---------- */
  const glow = document.querySelector(".cursor-glow");
  if (finePointer && !reduced) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  } else glow.remove();

  /* ---------- tilt 3D ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const target = el.classList.contains("body3d") ? el.querySelector(".body3d__card") : el;
      const max = el.classList.contains("orb") ? 8 : 7;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        target.style.transform = `rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg)`;
        target.style.setProperty("--mx", `${px * 100}%`);
        target.style.setProperty("--my", `${py * 100}%`);
      });
      el.addEventListener("pointerleave", () => { target.style.transform = ""; });
    });
    // orb também reage ao mouse na hero inteira
    const hero = document.querySelector(".hero");
    const orb = document.querySelector(".orb");
    hero.addEventListener("pointermove", (e) => {
      if (e.target.closest(".orb")) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      orb.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
  }

  /* ---------- flip cards por toque ---------- */
  document.querySelectorAll(".flip").forEach((f) => {
    f.addEventListener("click", () => { if (!finePointer) f.classList.toggle("is-flipped"); });
    f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.classList.toggle("is-flipped"); } });
  });

  /* ---------- seletor de áreas do laser ---------- */
  const areasCta = document.getElementById("areasCta");
  const chips = [...document.querySelectorAll(".chip")];
  const updateAreas = () => {
    const sel = chips.filter((c) => c.classList.contains("is-on")).map((c) => c.dataset.area);
    const msg = sel.length
      ? `Olá! Vim pelo site e quero um orçamento de depilação a laser para: ${sel.join(", ")}.`
      : "Olá! Vim pelo site e quero um orçamento de depilação a laser.";
    areasCta.href = waLink(msg);
    areasCta.textContent = sel.length ? `Pedir orçamento (${sel.length} ${sel.length > 1 ? "áreas" : "área"})` : "Pedir orçamento das áreas";
  };
  chips.forEach((c) => c.addEventListener("click", () => { c.classList.toggle("is-on"); c.setAttribute("aria-pressed", c.classList.contains("is-on")); updateAreas(); }));
  areasCta.target = "_blank"; areasCta.rel = "noopener";
  updateAreas();

  /* ---------- baú de perguntas ---------- */
  const chest = document.getElementById("chest");
  const faq = document.getElementById("faq");
  const bauCta = document.querySelector(".bau__cta");
  faq.classList.add("is-locked");
  const openChest = () => {
    const open = !chest.classList.contains("is-open");
    chest.classList.toggle("is-open", open);
    chest.setAttribute("aria-expanded", open);
    faq.classList.toggle("is-locked", !open);
    bauCta.textContent = open ? "Baú aberto ✦ escolha uma dúvida" : "Toque no baú ✦";
    if (open) {
      faq.querySelectorAll("details").forEach((d, i) => { d.style.transitionDelay = `${i * 70}ms`; });
      const first = faq.querySelector("details");
      if (first && !faq.querySelector("details[open]")) first.open = true;
    }
  };
  chest.addEventListener("click", openChest);
  // abre automaticamente quando a pessoa clica numa pergunta bloqueada
  faq.addEventListener("click", () => { if (faq.classList.contains("is-locked")) openChest(); }, true);
  // uma pergunta aberta por vez
  faq.querySelectorAll("details").forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) faq.querySelectorAll("details").forEach((o) => { if (o !== d) o.open = false; });
  }));
  // abre sozinho quando o baú aparece na tela (uma vez)
  const chestIO = new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { setTimeout(() => { if (!chest.classList.contains("is-open")) openChest(); }, 1400); chestIO.disconnect(); }
  }, { threshold: 0.6 });
  chestIO.observe(chest);

  /* ---------- partículas douradas 3D na hero (suaves, em volta do selo) ---------- */
  const canvas = document.querySelector(".hero__canvas");
  const ctx = canvas.getContext("2d");
  const orbEl = document.querySelector(".orb");
  const small = window.innerWidth < 700;
  const COUNT = small ? 160 : 380;
  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0, raf = null, visible = true;
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let rot = 0;
  const pts = [];
  for (let i = 0; i < COUNT; i++) {
    // casca esférica de Fibonacci levemente irregular: forma um halo ao redor da logo
    const y = 1 - (i / (COUNT - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    const k = 1 + (Math.random() - 0.5) * 0.18;
    pts.push({ x: Math.cos(th) * r * k, y: y * k, z: Math.sin(th) * r * k, s: 0.6 + Math.random() * 0.8, tw: Math.random() * 6.28 });
  }
  const layout = () => {
    const hr = canvas.getBoundingClientRect();
    W = hr.width; H = hr.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const o = orbEl.getBoundingClientRect();
    cx = o.left - hr.left + o.width / 2; cy = o.top - hr.top + o.height / 2;
    R = o.width * 0.78;
  };
  let lastW = 0;
  const onResize = () => { if (Math.abs(window.innerWidth - lastW) > 40 || !lastW) { lastW = window.innerWidth; layout(); } };
  if (!reduced && finePointer) {
    window.addEventListener("pointermove", (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      target.y = (e.clientY / window.innerHeight - 0.5) * 0.35;
    }, { passive: true });
  }
  const draw = (t) => {
    cur.x += (target.x - cur.x) * 0.035;
    cur.y += (target.y - cur.y) * 0.035;
    rot += 0.0012;
    const ay = rot + cur.x, ax = 0.28 + cur.y;
    const cA = Math.cos(ay), sA = Math.sin(ay), cB = Math.cos(ax), sB = Math.sin(ax);
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      let x = p.x * cA - p.z * sA, z = p.x * sA + p.z * cA;
      const y = p.y * cB - z * sB; z = p.y * sB + z * cB;
      const f = 2.8 / (2.8 + z);
      const depth = (1 - z) / 2;                       // 0 = atrás, 1 = na frente
      const twinkle = 0.75 + 0.25 * Math.sin(t * 0.0015 + p.tw);
      const a = (0.12 + depth * 0.55) * twinkle;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(cx + x * R * f, cy + y * R * f, Math.max(0.5, p.s * f * (0.8 + depth)), 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = visible ? requestAnimationFrame(draw) : null;
  };
  ctx.fillStyle = "#f0c98a";
  lastW = window.innerWidth; layout();
  ctx.fillStyle = "#f0c98a";
  window.addEventListener("resize", () => { onResize(); ctx.fillStyle = "#f0c98a"; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); ctx.fillStyle = "#f0c98a"; });
  if (reduced) { draw(0); cancelAnimationFrame(raf); raf = null; }
  else {
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting && !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    }).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
  }
})();
