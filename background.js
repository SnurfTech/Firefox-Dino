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

function handleError(tabId, originalUrl, error) {
  // Only ordinary web pages
  if (!originalUrl || !/^https?:/i.test(originalUrl)) return;

  // Online: never touch the tab. Firefox's own error page (if any) stays.
  if (navigator.onLine) {
    console.log("Online, leaving the tab alone:", error, originalUrl);
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
