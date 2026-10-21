"use strict";

window.NoorReturns = (() => {
  const STORAGE_KEY = "noor_tools_returns_v1";
  const MAX_RECORDS = 2000;

  function readAll() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read returns", error);
      return [];
    }
  }

  function add(returnData) {
    if (!returnData || typeof returnData !== "object") {
      throw new Error("بيانات المرتجع غير صحيحة.");
    }

    if (!["sale", "purchase"].includes(returnData.type)) {
      throw new Error("نوع المرتجع يجب أن يكون sale أو purchase.");
    }

    if (!Array.isArray(returnData.items) || returnData.items.length === 0) {
      throw new Error("المرتجع يجب أن يحتوي على صنف واحد على الأقل.");
    }

    const items = returnData.items.map((item, index) => {
      const productId = String(item.productId ?? "").trim();
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!productId) {
        throw new Error(`رقم الصنف في السطر ${index + 1} مطلوب.`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`كمية المرتجع في السطر ${index + 1} غير صحيحة.`);
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`سعر المرتجع في السطر ${index + 1} غير صحيح.`);
      }

      return {
        productId,
        quantity,
        price,
        total: Math.round(quantity * price * 100) / 100
      };
    });

    const total = Math.round(
      items.reduce((sum, item) => sum + item.total, 0) * 100
    ) / 100;

    const entry = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      originalInvoiceId: String(returnData.originalInvoiceId ?? "").trim(),
      contactId: String(returnData.contactId ?? "").trim(),
      type: returnData.type,
      items,
      total,
      reason: String(returnData.reason ?? "").trim(),
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
      console.error("NOOR TOOLS: cannot save return", error);
      throw new Error("تعذر حفظ المرتجع.");
    }

    return entry;
  }

  function getAll(filters = {}) {
    return readAll().filter(item => {
      if (filters.type && item.type !== filters.type) return false;

      if (
        filters.originalInvoiceId &&
        item.originalInvoiceId !== String(filters.originalInvoiceId)
      ) {
        return false;
      }

      if (
        filters.contactId &&
        item.contactId !== String(filters.contactId)
      ) {
        return false;
      }

      return true;
    });
  }

  function summarize() {
    const records = readAll();

    const salesReturns = records
      .filter(item => item.type === "sale")
      .reduce((sum, item) => sum + item.total, 0);

    const purchaseReturns = records
      .filter(item => item.type === "purchase")
      .reduce((sum, item) => sum + item.total, 0);

    return {
      count: records.length,
      salesReturns: Math.round(salesReturns * 100) / 100,
      purchaseReturns: Math.round(purchaseReturns * 100) / 100
    };
  }

  return Object.freeze({
    add,
    getAll,
    summarize
  });
})();
