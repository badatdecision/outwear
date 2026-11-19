"use strict";

(() => {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const navigationLinks = document.querySelectorAll("nav a");
  const form = document.getElementById("settings-form");
  const city = document.getElementById("city");
  const district = document.getElementById("district");
  const start = document.getElementById("out-start");
  const end = document.getElementById("out-end");
  const saveButton = document.getElementById("save-settings");
  const error = document.getElementById("settings-error");
  const notice = document.getElementById("save-notice");
  const retryButton = document.getElementById("retry-regions");
  const storage = window.OutwearStorage;
  let regions = [];
  let settings = null;

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function readSettings() {
    try {
      settings = storage.loadSettings();
      showError("");
    } catch {
      settings = null;
      showError("저장된 설정을 읽을 수 없어요. 브라우저의 저장 허용 여부를 확인해 주세요. 기존 자료는 유지돼요.");
    }
  }

  function updateSummary() {
    document.getElementById("settings-summary").textContent = settings
      ? settings.region + " · " + settings.outStart + "–" + settings.outEnd
      : "오늘 외출 시간대";
  }

  function fillDistricts() {
    district.replaceChildren(new Option("시·군·구 선택", ""));
    for (const region of regions.filter((item) => item.city === city.value)) {
      district.add(new Option(region.district, region.id));
    }
    district.disabled = !city.value;
  }

  function restoreForm() {
    const selected = regions.find((region) => region.city + " " + region.district === settings?.region);
    city.value = selected?.city || "";
    fillDistricts();
    district.value = selected?.id || "";
    start.value = settings?.outStart || "08:00";
    end.value = settings?.outEnd || "19:00";
    end.setCustomValidity("");
  }

  async function loadRegions() {
    saveButton.disabled = true;
    city.disabled = true;
    district.disabled = true;
    retryButton.hidden = true;
    try {
      let data;
      if (window.location.protocol === "file:") {
        // The bundled snapshot allows double-click previews without a web server.
        data = JSON.parse(document.getElementById("region-data").textContent);
      } else {
        const response = await fetch("regions.json", { cache: "no-cache" });
        if (!response.ok) throw new Error("Region request failed");
        data = await response.json();
      }
      if (!Array.isArray(data.regions) || !data.regions.length
        || !data.regions.every((region) => typeof region.id === "string"
          && typeof region.city === "string" && typeof region.district === "string"
          && Number.isFinite(region.lat) && Math.abs(region.lat) <= 90
          && Number.isFinite(region.lon) && Math.abs(region.lon) <= 180)) {
        throw new Error("Invalid region data");
      }
      regions = data.regions;
      city.replaceChildren(new Option("시·도 선택", ""));
      for (const name of new Set(regions.map((region) => region.city))) {
        city.add(new Option(name, name));
      }
      readSettings();
      restoreForm();
      updateSummary();
      city.disabled = false;
      saveButton.disabled = false;
    } catch {
      showError("지역 목록을 불러오지 못했어요. 다시 불러오기를 눌러 주세요.");
      retryButton.hidden = false;
    }
  }

  function validateTimes() {
    end.setCustomValidity("");
    if (start.value && end.value && start.value >= end.value) {
      end.setCustomValidity("종료 시각은 같은 날의 시작 시각보다 늦어야 해요.");
    }
  }

  function saveSettings(event) {
    event.preventDefault();
    notice.hidden = true;
    showError("");
    validateTimes();
    if (!form.reportValidity()) return;

    const selected = regions.find((region) => region.id === district.value && region.city === city.value);
    if (!selected) {
      showError("시·도와 시·군·구를 선택해 주세요.");
      return;
    }
    const nextSettings = {
      region: selected.city + " " + selected.district,
      lat: selected.lat,
      lon: selected.lon,
      outStart: start.value,
      outEnd: end.value,
    };
    try {
      storage.saveSettings(nextSettings);
    } catch {
      showError("설정을 저장하지 못했어요. 브라우저의 저장 허용 여부와 남은 공간을 확인해 주세요. 기존 자료는 유지돼요.");
      return;
    }
    settings = nextSettings;
    updateSummary();
    notice.textContent = "설정을 저장했어요.";
    notice.hidden = false;
    window.location.hash = "home";
  }

  function showScreen(moveFocus) {
    const requestedId = window.location.hash.slice(1) || (settings ? "home" : "settings");
    const activeScreen = screens.find((screen) => screen.id === requestedId)
      || document.getElementById(settings ? "home" : "settings");
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
  city.addEventListener("change", fillDistricts);
  start.addEventListener("input", validateTimes);
  end.addEventListener("input", validateTimes);
  form.addEventListener("submit", saveSettings);
  form.addEventListener("input", () => { notice.hidden = true; });
  retryButton.addEventListener("click", loadRegions);
  window.addEventListener("storage", (event) => {
    if (event.key !== storage.key && event.key !== null) return;
    readSettings();
    restoreForm();
    updateSummary();
    notice.textContent = settings ? "다른 화면에서 변경한 설정을 불러왔어요." : "설정이 지워졌어요. 다시 선택해 주세요.";
    notice.hidden = false;
    if (!settings) window.location.hash = "settings";
  });
  readSettings();
  if (!settings) window.history.replaceState(null, "", "#settings");
  updateSummary();
  showScreen(false);
  loadRegions();
})();
