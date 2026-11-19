/* Rastreamento com consentimento (LGPD + Google Consent Mode v2).
   Nada de marketing é carregado antes de a pessoa aceitar. */
(function () {
  var C = window.RT_CONFIG || {};
  var hasGoogle = !!(C.ga4 || C.googleAds);
  var hasMeta = !!C.metaPixel;
  var KEY = "rt_consent";
  var store = {
    get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  };

  // Google: dataLayer + consentimento negado por padrão
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  if (hasGoogle) {
    gtag("consent", "default", {
      ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
      analytics_storage: "denied", wait_for_update: 500
    });
    gtag("js", new Date());
    if (C.ga4) gtag("config", C.ga4, { anonymize_ip: true });
    if (C.googleAds) gtag("config", C.googleAds);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4 || C.googleAds);
    document.head.appendChild(s);
  }

  var metaLoaded = false;
  var pending = []; // eventos feitos antes da resposta ao aviso de cookies
  function loadMeta() {
    if (!hasMeta || metaLoaded) return;
    metaLoaded = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", C.metaPixel);
    window.fbq("track", "PageView");
    pending.splice(0).forEach(function (ev) { sendMeta(ev[0], ev[1]); });
  }

  // Funil para o Meta otimizar: ViewContent (interesse) → Contact (clicou no WhatsApp) → Lead (agendamento montado)
  var ALTA_INTENCAO = { "assistente-agendamento": 1, "laser-areas": 1 };
  function sendMeta(name, p) {
    var base = { content_category: "estetica", origem_visita: window.RT_origem || "organico" };
    if (name === "whatsapp_click") {
      window.fbq("track", "Contact", Object.assign({}, base, { content_name: p.servico || p.origem || "geral", origem: p.origem || "" }));
      if (ALTA_INTENCAO[p.origem]) window.fbq("track", "Lead", Object.assign({}, base, { content_name: p.servico || p.origem }));
    } else if (name === "lead_completo") {
      window.fbq("trackCustom", "AgendamentoMontado", Object.assign({}, base, { content_name: p.servico || "" }));
    } else if (name === "servico_interesse") {
      window.fbq("track", "ViewContent", Object.assign({}, base, { content_name: p.servico || "" }));
    } else if (name === "chat_open") {
      window.fbq("trackCustom", "ChatAberto", base);
    }
  }

  function grant() {
    if (hasGoogle) gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    loadMeta();
  }
  function deny() {
    if (hasGoogle) gtag("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  }

  var saved = store.get();
  if (saved === "granted") grant();

  // Eventos de conversão usados pelo site
  window.RT_track = function (name, params) {
    params = params || {};
    if (hasGoogle) {
      gtag("event", name, params);
      if (name === "whatsapp_click") {
        gtag("event", "generate_lead", { method: "whatsapp", origem: params.origem || "" });
        if (C.googleAds && C.googleAdsLeadLabel) gtag("event", "conversion", { send_to: C.googleAds + "/" + C.googleAdsLeadLabel });
      }
    }
    if (hasMeta) {
      if (metaLoaded && window.fbq) sendMeta(name, params);
      else if (store.get() !== "denied" && pending.length < 20) pending.push([name, params]);
    }
  };

  // Aviso de cookies: só aparece se houver alguma ferramenta configurada
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.querySelector(".cookies");
    var settings = document.querySelector("[data-cookie-settings]");
    if (!bar) return;
    if (!hasGoogle && !hasMeta) { if (settings) settings.hidden = true; return; }
    if (!saved) bar.hidden = false;
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var v = b.getAttribute("data-consent") === "grant" ? "granted" : "denied";
      store.set(v);
      v === "granted" ? grant() : deny();
      bar.hidden = true;
    });
    if (settings) settings.addEventListener("click", function () { bar.hidden = false; });
  });
})();
