"use strict";

window.OutwearStorage = (() => {
  const key = "outwear";
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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
      outers: Array.isArray(data.outers) ? data.outers.filter((name) => typeof name === "string") : [],
      records: Array.isArray(data.records) ? data.records : [],
    };
  }

  function saveRecord(record) {
    if (!record || !record.outer || !["cold", "ok", "hot"].includes(record.rating)
      || !Number.isFinite(record.feelsLike) || !Number.isFinite(record.temp)
      || !["none", "rain", "snow"].includes(record.precip)) {
      throw new Error("기록 내용을 확인해 주세요.");
    }
    const data = read();
    data.outers = Array.isArray(data.outers) ? data.outers : [];
    data.records = Array.isArray(data.records) ? data.records : [];
    if (!data.outers.includes(record.outer)) data.outers.push(record.outer);
    data.records.push(record);
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  return Object.freeze({ key, loadSettings, loadData, saveSettings, saveRecord, validSettings });
})();
