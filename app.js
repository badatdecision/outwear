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
  const recordForm = document.getElementById("record-form");
  const recordError = document.getElementById("weather-error");
  const manualTemperature = document.getElementById("manual-temperature");
  const outerInput = document.getElementById("outer");
  const outerOptions = document.getElementById("outer-options");
  const storage = window.OutwearStorage;
  const weather = window.OutwearWeather;
  const rules = window.OutwearRules;
  let regions = [];
  let settings = null;
  let currentWeather = null;
  let recordWeather = null;

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

  function renderRecords() {
    const list = document.getElementById("record-list");
    const records = storage.loadData().records;
    list.replaceChildren();
    document.getElementById("record-empty").hidden = records.length > 0;
    const ratings = { cold: "추웠음", ok: "적당", hot: "더웠음" };
    for (const record of [...records].reverse()) {
      const card = document.createElement("article");
      card.className = "record-item";
      const outer = document.createElement("strong");
      outer.textContent = record.outer;
      const detail = document.createElement("span");
      detail.textContent = record.date + " · 체감 " + temperatureText(record.feelsLike)
        + " · " + (ratings[record.rating] || "평가") + (record.inner ? " · " + record.inner : "")
        + (record.manualTemp ? " · 직접 입력" : "");
      card.append(outer, detail);
      list.append(card);
    }
  }

  function temperatureText(value) {
    return (value > 0 ? "+" : "") + value.toFixed(1) + "°C";
  }

  function precipitationText(value) {
    return value === "rain" ? "비" : value === "snow" ? "눈" : "강수 없음";
  }

  function renderWeather(target, result) {
    const dayLabel = result.date === weather.localDate(new Date()) ? "오늘" : "내일 기준";
    target.textContent = dayLabel + " · 체감 " + temperatureText(result.feelsLike)
      + " · 기온 " + temperatureText(result.temp) + " · " + precipitationText(result.precip);
  }

  function renderRecommendations(result) {
    const panel = document.getElementById("recommendations");
    const message = document.getElementById("recommendation-message");
    const list = document.getElementById("recommendation-list");
    const addLink = document.getElementById("recommendation-add");
    const records = rules.recommend(storage.loadData().records, result.feelsLike, result.precip);
    panel.hidden = false;
    list.replaceChildren();
    addLink.hidden = records.length > 0;

    if (!records.length) {
      document.getElementById("recommendation-title").textContent = "기본 가이드";
      message.textContent = "비슷한 온도의 기록이 아직 없어요. " + rules.basicGuide(result.feelsLike);
      return;
    }

    document.getElementById("recommendation-title").textContent = "비슷한 날의 내 기록 (±3°C)";
    message.textContent = "적당했던 옷을 먼저 보여드려요.";
    const ratings = { ok: "적당", cold: "추웠음", hot: "더웠음" };
    for (const record of records) {
      const card = document.createElement("article");
      card.className = "record-item";
      const outer = document.createElement("strong");
      outer.textContent = record.outer;
      const detail = document.createElement("span");
      detail.textContent = record.date + " · 체감 " + temperatureText(record.feelsLike)
        + " · " + ratings[record.rating] + (record.inner ? " · " + record.inner : "");
      card.append(outer, detail);
      if (result.precip !== "none" && record.precip === result.precip) {
        const condition = document.createElement("span");
        condition.className = "record-condition";
        condition.textContent = precipitationText(record.precip) + " 온 날";
        outer.append(condition);
      }
      list.append(card);
    }
  }

  async function chooseOutfit() {
    const panel = document.getElementById("recommendations");
    const message = document.getElementById("recommendation-message");
    panel.hidden = false;
    message.textContent = "날씨를 확인하고 있어요.";
    if (!currentWeather) {
      try {
        if (!settings) throw new Error("설정 화면에서 지역과 외출 시간을 먼저 저장해 주세요.");
        currentWeather = await weather.getWeather(settings);
        renderWeather(document.getElementById("weather-caption"), currentWeather);
      } catch {
        message.textContent = "날씨를 확인하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.";
        return;
      }
    }
    renderRecommendations(currentWeather);
  }

  async function fetchWeather() {
    const caption = document.getElementById("weather-caption");
    const retry = document.getElementById("load-weather");
    if (!settings) {
      caption.textContent = "지역과 외출 시간을 먼저 설정해 주세요.";
      return;
    }
    caption.textContent = "날씨를 불러오는 중이에요.";
    retry.hidden = true;
    try {
      currentWeather = await weather.getWeather(settings);
      renderWeather(caption, currentWeather);
    } catch {
      currentWeather = null;
      caption.textContent = "날씨를 불러오지 못했어요. 기록할 때 온도를 직접 입력할 수 있어요.";
      retry.hidden = false;
    }
  }

  function renderOuterOptions() {
    outerOptions.replaceChildren();
    for (const name of storage.loadData().outers) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "outer-option";
      button.textContent = name;
      button.setAttribute("aria-pressed", String(outerInput.value === name));
      button.addEventListener("click", () => {
        outerInput.value = name;
        for (const option of outerOptions.children) {
          option.setAttribute("aria-pressed", String(option === button));
        }
      });
      outerOptions.append(button);
    }
  }

  async function prepareRecord() {
    recordError.hidden = true;
    manualTemperature.hidden = true;
    recordWeather = null;
    document.getElementById("record-weather").textContent = "오늘 외출 시간대 날씨를 불러오는 중이에요.";
    renderOuterOptions();
    try {
      if (!settings) throw new Error("설정 화면에서 지역과 외출 시간을 먼저 저장해 주세요.");
      recordWeather = await weather.getWeather(settings);
      renderWeather(document.getElementById("record-weather"), recordWeather);
    } catch (error) {
      recordError.textContent = (error.message || "날씨를 불러오지 못했어요.")
        + " 온도와 아우터, 평가를 입력해 기록할 수 있어요.";
      recordError.hidden = false;
      manualTemperature.hidden = false;
      document.getElementById("record-weather").textContent = "날씨 조회에 실패했어요.";
    }
  }

  function saveRecord(event) {
    event.preventDefault();
    recordError.hidden = true;
    const outer = outerInput.value.trim();
    const rating = recordForm.querySelector('input[name="rating"]:checked')?.value;
    if (!outer || !rating) {
      recordError.textContent = "아우터를 입력하고 오늘의 느낌을 선택해 주세요.";
      recordError.hidden = false;
      return;
    }
    let conditions = recordWeather;
    if (!conditions) {
      const feelsLike = Number(document.getElementById("manual-feels-like").value);
      const temp = Number(document.getElementById("manual-temperature-value").value);
      if (!document.getElementById("manual-feels-like").value
        || !document.getElementById("manual-temperature-value").value
        || !Number.isFinite(feelsLike) || !Number.isFinite(temp) || feelsLike < -50 || feelsLike > 60 || temp < -50 || temp > 60) {
        recordError.textContent = "체감온도와 기온을 -50°C에서 60°C 사이로 입력해 주세요.";
        recordError.hidden = false;
        return;
      }
      conditions = { date: weather.localDate(new Date()), feelsLike, temp, precip: "none", manualTemp: true };
    }
    const record = {
      id: window.crypto.randomUUID(), date: conditions.date, outer,
      inner: document.getElementById("inner").value.trim(), rating,
      feelsLike: conditions.feelsLike, temp: conditions.temp,
      precip: conditions.precip, manualTemp: conditions.manualTemp,
    };
    try {
      storage.saveRecord(record);
    } catch {
      recordError.textContent = "기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
      recordError.hidden = false;
      return;
    }
    recordForm.reset();
    notice.textContent = "오늘 입은 옷을 기록했어요.";
    notice.hidden = false;
    window.location.hash = "home";
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
    if (activeScreen.id === "home") {
      renderRecords();
      fetchWeather();
    }
    if (activeScreen.id === "add") prepareRecord();
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
  document.getElementById("load-weather").addEventListener("click", fetchWeather);
  document.getElementById("choose-outfit").addEventListener("click", chooseOutfit);
  outerInput.addEventListener("input", renderOuterOptions);
  recordForm.addEventListener("submit", saveRecord);
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
