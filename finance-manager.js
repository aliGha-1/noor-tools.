"use strict";

/*
 * NOOR TOOLS
 * Finance Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const STORAGE_KEY = "noor_tools_finance_v1";

  const TYPES = ["income", "expense"];

  function readEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const entries = JSON.parse(raw);
      return Array.isArray(entries) ? entries : [];
    } catch (error) {
      console.error("تعذر قراءة السجل المالي:", error);
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function validateEntry(data) {
    if (!data || typeof data !== "object") {
      throw new Error("بيانات العملية المالية غير صالحة.");
    }

    if (!TYPES.includes(data.type)) {
      throw new Error("نوع العملية يجب أن يكون income أو expense.");
    }

    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("أدخل مبلغًا صحيحًا أكبر من صفر.");
    }

    const description = String(data.description ?? "").trim();

    if (!description) {
      throw new Error("اكتب وصف العملية المالية.");
    }

    return {
      type: data.type,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      description,
      category: String(data.category ?? "عام").trim() || "عام",
      date: data.date || new Date().toISOString(),
      notes: String(data.notes ?? "").trim()
    };
  }

  function add(data) {
    const validated = validateEntry(data);
    const entries = readEntries();

    const entry = {
      id: globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...validated,
      createdAt: new Date().toISOString()
    };

    entries.push(entry);
    saveEntries(entries);

    return entry;
  }

  function getAll(filters = {}) {
    let entries = readEntries();

    if (filters.type) {
      entries = entries.filter(
        entry => entry.type === filters.type
      );
    }

    if (filters.from) {
      const from = new Date(filters.from).getTime();

      entries = entries.filter(
        entry => new Date(entry.date).getTime() >= from
      );
    }

    if (filters.to) {
      const to = new Date(filters.to);

      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
        to.setHours(23, 59, 59, 999);
      }

      const timestamp = to.getTime();

      entries = entries.filter(
        entry => new Date(entry.date).getTime() <= timestamp
      );
    }

    if (filters.category) {
      entries = entries.filter(
        entry => entry.category === filters.category
      );
    }

    return entries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  function remove(id) {
    const entries = readEntries();
    const updated = entries.filter(
      entry => entry.id !== String(id)
    );

    if (updated.length === entries.length) {
      return false;
    }

    saveEntries(updated);
    return true;
  }

  function summarize(filters = {}) {
    const entries = getAll(filters);

    const income = entries
      .filter(entry => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);

    const expenses = entries
      .filter(entry => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
      transactionCount: entries.length
    };
  }

  function exportData() {
    return {
      format: "NOOR_TOOLS_FINANCE",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: readEntries()
    };
  }

  window.NoorFinance = Object.freeze({
    add,
    getAll,
    remove,
    summarize,
    export: exportData
  });
})();
