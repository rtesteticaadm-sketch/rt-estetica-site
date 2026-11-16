/* RT Estética Avançada — interações do site */
(() => {
  const CFG = window.RT_CONFIG || {};
  const WA = CFG.whatsapp || "5564992724619";
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
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
  cta.addEventListener("click", () => track("whatsapp_click", { origem: "laser-areas" }));
  updateAreas();

  /* ---------- dúvidas: uma aberta por vez ---------- */
  const det = [...document.querySelectorAll(".faq details")];
  det.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) { det.forEach((o) => { if (o !== d) o.open = false; }); track("faq_abrir", { pergunta: d.querySelector("summary").textContent }); }
  }));
})();
