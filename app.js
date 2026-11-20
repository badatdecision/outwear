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
  const recordDate = document.getElementById("record-date");
  const recordError = document.getElementById("weather-error");
  const manualTemperature = document.getElementById("manual-temperature");
  const outerTypesContainer = document.getElementById("outer-types");
  const outerNickname = document.getElementById("outer-nickname");
  const storage = window.OutwearStorage;
  const weather = window.OutwearWeather;
  const rules = window.OutwearRules;
  let regions = [];
  let settings = null;
  let currentWeather = null;
  let recordWeather = null;
  let selectedOuterType = "";
  let selectedRecordPeriod = weather.localDate(new Date()).slice(0, 7);
  let saveNoticeTimer = null;
  const outerTypes = [
    { name: "패딩", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M25 9l7 7 7-7", "M32 16v40", "M22 27h20", "M22 37h20", "M22 47h20", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "경량패딩", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M24 9l8 7 8-7", "M32 16v40", "M22 30l20 7", "M22 41l20 7", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "무스탕", paths: ["M24 10 17 14 9 29l9 4 4-7v30h20V26l4 7 9-4-8-15-7-4-8 6-8-6z", "M23 9l9 8 9-8", "M23 10l9 10 9-10", "M32 19v37", "M22 30h8", "M34 30h8", "M22 43h8", "M34 43h8"] },
    { name: "후리스", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M24 9l8 8 8-8", "M32 17v39", "M23 39h7v9h-7z", "M34 39h7v9h-7z", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "가죽재킷", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M23 9l9 9 9-9", "M23 10l9 12 9-12", "M32 21v35", "M22 32h8l-8 8", "M42 32h-8l8 8", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "블레이저", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M23 9l9 9 9-9", "M23 10l9 12 9-12", "M32 21v35", "M24 31h6l-6 8", "M40 31h-6l6 8", "M31 30h2", "M31 39h2", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "가디건", paths: ["M24 8 17 13 9 29l9 4 4-7v30h20V26l4 7 9-4-8-16-7-5-8 6-8-6z", "M23 9l9 9 9-9", "M23 10l9 12v34", "M41 10l-9 12", "M30 30h2", "M30 38h2", "M30 46h2", "M9 29l-2 6 11 4", "M55 29l2 6-11 4"] },
    { name: "바람막이", paths: ["M24 13 17 16 9 30l9 4 4-7v29h20V27l4 7 9-4-8-14-7-3-8 5-8-5z", "M22 14q10-12 20 0", "M24 14l8 8 8-8", "M32 22v34", "M27 27h10", "M9 30l-2 6 11 4", "M55 30l2 6-11 4"] },
    { name: "셔츠", paths: ["M24 9 18 13 11 27l8 4 4-6v31h18V25l4 6 8-4-7-14-7-4-7 7-7-7z", "M24 9l8 9 8-9", "M32 18v38", "M30 27h2", "M30 35h2", "M30 43h2", "M11 27l-2 6 10 4", "M53 27l2 6-10 4"] },
    { name: "기타", paths: ["M32 11v8", "M32 11a4 4 0 1 0-4 4", "M32 19 10 39h44L32 19z"] },
  ];

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function showSaveNotice(message, duration = 0) {
    window.clearTimeout(saveNoticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    if (duration > 0) {
      saveNoticeTimer = window.setTimeout(() => {
        notice.hidden = true;
      }, duration);
    }
  }

  function readSettings() {
    try {
      settings = storage.loadSettings();
      showError("");
    } catch {
      settings = null;
      showError("저장된 위치 정보를 읽을 수 없어요. 브라우저의 저장 허용 여부를 확인해 주세요. 기존 자료는 유지돼요.");
    }
    updateLocationName();
  }

  function updateLocationName() {
    const name = document.getElementById("home-location-name");
    if (name) name.textContent = settings?.region || "위치 정보";
  }

  function shiftedRecordPeriod(unit, direction) {
    const [yearText, monthText] = selectedRecordPeriod.split("-");
    let year = Number(yearText);
    let month = Number(monthText);
    const [currentYear, currentMonth] = weather.localDate(new Date()).slice(0, 7).split("-").map(Number);

    if (unit === "year") {
      year += direction;
      if (year < 1940 || year > currentYear) return null;
      if (year === currentYear && month > currentMonth) month = currentMonth;
    } else {
      const date = new Date(Date.UTC(year, month - 1 + direction, 1));
      year = date.getUTCFullYear();
      month = date.getUTCMonth() + 1;
    }

    const period = String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0");
    return period >= "1940-01" && period <= weather.localDate(new Date()).slice(0, 7) ? period : null;
  }

  function updateRecordPeriodPicker() {
    const [year, month] = selectedRecordPeriod.split("-");
    document.getElementById("selected-record-year").textContent = year;
    document.getElementById("selected-record-month").textContent = Number(month) + "월";
    document.getElementById("previous-record-year").disabled = !shiftedRecordPeriod("year", -1);
    document.getElementById("next-record-year").disabled = !shiftedRecordPeriod("year", 1);
    document.getElementById("previous-record-month").disabled = !shiftedRecordPeriod("month", -1);
    document.getElementById("next-record-month").disabled = !shiftedRecordPeriod("month", 1);
  }

  function changeRecordPeriod(unit, direction) {
    const period = shiftedRecordPeriod(unit, direction);
    if (!period) return;
    selectedRecordPeriod = period;
    updateRecordPeriodPicker();
    renderRecords();
  }

  function renderRecords() {
    const list = document.getElementById("record-list");
    const records = storage.loadData().records;
    list.replaceChildren();
    updateRecordPeriodPicker();
    const ratings = { cold: "추웠음", ok: "적당", hot: "더웠음" };
    const newestFirst = records.map((record, index) => ({ record, index }))
      .sort((a, b) => String(b.record.date || "").localeCompare(String(a.record.date || ""))
        || b.index - a.index)
      .map(({ record }) => record);
    const groups = new Map();
    for (const record of newestFirst) {
      const [fallbackType, ...fallbackNickname] = String(record.outer || "기타").split(" · ");
      const typeName = record.outerType || fallbackType;
      const nickname = typeof record.outerNickname === "string" ? record.outerNickname : fallbackNickname.join(" · ");
      const key = JSON.stringify([typeName, nickname]);
      if (!groups.has(key)) groups.set(key, { typeName, nickname, records: [] });
      groups.get(key).records.push(record);
    }

    const recordPositions = new Map(newestFirst.map((record, index) => [record, index]));
    const visibleGroups = [...groups.values()].map((groupData) => {
      const latest = groupData.records.find((record) => record.date?.slice(0, 7) === selectedRecordPeriod);
      if (!latest) return null;
      const latestIndex = groupData.records.indexOf(latest);
      return { ...groupData, latest, previousRecords: groupData.records.slice(latestIndex + 1), position: recordPositions.get(latest) };
    }).filter(Boolean).sort((a, b) => a.position - b.position);
    const emptyBox = document.getElementById("record-empty");
    emptyBox.hidden = visibleGroups.length > 0;
    emptyBox.querySelector("p").textContent = records.length
      ? selectedRecordPeriod.slice(0, 4) + "년 " + Number(selectedRecordPeriod.slice(5)) + "월 기록이 없어요."
      : "아직 기록이 없어요.";

    let groupIndex = 0;
    for (const groupData of visibleGroups) {
      const { typeName, nickname, latest, previousRecords } = groupData;
      const group = document.createElement("div");
      group.className = "record-history-group";
      list.append(group);

      const previousPanel = document.createElement("div");
      previousPanel.className = "record-history-previous";
      previousPanel.id = "record-history-previous-" + groupIndex;

      const detailFor = (record) => record.date + " · 체감 " + temperatureText(record.feelsLike)
        + (record.inner ? " · " + record.inner : "") + (record.manualTemp ? " · 직접 입력" : "");
      const labelFor = (record) => record.outer || (typeName + (nickname ? " · " + nickname : ""));
      const latestCard = appendRecommendation(group, {
        typeName,
        label: labelFor(latest),
        detail: detailFor(latest) + (previousRecords.length ? " · 이전 기록 " + previousRecords.length + "개 보기" : ""),
        ratingText: ratings[latest.rating] || "기록",
        ratingClass: "rating-" + (latest.rating || "base"),
      });
      latestCard.classList.add("record-history-option");
      latestCard.tabIndex = 0;
      latestCard.setAttribute("role", previousRecords.length ? "button" : "group");
      latestCard.setAttribute("aria-label", latest.date + " " + labelFor(latest) + " 기록"
        + (previousRecords.length ? ". 눌러서 이전 기록 " + previousRecords.length + "개 보기" : "")
        + ". 길게 누르거나 Delete 키를 눌러 삭제할 수 있어요.");
      enableRecordDeletion(latestCard, latest);

      if (previousRecords.length) {
        latestCard.setAttribute("aria-controls", previousPanel.id);
        latestCard.setAttribute("aria-expanded", "false");
        latestCard.addEventListener("click", () => {
          previousPanel.hidden = !previousPanel.hidden;
          latestCard.setAttribute("aria-expanded", String(!previousPanel.hidden));
        });
        latestCard.addEventListener("keydown", (event) => {
          if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
            event.preventDefault();
            latestCard.click();
          }
        });

        previousPanel.hidden = true;
        group.append(previousPanel);
        for (const record of previousRecords) {
          const previousCard = appendRecommendation(previousPanel, {
            typeName,
            label: labelFor(record),
            detail: detailFor(record),
            ratingText: ratings[record.rating] || "기록",
            ratingClass: "rating-" + (record.rating || "base"),
          });
          previousCard.classList.add("record-history-option", "record-history-previous-option");
          previousCard.tabIndex = 0;
          previousCard.setAttribute("aria-label", record.date + " " + labelFor(record)
            + " 기록. 길게 누르거나 Delete 키를 눌러 삭제할 수 있어요.");
          enableRecordDeletion(previousCard, record);
        }
      } else {
        latestCard.classList.add("record-history-single");
      }
      groupIndex += 1;
    }
  }

  function renderOuterTypeOptions() {
    outerTypesContainer.replaceChildren();
    for (const outerType of outerTypes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "outer-type-option";
      button.setAttribute("aria-pressed", String(selectedOuterType === outerType.name));
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 64 64");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      for (const shape of outerType.paths) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", shape);
        icon.append(path);
      }
      const label = document.createElement("span");
      label.textContent = outerType.name;
      button.append(icon, label);
      button.addEventListener("click", () => selectOuterType(outerType.name));
      outerTypesContainer.append(button);
    }
  }

  function selectOuterType(type, nickname = "") {
    selectedOuterType = type;
    outerNickname.value = nickname;
    renderOuterTypeOptions();
  }

  function deleteRecord(record) {
    if (!window.confirm(record.outer + " 기록을 삭제할까요?")) return;
    try {
      if (!storage.deleteRecord(record.id)) {
        notice.textContent = "기록을 찾지 못했어요. 목록을 새로 고쳤어요.";
      } else {
        notice.textContent = "기록을 삭제했어요.";
      }
      notice.hidden = false;
      renderRecords();
    } catch {
      notice.textContent = "기록을 삭제하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
      notice.hidden = false;
    }
  }

  function enableRecordDeletion(card, record) {
    let pressTimer = null;
    let longPressTriggered = false;
    const cancelPress = () => {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    };
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      cancelPress();
      longPressTriggered = false;
      pressTimer = window.setTimeout(() => {
        longPressTriggered = true;
        deleteRecord(record);
      }, 600);
    });
    card.addEventListener("click", (event) => {
      if (!longPressTriggered) return;
      longPressTriggered = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    });
    card.addEventListener("pointerup", cancelPress);
    card.addEventListener("pointerleave", cancelPress);
    card.addEventListener("pointercancel", cancelPress);
    card.addEventListener("contextmenu", (event) => event.preventDefault());
    card.addEventListener("keydown", (event) => {
      if (event.key === "Delete" && !event.repeat) {
        event.preventDefault();
        deleteRecord(record);
      }
    });
  }

  function temperatureText(value) {
    return (value > 0 ? "+" : "") + value.toFixed(1) + "°C";
  }

  function precipitationText(value) {
    return value === "rain" ? "비" : value === "snow" ? "눈" : "강수 없음";
  }

  function renderWeatherIllustration(condition) {
    const art = document.getElementById("weather-art");
    const svgNamespace = "http://www.w3.org/2000/svg";
    const cloud = "M25 62h56a16 16 0 0 0 0-32 23 23 0 0 0-44-6 17 17 0 0 0-12 38z";
    const make = (tag, attrs = {}) => {
      const element = document.createElementNS(svgNamespace, tag);
      for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
      return element;
    };
    const scenes = {
      sunny: [
        { tag: "path", attrs: { d: "M34 7v8M34 55v8M10 31h8M50 31h8M17 14l6 6M45 44l6 6M51 14l-6 6M23 44l-6 6", stroke: "#ffdc54", "stroke-width": 4, "stroke-linecap": "round" } },
        { tag: "circle", attrs: { cx: 34, cy: 31, r: 18, fill: "#ffdc54" } },
      ],
      "partly-cloudy": [
        { tag: "path", attrs: { d: "M39 13v6M20 32h6M53 20l-5 5M24 19l4 4", stroke: "#ffdc54", "stroke-width": 3.5, "stroke-linecap": "round" } },
        { tag: "circle", attrs: { cx: 39, cy: 31, r: 17, fill: "#ffdc54" } },
        { tag: "path", attrs: { d: cloud, fill: "#c6e7f8" } },
        { tag: "path", attrs: { d: cloud, fill: "#fff" } },
      ],
      cloudy: [
        { tag: "path", attrs: { d: "M29 63h53a16 16 0 0 0-1-32 23 23 0 0 0-42-5 17 17 0 0 0-10 37z", fill: "#bcd8ea" } },
        { tag: "path", attrs: { d: cloud, fill: "#fff" } },
      ],
      rain: [
        { tag: "path", attrs: { d: "M25 57h56a16 16 0 0 0 0-32 23 23 0 0 0-44-6 17 17 0 0 0-12 38z", fill: "#d6e8f3" } },
        { tag: "path", attrs: { d: "M34 67l-3 8M54 67l-3 8M74 67l-3 8", stroke: "#6ac4ed", "stroke-width": 4, "stroke-linecap": "round" } },
      ],
      snow: [
        { tag: "path", attrs: { d: "M25 57h56a16 16 0 0 0 0-32 23 23 0 0 0-44-6 17 17 0 0 0-12 38z", fill: "#d6e8f3" } },
        { tag: "path", attrs: { d: "M36 68v8M32 70l8 4M40 70l-8 4M57 68v8M53 70l8 4M61 70l-8 4M78 68v8M74 70l8 4M82 70l-8 4", stroke: "#fff", "stroke-width": 2.5, "stroke-linecap": "round" } },
      ],
    };
    const labels = { sunny: "화창한 날씨", "partly-cloudy": "구름 조금 낀 날씨", cloudy: "흐린 날씨", rain: "비 오는 날씨", snow: "눈 오는 날씨" };
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", "0 0 120 90");
    svg.setAttribute("aria-hidden", "true");
    const defs = make("defs");
    const gradients = [
      ["sun-fill", [["0%", "#fff6b0"], ["62%", "#ffd84d"], ["100%", "#ffad36"]]],
      ["cloud-fill", [["0%", "#ffffff"], ["100%", "#d9f1ff"]]],
      ["cloud-shadow", [["0%", "#c9eaff"], ["100%", "#8fcaf0"]]],
      ["rain-fill", [["0%", "#e8f7ff"], ["100%", "#b8d9ef"]]],
    ];
    for (const [id, stops] of gradients) {
      const gradient = make("linearGradient", { id, x1: "0", y1: "0", x2: "0.2", y2: "1" });
      for (const [offset, color] of stops) gradient.append(make("stop", { offset, "stop-color": color }));
      defs.append(gradient);
    }
    const glow = make("radialGradient", { id: "sun-glow" });
    glow.append(make("stop", { offset: "0%", "stop-color": "#fff7c2", "stop-opacity": "0.8" }));
    glow.append(make("stop", { offset: "100%", "stop-color": "#fff7c2", "stop-opacity": "0" }));
    defs.append(glow);
    svg.append(defs);
    if (condition === "sunny" || condition === "partly-cloudy") {
      svg.append(make("circle", { cx: "43", cy: "38", r: "36", fill: "url(#sun-glow)" }));
    }
    for (const shape of scenes[condition] || scenes.sunny) {
      const attrs = { ...shape.attrs };
      if (attrs.fill === "#ffdc54") attrs.fill = "url(#sun-fill)";
      if (attrs.fill === "#fff") attrs.fill = "url(#cloud-fill)";
      if (attrs.fill === "#c6e7f8" || attrs.fill === "#bcd8ea") attrs.fill = "url(#cloud-shadow)";
      if (attrs.fill === "#d6e8f3") attrs.fill = "url(#rain-fill)";
      svg.append(make(shape.tag, attrs));
    }
    art.replaceChildren(svg);
    art.setAttribute("aria-label", labels[condition] || labels.sunny);
  }

  function renderWeather(target, result) {
    const today = weather.localDate(new Date());
    const dayLabel = result.date === today ? "오늘"
      : result.date === weather.previousDate(today) ? "어제" : "내일 기준";
    const dateLabel = result.date.replaceAll("-", ".") + " · " + dayLabel;
    if (target.id === "weather-caption") {
      document.getElementById("weather-date").textContent = dateLabel;
      renderWeatherIllustration(result.condition || (result.precip === "none" ? "sunny" : result.precip));
      document.querySelector("#home .temperature").firstChild.textContent = String(Math.round(result.feelsLike));
      target.textContent = "기온 " + temperatureText(result.temp) + " · " + precipitationText(result.precip);
      return;
    }
    target.textContent = dateLabel + " · 체감 " + temperatureText(result.feelsLike)
      + " · 기온 " + temperatureText(result.temp) + " · " + precipitationText(result.precip);
  }

  async function renderTemperatureComparison(todayWeather) {
    const comparison = document.getElementById("temperature-comparison");
    comparison.hidden = true;
    comparison.textContent = "";
    if (!settings || todayWeather.manualTemp) return;

    try {
      const previousDate = weather.previousDate(todayWeather.date);
      const previousWeather = await weather.fetchForDate(settings, previousDate);
      if (currentWeather !== todayWeather) return;
      const difference = Math.round(todayWeather.temp - previousWeather.temp);
      const today = weather.localDate(new Date());
      const referenceLabel = previousDate === today ? "오늘보다" : "어제보다";
      const differenceText = difference > 0 ? "+" + difference : String(difference);
      comparison.textContent = referenceLabel + " " + differenceText + "°";
      comparison.hidden = false;
    } catch {
      comparison.hidden = true;
    }
  }

  function basicOuterSuggestions(feelsLike) {
    if (feelsLike <= -1) return ["패딩", "무스탕", "후리스", "경량패딩", "가죽재킷", "블레이저", "가디건", "바람막이", "셔츠", "기타"];
    if (feelsLike <= 5) return ["패딩", "경량패딩", "후리스", "무스탕", "가죽재킷", "블레이저", "가디건", "바람막이", "셔츠", "기타"];
    if (feelsLike <= 10) return ["패딩", "무스탕", "블레이저", "경량패딩", "가죽재킷", "후리스", "가디건", "바람막이", "셔츠", "기타"];
    if (feelsLike <= 15) return ["경량패딩", "가디건", "바람막이", "블레이저", "셔츠", "후리스", "가죽재킷", "패딩", "무스탕", "기타"];
    if (feelsLike <= 20) return ["가디건", "바람막이", "셔츠", "경량패딩", "블레이저", "가죽재킷", "후리스", "패딩", "무스탕", "기타"];
    return ["셔츠", "가디건", "바람막이", "기타", "경량패딩", "블레이저", "가죽재킷", "후리스", "패딩", "무스탕"];
  }

  function createRecommendationIcon(typeName) {
    const outerType = outerTypes.find((item) => item.name === typeName)
      || outerTypes.find((item) => item.name === "기타");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 64 64");
    icon.setAttribute("aria-hidden", "true");
    for (const pathData of outerType.paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    }
    return icon;
  }

  function appendRecommendation(list, { typeName, label, detail = "", ratingText, ratingClass = "rating-base" }) {
    const card = document.createElement("article");
    card.className = "recommendation-option";
    const iconWrap = document.createElement("span");
    iconWrap.className = "recommendation-icon";
    iconWrap.append(createRecommendationIcon(typeName));
    const copy = document.createElement("div");
    copy.className = "recommendation-copy";
    const outer = document.createElement("strong");
    outer.textContent = label;
    copy.append(outer);
    if (detail) {
      const description = document.createElement("span");
      description.textContent = detail;
      copy.append(description);
    }
    const rating = document.createElement("span");
    rating.className = "recommendation-rating " + ratingClass;
    rating.textContent = ratingText;
    card.append(iconWrap, copy, rating);
    list.append(card);
    return card;
  }

  function renderRecommendations(result) {
    const panel = document.getElementById("recommendations");
    const message = document.getElementById("recommendation-message");
    const list = document.getElementById("recommendation-list");
    const records = rules.recommend(storage.loadData().records, result.feelsLike, result.precip);
    panel.hidden = false;
    list.replaceChildren();
    document.getElementById("recommendation-title").textContent = "오늘의 추천 아우터";
    if (!records.length) {
      message.hidden = false;
      message.textContent = rules.basicGuide(result.feelsLike);
    } else {
      message.hidden = true;
    }

    const ratings = { ok: "적당", cold: "추웠음", hot: "더웠음" };
    const hasComfortableRecord = records.some((record) => record.rating === "ok");
    const selectedRecords = records.slice(0, hasComfortableRecord ? 3 : 2);
    const shownTypes = new Set();
    for (const record of selectedRecords) {
      const typeName = record.outerType || record.outer.split(" · ")[0];
      shownTypes.add(typeName);
      appendRecommendation(list, {
        typeName,
        label: record.outer,
        detail: record.date + " · 체감 " + temperatureText(record.feelsLike)
          + (record.inner ? " · " + record.inner : ""),
        ratingText: ratings[record.rating],
        ratingClass: "rating-" + record.rating,
      });
      if (result.precip !== "none" && record.precip === result.precip) {
        const condition = document.createElement("span");
        condition.className = "record-condition";
        condition.textContent = precipitationText(record.precip) + " 온 날";
        list.lastElementChild.querySelector("strong").append(condition);
      }
    }
    for (const typeName of basicOuterSuggestions(result.feelsLike)) {
      if (list.children.length >= 3) break;
      if (shownTypes.has(typeName)) continue;
      appendRecommendation(list, { typeName, label: typeName, ratingText: "기본 추천" });
      shownTypes.add(typeName);
    }
  }

  async function fetchWeather() {
    const caption = document.getElementById("weather-caption");
    const retry = document.getElementById("load-weather");
    const today = weather.localDate(new Date());
    document.getElementById("weather-date").textContent = today.replaceAll("-", ".") + " · 오늘";
    renderWeatherIllustration("sunny");
    if (!settings) {
      document.getElementById("temperature-comparison").hidden = true;
      caption.textContent = "위치 화면에서 지역과 외출 시간을 먼저 선택해 주세요.";
      return;
    }
    caption.textContent = "날씨를 불러오는 중이에요.";
    document.getElementById("temperature-comparison").hidden = true;
    retry.hidden = true;
    try {
      currentWeather = await weather.getWeather(settings);
      renderWeather(caption, currentWeather);
      renderTemperatureComparison(currentWeather);
      renderRecommendations(currentWeather);
    } catch {
      currentWeather = null;
      document.getElementById("temperature-comparison").hidden = true;
      caption.textContent = "날씨를 불러오지 못했어요. 기록할 때 온도를 직접 입력할 수 있어요.";
      retry.hidden = false;
    }
  }

  async function loadRecordWeather() {
    recordError.hidden = true;
    manualTemperature.hidden = true;
    recordWeather = null;
    document.getElementById("record-weather").textContent = "선택한 날짜의 날씨를 불러오는 중이에요.";
    const selectedDate = recordDate.value;
    try {
      if (!settings) throw new Error("위치 화면에서 지역과 외출 시간을 먼저 저장해 주세요.");
      const today = weather.localDate(new Date());
      if (!selectedDate || selectedDate > today) throw new Error("오늘 또는 그 이전 날짜를 선택해 주세요.");
      const result = await weather.fetchForDate(settings, selectedDate);
      if (recordDate.value !== selectedDate) return;
      recordWeather = result;
      renderWeather(document.getElementById("record-weather"), recordWeather);
    } catch (error) {
      if (recordDate.value !== selectedDate) return;
      recordError.textContent = (error.message || "날씨를 불러오지 못했어요.")
        + " 온도와 아우터, 평가를 입력해 기록할 수 있어요.";
      recordError.hidden = false;
      manualTemperature.hidden = false;
      document.getElementById("record-weather").textContent = "날씨 조회에 실패했어요.";
    }
  }

  function prepareRecord() {
    const today = weather.localDate(new Date());
    recordDate.value = today;
    recordDate.max = today;
    recordDate.min = "1940-01-01";
    updateRecordDateLabels();
    selectedOuterType = "";
    outerNickname.value = "";
    renderOuterTypeOptions();
    loadRecordWeather();
  }

  function updateRecordDateLabels() {
    document.getElementById("record-rating-legend").textContent = "그날 어땠나요?";
  }

  function saveRecord(event) {
    event.preventDefault();
    recordError.hidden = true;
    const nickname = outerNickname.value.trim();
    const rating = recordForm.querySelector('input[name="rating"]:checked')?.value;
    if (!selectedOuterType || !rating) {
      recordError.textContent = "아우터 종류와 그날의 느낌을 선택해 주세요.";
      recordError.hidden = false;
      return;
    }
    const outer = nickname ? selectedOuterType + " · " + nickname : selectedOuterType;
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
      conditions = { date: recordDate.value, feelsLike, temp, precip: "none", manualTemp: true };
    }
    const record = {
      id: window.crypto.randomUUID(), date: conditions.date, outer,
      outerType: selectedOuterType, outerNickname: nickname,
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
    showSaveNotice("선택한 날짜의 옷을 기록했어요.", 5000);
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
      showError("위치 정보를 저장하지 못했어요. 브라우저의 저장 허용 여부와 남은 공간을 확인해 주세요. 기존 자료는 유지돼요.");
      return;
    }
    settings = nextSettings;
    updateLocationName();
    showSaveNotice("위치 정보를 저장했어요.", 5000);
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
    const screenTitle = heading?.textContent
      || (activeScreen.id === "settings" ? "위치 설정" : activeScreen.id === "add" ? "기록 추가" : "오늘");
    document.title = screenTitle + " · quickwear";
    const dashboardScreen = ["home", "records", "add", "settings"].includes(activeScreen.id);
    document.body.classList.toggle("dashboard-view", dashboardScreen);
    document.body.classList.toggle("home-view", activeScreen.id === "home");
    if (activeScreen.id === "home") fetchWeather();
    if (activeScreen.id === "records") renderRecords();
    if (activeScreen.id === "add") prepareRecord();
    if (moveFocus) {
      (heading || activeScreen).focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener("hashchange", () => showScreen(true));
  city.addEventListener("change", fillDistricts);
  start.addEventListener("input", validateTimes);
  end.addEventListener("input", validateTimes);
  form.addEventListener("submit", saveSettings);
  form.addEventListener("input", () => { notice.hidden = true; });
  const accountStatus = document.getElementById("account-status");
  document.getElementById("account-login").addEventListener("click", () => {
    accountStatus.textContent = "계정 로그인 기능은 아직 연결되지 않았어요.";
    accountStatus.hidden = false;
  });
  document.querySelector(".account-entry").addEventListener("input", () => {
    accountStatus.hidden = true;
  });
  retryButton.addEventListener("click", loadRegions);
  document.getElementById("load-weather").addEventListener("click", fetchWeather);
  document.getElementById("previous-record-year").addEventListener("click", () => changeRecordPeriod("year", -1));
  document.getElementById("next-record-year").addEventListener("click", () => changeRecordPeriod("year", 1));
  document.getElementById("previous-record-month").addEventListener("click", () => changeRecordPeriod("month", -1));
  document.getElementById("next-record-month").addEventListener("click", () => changeRecordPeriod("month", 1));
  recordDate.addEventListener("change", () => {
    updateRecordDateLabels();
    loadRecordWeather();
  });
  recordForm.addEventListener("submit", saveRecord);
  window.addEventListener("storage", (event) => {
    if (event.key !== storage.key && event.key !== null) return;
    readSettings();
    restoreForm();
    notice.textContent = settings ? "다른 화면에서 변경한 위치 정보를 불러왔어요." : "위치 정보가 지워졌어요. 다시 선택해 주세요.";
    notice.hidden = false;
    if (!settings) window.location.hash = "settings";
  });
  readSettings();
  if (!settings) window.history.replaceState(null, "", "#settings");
  updateRecordPeriodPicker();
  showScreen(false);
  loadRegions();
})();

