"use strict";

window.OutwearStorage = (() => {
  const key = "outwear";
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const outerTypes = ["패딩", "경량패딩", "무스탕", "후리스", "가죽재킷", "블레이저", "가디건", "바람막이", "셔츠", "기타"];
  const previousOuterTypes = ["코트", "트렌치코트", "재킷"];

  function read() {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { settings: null, outers: [], records: [] };

    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("저장된 자료를 읽을 수 없어요.");
    }
    return data;
  }

  function validSettings(settings) {
    return Boolean(settings
      && typeof settings.region === "string" && settings.region.trim()
      && Number.isFinite(settings.lat) && Math.abs(settings.lat) <= 90
      && Number.isFinite(settings.lon) && Math.abs(settings.lon) <= 180
      && timePattern.test(settings.outStart) && timePattern.test(settings.outEnd)
      && settings.outStart < settings.outEnd);
  }

  function loadSettings() {
    const settings = read().settings;
    return validSettings(settings) ? settings : null;
  }

  function saveSettings(settings) {
    if (!validSettings(settings)) throw new Error("설정 값을 확인해 주세요.");
    // Read the latest document so saving settings preserves records and other fields.
    const data = read();
    data.settings = settings;
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  function loadData() {
    const data = read();
    return {
      ...data,
      settings: validSettings(data.settings) ? data.settings : null,
      outers: normalizeOuters(data.outers),
      records: Array.isArray(data.records) ? data.records : [],
    };
  }

  function normalizeOuters(outers) {
    if (!Array.isArray(outers)) return [];
    return outers.map((item) => {
      if (typeof item === "string") return { type: "기타", nickname: item };
      if (item && outerTypes.includes(item.type) && typeof item.nickname === "string") {
        return { type: item.type, nickname: item.nickname };
      }
      if (item && previousOuterTypes.includes(item.type) && typeof item.nickname === "string") {
        return { type: "기타", nickname: item.nickname ? item.type + " · " + item.nickname : item.type };
      }
      return null;
    }).filter(Boolean);
  }

  function saveRecord(record) {
    if (!record || !record.outer || !outerTypes.includes(record.outerType)
      || typeof record.outerNickname !== "string" || !["cold", "ok", "hot"].includes(record.rating)
      || !Number.isFinite(record.feelsLike) || !Number.isFinite(record.temp)
      || !["none", "rain", "snow"].includes(record.precip)) {
      throw new Error("기록 내용을 확인해 주세요.");
    }
    const data = read();
    data.outers = normalizeOuters(data.outers);
    data.records = Array.isArray(data.records) ? data.records : [];
    if (!data.outers.some((item) => item.type === record.outerType && item.nickname === record.outerNickname)) {
      data.outers.push({ type: record.outerType, nickname: record.outerNickname });
    }
    data.records.push(record);
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  function deleteRecord(id) {
    if (typeof id !== "string" || !id) throw new Error("삭제할 기록을 찾을 수 없어요.");
    const data = read();
    data.records = Array.isArray(data.records) ? data.records : [];
    const records = data.records.filter((record) => record.id !== id);
    if (records.length === data.records.length) return false;
    data.records = records;
    window.localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  return Object.freeze({ key, loadSettings, loadData, saveSettings, saveRecord, deleteRecord, validSettings });
})();

