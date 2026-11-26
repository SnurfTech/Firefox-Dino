(() => {
  const KEY = "dinoHighScore";

  // Prefer the extension's own storage; fall back to localStorage if the
  // page is opened outside the extension (handy for testing)
  const ext = typeof browser !== "undefined" && browser.storage && browser.storage.local;
  const store = ext
    ? {
        get: async () => Number((await browser.storage.local.get(KEY))[KEY]) || 0,
        set: (v) => browser.storage.local.set({ [KEY]: v }),
        remove: () => browser.storage.local.remove(KEY),
      }
    : {
        get: async () => Number(localStorage.getItem(KEY)) || 0,
        set: async (v) => localStorage.setItem(KEY, String(v)),
        remove: async () => localStorage.removeItem(KEY),
      };

  // The game saves through window.errorPageController, which Chrome provides
  // natively. Here we provide it ourselves.
  const quiet = (p) => Promise.resolve(p).catch((e) => console.warn("High score:", e));
  window.errorPageController = {
    updateEasterEggHighScore: (score) => quiet(store.set(score)),  // new record
    resetEasterEggHighScore: () => quiet(store.remove()),          // click HI to reset
    trackEasterEgg() {},                                            // called when a run starts
  };

  // Hand the saved score to the game once it exists (it is created on
  // DOMContentLoaded). Calling this, even with 0, also turns on its saving.
  async function restore() {
    let saved = 0;
    try { saved = await store.get(); } catch (e) { console.warn("High score:", e); }
    if (typeof window.initializeEasterEggHighScore === "function") {
      window.initializeEasterEggHighScore(saved);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", restore);
  } else {
    restore();
  }
})();
