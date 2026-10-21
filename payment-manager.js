"use strict";

window.NoorPayments = (() => {
  const STORAGE_KEY = "noor_tools_payments_v1";
  const MAX_RECORDS = 2000;

  function readAll() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read payments", error);
      return [];
    }
  }

  function add(payment) {
    if (!payment || typeof payment !== "object") {
      throw new Error("بيانات الدفعة غير صحيحة.");
    }

    const contactId = String(payment.contactId ?? "").trim();
    const amount = Number(payment.amount);
    const type = payment.type;

    if (!contactId) {
      throw new Error("رقم العميل أو المورد مطلوب.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("قيمة الدفعة يجب أن تكون أكبر من صفر.");
    }

    if (!["received", "paid"].includes(type)) {
      throw new Error("نوع الدفعة يجب أن يكون received أو paid.");
    }

    const entry = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      contactId,
      invoiceId: String(payment.invoiceId ?? "").trim(),
      type,
      amount: Math.round(amount * 100) / 100,
      method: String(payment.method ?? "cash"),
      notes: String(payment.notes ?? "").trim(),
      createdAt: new Date().toISOString()
    };

    const records = readAll();
    records.unshift(entry);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_RECORDS))
      );
    } catch (error) {
      console.error("NOOR TOOLS: cannot save payment", error);
      throw new Error("تعذر حفظ الدفعة على الجهاز.");
    }

    return entry;
  }

  function getAll(filters = {}) {
    return readAll().filter(payment => {
      if (
        filters.contactId !== undefined &&
        payment.contactId !== String(filters.contactId)
      ) {
        return false;
      }

      if (filters.invoiceId && payment.invoiceId !== String(filters.invoiceId)) {
        return false;
      }

      if (filters.type && payment.type !== filters.type) {
        return false;
      }

      return true;
    });
  }

  function summarize(contactId) {
    const records = getAll({ contactId: String(contactId) });

    const received = records
      .filter(item => item.type === "received")
      .reduce((sum, item) => sum + item.amount, 0);

    const paid = records
      .filter(item => item.type === "paid")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      contactId: String(contactId),
      received: Math.round(received * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      count: records.length
    };
  }

  function remove(id) {
    const records = readAll();
    const updated = records.filter(item => item.id !== id);

    if (updated.length === records.length) {
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  function exportJSON() {
    return JSON.stringify({
      format: "NOOR_TOOLS_PAYMENTS",
      version: 1,
      exportedAt: new Date().toISOString(),
      payments: readAll()
    }, null, 2);
  }

  return Object.freeze({
    add,
    getAll,
    summarize,
    remove,
    exportJSON
  });
})();
