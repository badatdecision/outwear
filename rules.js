"use strict";

window.OutwearRules = (() => {
  const ratingOrder = { ok: 0, cold: 1, hot: 2 };
  const guide = [
    { max: -1, text: "두꺼운 패딩에 목도리·장갑을 챙겨요" },
    { max: 5, text: "겨울 코트나 패딩, 따뜻한 니트" },
    { max: 10, text: "코트나 두꺼운 재킷 (후드티만으로는 부족해요)" },
    { max: 15, text: "가벼운 재킷, 트렌치코트, 가디건" },
    { max: 20, text: "들고 다닐 수 있는 얇은 겉옷" },
    { max: Infinity, text: "아우터 없이도 괜찮아요" },
  ];

  function recommend(records, feelsLike, precip = "none") {
    const inRange = records
      .filter((record) => Number.isFinite(record.feelsLike)
        && Math.abs(record.feelsLike - feelsLike) <= 3
        && Object.hasOwn(ratingOrder, record.rating))
      .slice();
    const samePrecipitation = precip === "none"
      ? []
      : inRange.filter((record) => record.precip === precip);
    const matches = samePrecipitation.length ? samePrecipitation : inRange;
    return matches.sort((a, b) => ratingOrder[a.rating] - ratingOrder[b.rating]
        || Math.abs(a.feelsLike - feelsLike) - Math.abs(b.feelsLike - feelsLike)
        || b.date.localeCompare(a.date));
  }

  function basicGuide(feelsLike) {
    return guide.find((item) => feelsLike <= item.max).text;
  }

  return Object.freeze({ recommend, basicGuide });
})();
