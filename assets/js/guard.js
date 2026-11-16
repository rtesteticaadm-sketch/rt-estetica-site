/* Proteção: marca JS ativo, impede o site de abrir dentro de outro site
   e manda cópias hospedadas em outro endereço para o domínio oficial. */
(function () {
  document.documentElement.className = "js";
  var host = location.hostname;
  var ok = ["rtestetica.com.br", "localhost", "127.0.0.1", ""];
  if (window.top !== window.self) {
    try { window.top.location = location.href; } catch (e) { document.documentElement.style.display = "none"; }
  }
  if (ok.indexOf(host) === -1) {
    location.replace("https://rtestetica.com.br" + location.pathname + location.search + location.hash);
  }
})();
