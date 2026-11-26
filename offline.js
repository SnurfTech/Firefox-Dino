const params = new URLSearchParams(location.search);
const original = params.get("url");
const error = params.get("error");

// Firefox's about:neterror codes -> the NS_ERROR names Firefox displays
const FIREFOX_CODES = {
  dnsNotFound: "NS_ERROR_UNKNOWN_HOST",
  connectionFailure: "NS_ERROR_CONNECTION_REFUSED",
  netTimeout: "NS_ERROR_NET_TIMEOUT",
  netOffline: "NS_ERROR_OFFLINE",
  netReset: "NS_ERROR_NET_RESET",
  netInterrupt: "NS_ERROR_NET_INTERRUPT",
};

// Firefox's own headlines for each error
const FIREFOX_TITLES = {
  NS_ERROR_UNKNOWN_HOST: "Hmm. We’re having trouble finding that site.",
  NS_ERROR_CONNECTION_REFUSED: "Unable to connect",
  NS_ERROR_NET_TIMEOUT: "The connection has timed out",
  NS_ERROR_OFFLINE: "Offline mode",
  NS_ERROR_NET_RESET: "The connection was reset",
  NS_ERROR_NET_INTERRUPT: "The connection was interrupted",
};

const code = FIREFOX_CODES[error] || error || "NS_ERROR_OFFLINE";

document.getElementById("code").textContent = code;
document.querySelector("h1").textContent = FIREFOX_TITLES[code] || "No internet";

if (original) {
  document.getElementById("target").textContent = `Couldn't reach ${original}`;
}

const retry = () => { if (original) location.href = original; };
document.getElementById("retry").addEventListener("click", retry);
window.addEventListener("online", retry);

const game = document.getElementById("game");
game.addEventListener("load", () => game.contentWindow.focus());
