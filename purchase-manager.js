"use strict";

window.NoorPurchases = (() => {
  const STORAGE_KEY = "noor_tools_purchases_v1";
  const MAX_RECORDS = 2000;

  function readAll() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read purchases", error);
      return [];
    }
  }

  function add(purchase) {
    if (!purchase || typeof purchase !== "object") {
      throw new Error("بيانات فاتورة الشراء غير صحيحة.");
    }

    const supplierId = String(purchase.supplierId ?? "").trim();

    if (!supplierId) {
      throw new Error("رقم المورد مطلوب.");
    }

    if (!Array.isArray(purchase.items) || purchase.items.length === 0) {
      throw new Error("أضف صنفًا واحدًا على الأقل.");
    }

    const items = purchase.items.map((item, index) => {
      const productId = String(item.productId ?? "").trim();
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!productId) {
        throw new Error(`رقم الصنف في السطر ${index + 1} مطلوب.`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`كمية الصنف في السطر ${index + 1} غير صحيحة.`);
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`سعر الصنف في السطر ${index + 1} غير صحيح.`);
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

    const records = readAll();

    const entry = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      supplierId,
      invoiceNumber: String(purchase.invoiceNumber ?? "").trim(),
      items,
      total,
      notes: String(purchase.notes ?? "").trim(),
      createdAt: new Date().toISOString()
    };

    records.unshift(entry);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_RECORDS))
      );
    } catch (error) {
      console.error("NOOR TOOLS: cannot save purchase", error);
      throw new Error("تعذر حفظ فاتورة الشراء على الجهاز.");
    }

    return entry;
  }

  function getAll(filters = {}) {
    return readAll().filter(item => {
      if (
        filters.supplierId &&
        item.supplierId !== String(filters.supplierId)
      ) {
        return false;
      }

      if (
        filters.invoiceNumber &&
        item.invoiceNumber !== String(filters.invoiceNumber)
      ) {
        return false;
      }

      return true;
    });
  }

  function summarize(supplierId) {
    const records = getAll(
      supplierId ? { supplierId } : {}
    );

    return {
      count: records.length,
      total: Math.round(
        records.reduce((sum, item) => sum + item.total, 0) * 100
      ) / 100
    };
  }

  function exportJSON() {
    return JSON.stringify({
      format: "NOOR_TOOLS_PURCHASES",
      version: 1,
      exportedAt: new Date().toISOString(),
      purchases: readAll()
    }, null, 2);
  }

  return Object.freeze({
    add,
    getAll,
    summarize,
    exportJSON
  });
})();
