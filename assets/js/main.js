/* RT Estética Avançada — interações do site */
(() => {
  const CFG = window.RT_CONFIG || {};
  const WA = CFG.whatsapp || "5564992724619";
  /* origem da visita: anúncio da Meta/Google ou orgânico (para a equipe etiquetar no WhatsApp) */
  const q = new URLSearchParams(location.search);
  let origemVisita = "";
  try {
    if (q.get("fbclid") || /meta|facebook|instagram/i.test(q.get("utm_source") || "")) sessionStorage.setItem("rt_origem", "anuncio");
    else if (q.get("gclid") || /google/i.test(q.get("utm_source") || "")) sessionStorage.setItem("rt_origem", "google");
    origemVisita = sessionStorage.getItem("rt_origem") || "";
  } catch (e) {}
  window.RT_origem = origemVisita;
  const marcar = (msg) => origemVisita === "anuncio" ? msg.replace("Vim pelo site", "Vi o anúncio da RT") : msg;
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(marcar(msg))}`;
  window.RT_waLink = waLink;
  const track = (name, params) => { if (window.RT_track) window.RT_track(name, params || {}); };

  /* ---------- links de WhatsApp + conversão ---------- */
  const bindWa = (el) => {
    el.href = waLink(el.dataset.wa || "Olá! Vim pelo site.");
    el.target = "_blank";
    el.rel = "noopener";
    el.addEventListener("click", () => track("whatsapp_click", { origem: el.dataset.waOrigem || "site" }));
  };
  document.querySelectorAll("[data-wa]").forEach(bindWa);
  document.querySelectorAll("[data-track]").forEach((el) => el.addEventListener("click", () => track(el.dataset.track)));

  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- topo ---------- */
  const bar = document.querySelector(".topbar");
  const burger = document.querySelector(".burger");
  const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", () => {
    const open = bar.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  document.querySelectorAll(".menu-mobile a").forEach((a) => a.addEventListener("click", () => {
    bar.classList.remove("is-open"); burger.setAttribute("aria-expanded", false);
  }));

  /* ---------- entrada suave das seções ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px 6% 0px" });
    document.querySelectorAll(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 50}ms`; io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }


  /* ---------- profundidade 3D ---------- */
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const depth = document.querySelector("[data-depth]");
  if (depth && !calm) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      depth.style.transform = `rotateY(${cx.toFixed(2)}deg) rotateX(${cy.toFixed(2)}deg)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    if (fine) {
      const hero = document.querySelector(".hero");
      hero.addEventListener("pointermove", (e) => {
        const r = depth.getBoundingClientRect();
        tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width))) * 9;
        ty = -Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height))) * 7;
        kick();
      });
      hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; kick(); });
    } else {
      const onS = () => {
        const r = depth.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        ty = p * 8; tx = -p * 4; kick();
      };
      addEventListener("scroll", onS, { passive: true }); onS();
    }
  }
  if (fine && !calm) {
    document.querySelectorAll(".svc, .reason").forEach((card) => {
      card.classList.add("tilt");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${(x * 6).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- abas de serviços ---------- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    track("servico_categoria", { categoria: tab.textContent.trim() });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); select(n);
      }
    });
  });

  /* ---------- seletor de áreas do laser ---------- */
  const areas = [...document.querySelectorAll(".area")];
  const cta = document.getElementById("areasCta");
  const updateAreas = () => {
    const sel = areas.filter((a) => a.getAttribute("aria-pressed") === "true").map((a) => a.textContent.trim());
    cta.href = waLink(sel.length
      ? `Olá! Vim pelo site e quero avaliação de depilação a laser para: ${sel.join(", ")}.`
      : "Olá! Vim pelo site e quero avaliação de depilação a laser.");
    cta.textContent = sel.length ? `Pedir avaliação (${sel.length} ${sel.length > 1 ? "áreas" : "área"})` : "Pedir avaliação das áreas";
  };
  areas.forEach((a) => a.addEventListener("click", () => {
    a.setAttribute("aria-pressed", a.getAttribute("aria-pressed") !== "true");
    updateAreas();
  }));
  cta.target = "_blank"; cta.rel = "noopener";
  cta.addEventListener("click", () => track("whatsapp_click", { origem: "laser-areas", servico: "Depilação a laser: " + areas.filter((a) => a.getAttribute("aria-pressed") === "true").map((a) => a.textContent.trim()).join(", ") }));
  updateAreas();

  /* ---------- dúvidas: uma aberta por vez ---------- */
  const det = [...document.querySelectorAll(".faq details")];
  det.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) { det.forEach((o) => { if (o !== d) o.open = false; }); track("faq_abrir", { pergunta: d.querySelector("summary").textContent }); }
  }));
})();
