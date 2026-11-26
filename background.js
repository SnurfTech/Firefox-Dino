console.log("Background script loaded");

function shouldIgnore(error) {
  return (
    !error ||
    error === "NS_BINDING_ABORTED" ||
    error === "NS_ERROR_ABORT" ||
    error.startsWith("SEC_") ||
    error.startsWith("SSL_") ||
    error.startsWith("MOZILLA_PKIX_")
  );
}

const retried = new Map(); // "tabId|url" -> timestamp of last auto-retry

function handleError(tabId, originalUrl, error) {
  if (!originalUrl || originalUrl.startsWith("moz-extension://")) return;

  if (navigator.onLine) {
    // Browser thinks we're online: treat as a blip, retry once per URL
    const key = tabId + "|" + originalUrl;
    const last = retried.get(key) || 0;
    if (Date.now() - last > 10000) {
      retried.set(key, Date.now());
      console.log("Online, retrying:", error, originalUrl);
      browser.tabs.update(tabId, { url: originalUrl });
    } else {
      console.log("Online, already retried; leaving Firefox's page:", error);
    }
    return;
  }

  browser.tabs.update(tabId, {
    url:
      browser.runtime.getURL("dino.html") +
      "?url=" + encodeURIComponent(originalUrl) +
      "&error=" + encodeURIComponent(error || ""),
  });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;
  if (url && url.startsWith("about:neterror")) {
    const params = new URL(url).searchParams;
    console.log("neterror page:", params.get("e"), params.get("u"));
    handleError(tabId, params.get("u"), params.get("e"));
  }
});

browser.webNavigation.onErrorOccurred.addListener((details) => {
  console.log("Navigation error:", details.error, details.url);
  if (details.frameId !== 0) return;
  if (shouldIgnore(details.error)) return;
  handleError(details.tabId, details.url, details.error);
});

const DINO_URL = browser.runtime.getURL("dino.html");

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !tab.url.startsWith(DINO_URL)) return;

  // Only inject when we got here from a failed navigation
  const params = new URL(tab.url).searchParams;
  if (!params.get("url") && !params.get("error")) return;

  browser.scripting
    .executeScript({ target: { tabId }, files: ["offline-info.js"] })
    .catch((e) => console.error("Injection failed:", e));
});
