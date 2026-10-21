"use strict";

window.NoorStockAlerts = (() => {
  function getQuantity(product) {
    const value = Number(product.quantity ?? product.stock ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function analyze(products, options = {}) {
    if (!Array.isArray(products)) {
      throw new Error("قائمة الأصناف غير صحيحة.");
    }

    const threshold = Number.isFinite(Number(options.threshold))
      ? Math.max(0, Number(options.threshold))
      : 5;

    const outOfStock = [];
    const lowStock = [];
    const healthyStock = [];

    for (const product of products) {
      if (!product || typeof product !== "object") continue;

      const quantity = getQuantity(product);

      const item = {
        id: product.id ?? product.code ?? null,
        name: product.name || "صنف بدون اسم",
        quantity,
        threshold
      };

      if (quantity <= 0) {
        outOfStock.push(item);
      } else if (quantity <= threshold) {
        lowStock.push(item);
      } else {
        healthyStock.push(item);
      }
    }

    return {
      total: outOfStock.length + lowStock.length + healthyStock.length,
      outOfStock,
      lowStock,
      healthyStock,
      needsAttention: outOfStock.length + lowStock.length
    };
  }

  function getAlerts(products, options = {}) {
    const report = analyze(products, options);

    return [
      ...report.outOfStock.map(item => ({
        ...item,
        type: "out_of_stock",
        message: `الصنف ${item.name} نفد من المخزون.`
      })),
      ...report.lowStock.map(item => ({
        ...item,
        type: "low_stock",
        message: `مخزون الصنف ${item.name} منخفض: ${item.quantity}.`
      }))
    ];
  }

  function getFromDatabase(options = {}) {
    if (!window.NoorDB ||
        typeof window.NoorDB.getProducts !== "function") {
      throw new Error("قاعدة بيانات الأصناف غير متاحة.");
    }

    const products = window.NoorDB.getProducts();
    return analyze(products, options);
  }

  return Object.freeze({
    analyze,
    getAlerts,
    getFromDatabase
  });
})();
