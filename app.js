"use strict";

(() => {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const navigationLinks = document.querySelectorAll("nav a");

  function showScreen(moveFocus) {
    const requestedId = window.location.hash.slice(1);
    const activeScreen = screens.find((screen) => screen.id === requestedId)
      || document.getElementById("settings");
    const activeHash = "#" + activeScreen.id;

    for (const screen of screens) {
      screen.hidden = screen !== activeScreen;
    }

    for (const link of navigationLinks) {
      if (link.getAttribute("href") === activeHash) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    if (window.location.hash !== activeHash) {
      window.history.replaceState(null, "", activeHash);
    }

    const heading = activeScreen.querySelector("h1");
    document.title = heading.textContent + " · 옷 고르기";
    if (moveFocus) {
      heading.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener("hashchange", () => showScreen(true));
  showScreen(false);
})();
