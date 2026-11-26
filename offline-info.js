(() => {
  const params = new URLSearchParams(location.search);
  const original = params.get("url");
  const error = params.get("error");

  // Only show the info when we got here from a failed navigation
  if (!original && !error) return;

  // Show Chrome's code names (ERR_NAME_NOT_RESOLVED) instead of Firefox's
  // NS_ERROR_* names under the message
  const SHOW_CHROME_CODES = false;

  // ---------------------------------------------------------------------
  // Text, copied from Chromium's components/error_page_strings.grdp
  // ({host} / {url} become bold, like in Chrome)
  // ---------------------------------------------------------------------
  const HEADING = {
    notAvailable: "This site can’t be reached",
    noInternet: "No internet",
    notWorking: "This page isn’t working",
  };

  const SUGGEST = {
    checkConnection: "Checking the connection",
    proxyFirewallDns: "Checking the proxy, firewall, and DNS configuration",
    proxyFirewall: "Checking the proxy and the firewall",
    proxyAddress: "Checking the proxy address",
    contactAdmin: "Contacting the system admin",
    hardware: "Checking the network cables, modem, and router",
    wifi: "Reconnecting to Wi-Fi",
    cookies: "Try deleting your cookies.",
  };

  // Which heading / summary / suggestions each error gets
  // (the table in Chromium's components/error_page/common/localized_error.cc)
  const CONNECTION_SUGGESTIONS = [SUGGEST.checkConnection, SUGGEST.proxyFirewall];

  const ERRORS = {
    NAME_NOT_RESOLVED: {
      ns: "NS_ERROR_UNKNOWN_HOST", chrome: "ERR_NAME_NOT_RESOLVED",
      heading: HEADING.notAvailable,
      summary: "{host}’s server IP address could not be found.",
      suggestions: [SUGGEST.checkConnection, SUGGEST.proxyFirewallDns],
    },
    CONNECTION_REFUSED: {
      ns: "NS_ERROR_CONNECTION_REFUSED", chrome: "ERR_CONNECTION_REFUSED",
      heading: HEADING.notAvailable,
      summary: "{host} refused to connect.",
      suggestions: CONNECTION_SUGGESTIONS,
    },
    CONNECTION_TIMED_OUT: {
      ns: "NS_ERROR_NET_TIMEOUT", chrome: "ERR_CONNECTION_TIMED_OUT",
      heading: HEADING.notAvailable,
      summary: "{host} took too long to respond.",
      suggestions: CONNECTION_SUGGESTIONS,
    },
    CONNECTION_RESET: {
      ns: "NS_ERROR_NET_RESET", chrome: "ERR_CONNECTION_RESET",
      heading: HEADING.notAvailable,
      summary: "The connection was reset.",
      suggestions: CONNECTION_SUGGESTIONS,
    },
    CONNECTION_CLOSED: {
      ns: "NS_ERROR_NET_INTERRUPT", chrome: "ERR_CONNECTION_CLOSED",
      heading: HEADING.notAvailable,
      summary: "{host} unexpectedly closed the connection.",
      suggestions: CONNECTION_SUGGESTIONS,
    },
    INTERNET_DISCONNECTED: {
      ns: "NS_ERROR_OFFLINE", chrome: "ERR_INTERNET_DISCONNECTED",
      heading: HEADING.noInternet,
      summary: null, // Chrome hides the summary on its "No internet" page
      suggestions: [SUGGEST.hardware, SUGGEST.wifi],
    },
    PROXY_CONNECTION_FAILED: {
      ns: "NS_ERROR_PROXY_CONNECTION_REFUSED", chrome: "ERR_PROXY_CONNECTION_FAILED",
      heading: HEADING.noInternet,
      summary: "There is something wrong with the proxy server, or the address is incorrect.",
      suggestions: [SUGGEST.contactAdmin, SUGGEST.proxyAddress],
    },
    TOO_MANY_REDIRECTS: {
      ns: "NS_ERROR_REDIRECT_LOOP", chrome: "ERR_TOO_MANY_REDIRECTS",
      heading: HEADING.notWorking,
      summary: "{host} redirected you too many times.",
      suggestions: [SUGGEST.cookies],
      standalone: true, // a lone suggestion has no "Try:" header or bullet
    },
  };

  // Chrome's fallback for errors it has no specific message for
  const FALLBACK = {
    heading: HEADING.notAvailable,
    summary: "The webpage at {url} might be temporarily down or it may have moved permanently to a new web address.",
    suggestions: [],
  };

  // Firefox's names (about:neterror codes and NS_ERROR_* names) -> table above
  const NORMALIZE = {
    dnsNotFound: "NAME_NOT_RESOLVED", NS_ERROR_UNKNOWN_HOST: "NAME_NOT_RESOLVED",
    connectionFailure: "CONNECTION_REFUSED", NS_ERROR_CONNECTION_REFUSED: "CONNECTION_REFUSED",
    netTimeout: "CONNECTION_TIMED_OUT", NS_ERROR_NET_TIMEOUT: "CONNECTION_TIMED_OUT",
    netReset: "CONNECTION_RESET", NS_ERROR_NET_RESET: "CONNECTION_RESET",
    netInterrupt: "CONNECTION_CLOSED", NS_ERROR_NET_INTERRUPT: "CONNECTION_CLOSED",
    netOffline: "INTERNET_DISCONNECTED", NS_ERROR_OFFLINE: "INTERNET_DISCONNECTED",
    proxyConnectFailure: "PROXY_CONNECTION_FAILED", NS_ERROR_PROXY_CONNECTION_REFUSED: "PROXY_CONNECTION_FAILED",
    proxyResolveFailure: "PROXY_CONNECTION_FAILED", NS_ERROR_UNKNOWN_PROXY_HOST: "PROXY_CONNECTION_FAILED",
    redirectLoop: "TOO_MANY_REDIRECTS", NS_ERROR_REDIRECT_LOOP: "TOO_MANY_REDIRECTS",
  };

  // Work out what to show.  ?error=ERR_CONNECTION_REFUSED works too (for testing).
  const key = NORMALIZE[error] || (error || "INTERNET_DISCONNECTED").replace(/^ERR_/, "");
  let entry = ERRORS[key] || FALLBACK;
  let code = SHOW_CHROME_CODES
    ? (entry.chrome || error)
    : (entry.ns || error || "NS_ERROR_OFFLINE");

  // Like Chrome's DNS probe: a failed lookup while we have no connection at
  // all is reported as "No internet", not as "this site can't be reached"
  if (key === "NAME_NOT_RESOLVED" && !navigator.onLine) {
    entry = ERRORS.INTERNET_DISCONNECTED;
    if (SHOW_CHROME_CODES) code = "DNS_PROBE_FINISHED_NO_INTERNET";
  }

  // Chrome shows the host, except for non-web URLs, where it shows the URL
  let host = original || "";
  try {
    const u = new URL(original);
    if (u.protocol === "http:" || u.protocol === "https:") host = u.hostname;
  } catch {}
  if (host) document.title = host; // Chrome titles error pages with the host

  // ---------------------------------------------------------------------
  // Styles. Fonts, colors, h1 and .error-code come from Chromium's own
  // stylesheet already in this page, including its dark-mode variables.
  // ---------------------------------------------------------------------
  const style = document.createElement("style");
  style.textContent = `
    #offline-info {
      box-sizing: border-box;
      width: 100%;
      max-width: 600px;          /* same column as the game */
      margin: 0 auto;
      padding: 0;
      text-align: left;
      color: var(--text-color, #5f6368);
      line-height: 1.55;
      position: relative;
      z-index: 20;               /* above the game's full-page click layer */
    }
    @media (prefers-color-scheme: dark) {
      #offline-info { color: var(--text-color, #9aa0a6); }
    }
    #offline-info h1 { margin-top: 0; }
    #offline-info .oi-summary { display: inline; }   /* as in Chrome */
    #offline-info #suggestions-list ul { padding-inline-start: 40px; }
    #offline-info #suggestions-list ul.single-suggestion { padding-inline-start: 0; }
    #offline-info .oi-buttons {
      margin-top: 51px;
      display: flex;
      justify-content: flex-end;  /* Chrome puts Reload at the right */
    }
    #offline-info button {
      background: var(--primary-button-fill-color, #1a73e8);
      color: var(--primary-button-text-color, #fff);
      float: none;
      font-family: inherit;
      font-size: .875em;
      padding: 8px 16px;
    }
    #offline-info button:hover {
      box-shadow: 0 1px 3px rgba(60, 64, 67, .3), 0 4px 8px 3px rgba(60, 64, 67, .15);
    }
    #offline-info button:active { background: var(--primary-button-fill-color-active, #1967d2); }
    @media (prefers-color-scheme: dark) {
      #offline-info button { background: var(--primary-button-fill-color, #8ab4f8); color: var(--primary-button-text-color, #202124); }
    }
  `;
  document.head.appendChild(style);

  // ---------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------
  // Turns "{host} refused to connect." into text with the host in <strong>
  function withBold(text) {
    const frag = document.createDocumentFragment();
    for (const part of text.split(/(\{host\}|\{url\})/)) {
      if (part === "{host}" || part === "{url}") {
        const strong = document.createElement("strong");
        strong.textContent = part === "{host}" ? host : original;
        frag.append(strong);
      } else if (part) {
        frag.append(part);
      }
    }
    return frag;
  }

  const box = document.createElement("div");
  box.id = "offline-info";

  const h1 = document.createElement("h1");
  h1.textContent = entry.heading;
  box.append(h1);

  if (entry.summary) {
    const summary = document.createElement("p");
    summary.className = "oi-summary";
    summary.append(withBold(entry.summary));
    box.append(summary);
  }

  if (entry.suggestions.length) {
    const list = document.createElement("div");
    list.id = "suggestions-list";
    if (!entry.standalone) {
      const header = document.createElement("p");
      header.textContent = "Try:";
      list.append(header);
    }
    const ul = document.createElement("ul");
    if (entry.suggestions.length === 1) ul.className = "single-suggestion";
    for (const text of entry.suggestions) {
      const li = document.createElement("li");
      li.textContent = text;
      ul.append(li);
    }
    list.append(ul);
    box.append(list);
  }

  const codeDiv = document.createElement("div");
  codeDiv.className = "error-code";
  codeDiv.textContent = code;
  box.append(codeDiv);

  // Reload button. (Chrome omits it on its "No internet" page because its
  // own reload key retries the original URL; ours would only reload this
  // page, so it is always shown.)
  const buttons = document.createElement("div");
  buttons.className = "oi-buttons";
  const reloadButton = document.createElement("button");
  reloadButton.id = "reload-button";
  reloadButton.textContent = "Reload";
  buttons.append(reloadButton);
  box.append(buttons);

  const retry = () => { if (original) location.href = original; };
  reloadButton.addEventListener("click", retry);
  window.addEventListener("online", retry);
  // F5 / Ctrl+R / Cmd+R retries the original page, as in Chrome
  window.addEventListener("keydown", (e) => {
    if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) {
      e.preventDefault();
      retry();
    }
  });

  // ---------------------------------------------------------------------
  // Line the box up with the game. The game's canvas is as wide as its
  // wrapper minus the wrapper's side padding (which Chromium's CSS changes
  // with the window size), so we copy that padding. Then place the box a
  // fixed distance below the canvas (a negative margin is fine here).
  // ---------------------------------------------------------------------
  function place() {
    const wrapper = document.querySelector(".interstitial-wrapper");
    const runner = document.querySelector(".runner-container");
    if (wrapper) {
      const cs = getComputedStyle(wrapper);
      box.style.paddingLeft = cs.paddingLeft;
      box.style.paddingRight = cs.paddingRight;
    }
    box.style.paddingBottom = "40px";
    if (!runner) { box.style.marginTop = "40px"; return; }
    box.style.marginTop = "0px";
    const natural = box.getBoundingClientRect().top;
    const target = runner.getBoundingClientRect().bottom + 24;
    box.style.marginTop = (target - natural) + "px";
  }

  function init() {
    document.body.appendChild(box);
    place();
    window.addEventListener("resize", place);
  }

  // The game renders on DOMContentLoaded; this runs after it
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
