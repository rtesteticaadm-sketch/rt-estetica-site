/* RT — camada de movimento "Ritual": títulos, baralho 3D, passeio pelo espaço,
   números, linha dos passos, cursor e barra fixa. Tudo leve e opcional:
   respeita "reduzir movimento" e não depende de bibliotecas. */
(() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const track = (n, p) => window.RT_track && window.RT_track(n, p || {});
  const io = (el, fn, opt) => {
    if (!("IntersectionObserver" in window)) return fn();
    const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); o.unobserve(e.target); } }), opt || { threshold: 0.2 });
    o.observe(el);
  };

  /* títulos: palavra a palavra, preservando <em> e <br> */
  document.querySelectorAll("h1, h2").forEach((h) => {
    if (calm) return;
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") wrap(n);
      });
    };
    wrap(h);
    h.classList.add("split-words");
    io(h, () => h.classList.add("is-in"), { threshold: 0.1 });
  });

  /* baralho do topo: abre em leque conforme a rolagem */
  const deck = document.querySelector(".deck");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, vh = innerHeight;
      if (deck && !calm) deck.style.setProperty("--fan", Math.min(1, y / (vh * 0.7)).toFixed(3));
      // linha dos passos
      if (steps) {
        const r = steps.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        steps.style.setProperty("--p", calm ? 1 : p.toFixed(3));
      }
      // barra fixa no celular
      if (dock) {
        const past = y > vh * 0.75;
        const nearEnd = y + vh > document.documentElement.scrollHeight - 260;
        dock.classList.toggle("is-on", past && !nearEnd && document.getElementById("chat").hidden);
      }
    });
  };
  const steps = document.querySelector(".steps");
  const dock = document.querySelector(".dock");
  if (dock && matchMedia("(max-width: 560px)").matches) dock.hidden = false;
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* faixa: duplica o conteúdo para o loop ficar contínuo */
  const rib = document.querySelector(".ribbon__track");
  if (rib) rib.innerHTML += rib.innerHTML;

  /* números que contam até o valor */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || "";
    if (calm) { el.textContent = end + suf; return; }
    el.textContent = "0" + suf;
    io(el, () => {
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * e) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
  });

  /* luz nos cards acompanha o ponteiro */
  document.querySelectorAll(".svc, .reason").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--gx", `${e.clientX - r.left}px`);
    c.style.setProperty("--gy", `${e.clientY - r.top}px`);
  }));

  /* passeio 3D pelo espaço */
  const tour = document.querySelector("[data-tour]");
  if (tour) {
    const tr = tour.querySelector(".tour__track");
    const items = [...tr.children];
    const idx = tour.querySelector("[data-tour-i]");
    let cur = 0, moved = false;
    const paint = () => {
      const mid = tr.scrollLeft + tr.clientWidth / 2;
      let best = 0, bestD = Infinity;
      items.forEach((it, i) => {
        const c = it.offsetLeft + it.offsetWidth / 2;
        const d = (c - mid) / (it.offsetWidth + 22);
        const cl = Math.max(-1.5, Math.min(1.5, d));
        it.style.setProperty("--d", calm ? 0 : cl.toFixed(3));
        it.style.setProperty("--a", calm ? 0 : Math.min(1, Math.abs(cl)).toFixed(3));
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      });
      if (best !== cur) { cur = best; idx.textContent = cur + 1; }
    };
    const go = (i) => {
      const it = items[Math.max(0, Math.min(items.length - 1, i))];
      tr.scrollTo({ left: it.offsetLeft - (tr.clientWidth - it.offsetWidth) / 2, behavior: calm ? "auto" : "smooth" });
      if (!moved) { moved = true; track("tour_espaco"); }
    };
    tr.addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true });
    addEventListener("resize", paint);
    tour.querySelector("[data-tour-prev]").addEventListener("click", () => go(cur - 1));
    tour.querySelector("[data-tour-next]").addEventListener("click", () => go(cur + 1));
    tr.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); } });
    // arrastar com o mouse
    let down = false, sx = 0, sl = 0;
    tr.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; sx = e.clientX; sl = tr.scrollLeft; tr.classList.add("is-drag"); });
    addEventListener("pointermove", (e) => { if (down) tr.scrollLeft = sl - (e.clientX - sx); });
    addEventListener("pointerup", () => { if (!down) return; down = false; tr.classList.remove("is-drag"); go(cur); });
    paint();
    setTimeout(() => go(Math.floor(items.length / 2) - 1), 50);
  }

  /* cursor personalizado (só com mouse) */
  if (fine && !calm) {
    document.documentElement.classList.add("has-cursor");
    const cur = document.querySelector(".cursor");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest ? e.target : null;
      cur.classList.toggle("is-wa", !!(t && t.closest("[data-wa], #areasCta")));
      cur.classList.toggle("is-drag", !!(t && t.closest(".tour__track")));
      cur.classList.toggle("is-link", !!(t && t.closest("a, button, summary, [role=tab]")) && !cur.classList.contains("is-wa"));
    });
    document.addEventListener("pointerleave", () => cur.style.opacity = 0);
    document.addEventListener("pointerenter", () => cur.style.opacity = 1);
    const loop = () => { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); };
    loop();
  }

  /* contador nas áreas do laser */
  const areasCta = document.getElementById("areasCta");
  document.querySelectorAll(".area").forEach((a) => a.addEventListener("click", () => {
    if (a.getAttribute("aria-pressed") === "true") track("servico_interesse", { servico: "Laser: " + a.textContent.trim() });
    if (areasCta && !calm) areasCta.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 320 });
  }));
})();
