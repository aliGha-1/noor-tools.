"use strict";

window.NoorActivityLog = (() => {
  const STORAGE_KEY = "noor_tools_activity_log_v1";
  const MAX_RECORDS = 1000;

  function readAll() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: failed to read activity log", error);
      return [];
    }
  }

  function add(action, details = {}) {
    if (typeof action !== "string" || !action.trim()) {
      throw new Error("يجب تحديد نوع العملية.");
    }

    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      action: action.trim(),
      details,
      createdAt: new Date().toISOString()
    };

    const records = readAll();
    records.unshift(record);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_RECORDS))
      );
      return record;
    } catch (error) {
      console.error("NOOR TOOLS: failed to save activity", error);
      throw new Error("تعذر حفظ سجل العملية على هذا الجهاز.");
    }
  }

  function getAll(options = {}) {
    const limit = Number.isInteger(options.limit)
      ? Math.max(0, options.limit)
      : MAX_RECORDS;

    return readAll()
      .filter(record => {
        if (!options.action) return true;
        return record.action === options.action;
      })
      .slice(0, limit);
  }

  function search(query) {
    const term = String(query || "").trim().toLowerCase();

    if (!term) return getAll();

    return readAll().filter(record =>
      record.action.toLowerCase().includes(term) ||
      JSON.stringify(record.details).toLowerCase().includes(term)
    );
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }

  function exportJSON() {
    return JSON.stringify({
      format: "NOOR_TOOLS_ACTIVITY_LOG",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: readAll()
    }, null, 2);
  }

  return Object.freeze({
    add,
    getAll,
    search,
    clear,
    exportJSON
  });
})();
