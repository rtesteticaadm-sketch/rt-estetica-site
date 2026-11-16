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
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
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
      const max = el.classList.contains("orb") ? 18 : 10;
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
      orb.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`;
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

  /* ---------- partículas douradas 3D na hero ---------- */
  const canvas = document.querySelector(".hero__canvas");
  const ctx = canvas.getContext("2d");
  let W, H, DPR, pts = [], mouse = { x: 0, y: 0 }, rot = 0, raf;
  const COUNT = window.innerWidth < 700 ? 260 : 620;
  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  // esfera de Fibonacci + poeira solta
  for (let i = 0; i < COUNT; i++) {
    if (i < COUNT * 0.7) {
      const y = 1 - (i / (COUNT * 0.7 - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, s: 1 });
    } else {
      pts.push({ x: (Math.random() - 0.5) * 3.4, y: (Math.random() - 0.5) * 2.4, z: (Math.random() - 0.5) * 3.4, s: 0.6 });
    }
  }
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    rot += 0.0016;
    const ay = rot + mouse.x * 0.6, ax = 0.35 + mouse.y * 0.4;
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    const R = Math.min(W, H) * (W < 860 ? 0.42 : 0.36);
    const ox = W < 860 ? W / 2 : W * 0.7, oy = W < 860 ? H * 0.3 : H / 2;
    for (const p of pts) {
      let x = p.x * cy - p.z * sy, z = p.x * sy + p.z * cy;
      let y = p.y * cx - z * sx; z = p.y * sx + z * cx;
      const f = 2.6 / (2.6 + z);
      const px = ox + x * R * f, py = oy + y * R * f;
      const a = Math.max(0, Math.min(1, (1 - z) * 0.45)) * p.s;
      const size = Math.max(0.4, 1.6 * f * p.s);
      ctx.fillStyle = `rgba(${230 + 20 * a | 0}, ${170 + 40 * a | 0}, ${95 + 40 * a | 0}, ${a})`;
      ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  resize();
  window.addEventListener("resize", resize);
  if (!reduced) {
    // pausa quando a hero sai da tela (economiza bateria)
    new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(draw); }
      else { cancelAnimationFrame(raf); raf = null; }
    }).observe(canvas);
  } else {
    draw(); cancelAnimationFrame(raf);
  }
})();
