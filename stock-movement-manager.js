"use strict";

window.NoorStockMovement = (() => {
  const STORAGE_KEY = "noor_tools_stock_movements_v1";
  const MAX_RECORDS = 2000;

  function readAll() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read stock movements", error);
      return [];
    }
  }

  function record(movement) {
    if (!movement || typeof movement !== "object") {
      throw new Error("بيانات حركة المخزون غير صحيحة.");
    }

    const productId = String(movement.productId ?? "").trim();
    const type = movement.type;
    const quantity = Number(movement.quantity);

    if (!productId) {
      throw new Error("رقم الصنف مطلوب.");
    }

    if (!["in", "out", "adjustment"].includes(type)) {
      throw new Error("نوع حركة المخزون غير صحيح.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("الكمية يجب أن تكون أكبر من صفر.");
    }

    const entry = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      productId,
      type,
      quantity,
      reason: String(movement.reason ?? "").trim(),
      reference: String(movement.reference ?? "").trim(),
      createdAt: new Date().toISOString()
    };

    const movements = readAll();
    movements.unshift(entry);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(movements.slice(0, MAX_RECORDS))
      );
    } catch (error) {
      console.error("NOOR TOOLS: cannot save stock movement", error);
      throw new Error("تعذر حفظ حركة المخزون.");
    }

    return entry;
  }

  function getAll(options = {}) {
    let movements = readAll();

    if (options.productId !== undefined) {
      const id = String(options.productId);
      movements = movements.filter(item => item.productId === id);
    }

    if (options.type) {
      movements = movements.filter(item => item.type === options.type);
    }

    if (options.from) {
      movements = movements.filter(item =>
        item.createdAt >= new Date(options.from).toISOString()
      );
    }

    if (options.to) {
      movements = movements.filter(item =>
        item.createdAt <= new Date(options.to).toISOString()
      );
    }

    return movements;
  }

  function summarize(productId) {
    const movements = getAll({ productId });

    const incoming = movements
      .filter(item => item.type === "in")
      .reduce((sum, item) => sum + item.quantity, 0);

    const outgoing = movements
      .filter(item => item.type === "out")
      .reduce((sum, item) => sum + item.quantity, 0);

    const adjustments = movements
      .filter(item => item.type === "adjustment")
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      productId: String(productId),
      incoming,
      outgoing,
      adjustments,
      movementCount: movements.length
    };
  }

  function exportJSON() {
    return JSON.stringify({
      format: "NOOR_TOOLS_STOCK_MOVEMENTS",
      version: 1,
      exportedAt: new Date().toISOString(),
      movements: readAll()
    }, null, 2);
  }

  return Object.freeze({
    record,
    getAll,
    summarize,
    exportJSON
  });
})();
