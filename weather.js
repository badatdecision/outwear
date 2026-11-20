"use strict";

window.OutwearWeather = (() => {
  function localDate(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return values.year + "-" + values.month + "-" + values.day;
  }

  function nextDate(date) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + 1);
    return localDate(next);
  }

  function previousDate(date) {
    const previous = new Date(date);
    previous.setUTCDate(previous.getUTCDate() - 1);
    return localDate(previous);
  }

  function hourOf(timestamp) {
    return Number(timestamp.slice(11, 13));
  }

  async function requestWeather(settings, date, dateParameters, fetcher) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(settings.lat), longitude: String(settings.lon),
      hourly: "apparent_temperature,temperature_2m,precipitation,snowfall,cloud_cover",
      timezone: "Asia/Seoul", ...dateParameters,
    });
    const response = await fetcher(url);
    if (!response.ok) throw new Error("날씨를 불러오지 못했어요.");
    const result = await response.json();
    const times = result.hourly?.time;
    if (!Array.isArray(times)) throw new Error("날씨 자료를 읽을 수 없어요.");
    const startHour = Number(settings.outStart.slice(0, 2));
    const endHour = Number(settings.outEnd.slice(0, 2));
    const samples = times.map((time, index) => ({
      time, hour: hourOf(time), apparent: result.hourly.apparent_temperature?.[index],
      temperature: result.hourly.temperature_2m?.[index],
      rain: result.hourly.precipitation?.[index], snow: result.hourly.snowfall?.[index],
      cloudCover: result.hourly.cloud_cover?.[index],
    })).filter((sample) => sample.time.slice(0, 10) === date
      && sample.hour >= startHour && sample.hour < endHour
      && Number.isFinite(sample.apparent) && Number.isFinite(sample.temperature));
    if (!samples.length) throw new Error("외출 시간대의 날씨 자료가 없어요.");
    const hasSnow = samples.some((sample) => Number(sample.snow) > 0);
    const hasRain = samples.some((sample) => Number(sample.rain) > 0);
    const cloudSamples = samples.filter((sample) => Number.isFinite(sample.cloudCover));
    const averageCloudCover = cloudSamples.length
      ? cloudSamples.reduce((sum, sample) => sum + sample.cloudCover, 0) / cloudSamples.length
      : 0;
    return {
      date,
      feelsLike: Number((samples.reduce((sum, sample) => sum + sample.apparent, 0) / samples.length).toFixed(1)),
      temp: Number((samples.reduce((sum, sample) => sum + sample.temperature, 0) / samples.length).toFixed(1)),
      precip: hasSnow ? "snow" : hasRain ? "rain" : "none",
      condition: hasSnow ? "snow" : hasRain ? "rain"
        : averageCloudCover >= 50 ? "cloudy" : averageCloudCover >= 20 ? "partly-cloudy" : "sunny",
      manualTemp: false,
    };
  }

  function fetchForDay(settings, date, fetcher = window.fetch.bind(window)) {
    return requestWeather(settings, date, { start_date: date, end_date: date }, fetcher);
  }

  function fetchForDate(settings, date, fetcher = window.fetch.bind(window)) {
    return requestWeather(settings, date, { past_days: "1", forecast_days: "2" }, fetcher);
  }

  async function getWeather(settings, now = new Date(), fetcher = window.fetch.bind(window)) {
    const today = localDate(now);
    const currentKoreaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now);
    const date = currentKoreaTime >= settings.outEnd ? nextDate(today) : today;
    return fetchForDay(settings, date, fetcher);
  }

  return Object.freeze({ getWeather, fetchForDay, fetchForDate, localDate, previousDate });
})();

