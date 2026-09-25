const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

function verificarAtualizacao() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.update());
  });
}

/**
 * O service worker é gerado com registerType "autoUpdate" (skipWaiting +
 * clientsClaim), então assim que uma versão nova é instalada ele assume
 * o controle das abas abertas sozinho, sem esperar todas fecharem. Isso
 * não recarrega a página sozinho, então fechamos o ciclo aqui: checamos
 * atualização com frequência e recarregamos assim que um novo service
 * worker assume o controle.
 */
export function setupAutoUpdate() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", verificarAtualizacao);
  window.addEventListener("focus", verificarAtualizacao);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") verificarAtualizacao();
  });

  setInterval(verificarAtualizacao, UPDATE_CHECK_INTERVAL_MS);

  let jaTinhaControlador = Boolean(navigator.serviceWorker.controller);
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!jaTinhaControlador) {
      jaTinhaControlador = true;
      return;
    }
    if (recarregando) return;
    recarregando = true;
    window.location.reload();
  });
}
