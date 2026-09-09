(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TextForgeUniversalCommandCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const normalizedItemCache = new WeakMap();

  function normalize(value) {
    const source = String(value || "");
    const compatible = /[\uFF00-\uFFEF\u2460-\u24FF]/.test(source) ? source.normalize("NFKC") : source;
    return compatible.toLowerCase().trim();
  }

  function normalizedItem(item) {
    if (item && typeof item === "object" && normalizedItemCache.has(item)) return normalizedItemCache.get(item);
    const value = { title: normalize(item?.title), aliases: normalize(item?.aliases), searchText: normalize(item?.searchText) };
    if (item && typeof item === "object") normalizedItemCache.set(item, value);
    return value;
  }

  function scoreTerms(item, terms) {
    if (!terms.length) return Number(item.recentScore) || 0;
    const { title, aliases, searchText } = normalizedItem(item);
    let total = 0;
    for (const term of terms) {
      if (title === term) total += 120;
      else if (title.startsWith(term)) total += 80;
      else if (title.includes(term)) total += 55;
      else if (aliases.includes(term)) total += 35;
      else if (searchText.includes(term)) total += 12;
      else return -1;
    }
    return total + (Number(item.recentScore) || 0);
  }

  function score(item, query) {
    return scoreTerms(item, normalize(query).split(/\s+/).filter(Boolean));
  }

  function search(items, query, limit = 40) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return items
      .map((item, index) => ({ item, index, score: scoreTerms(item, terms) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .map((entry) => entry.item);
  }

  return { normalize, score, search };
});
