"use strict";

/*
 * NOOR TOOLS
 * Barcode Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const PREFIX = "NT";

  function generateCode() {
    const randomPart = globalThis.crypto?.getRandomValues
      ? Array.from(
          globalThis.crypto.getRandomValues(new Uint32Array(2))
        )
          .map(number => number.toString(36).toUpperCase())
          .join("")
          .slice(0, 10)
      : `${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 7)}`.toUpperCase();

    return `${PREFIX}-${randomPart}`;
  }

  function normalizeCode(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  function validateCode(value) {
    const code = normalizeCode(value);

    if (!code) {
      throw new Error("كود الباركود فارغ.");
    }

    if (code.length > 100) {
      throw new Error("كود الباركود أطول من المسموح.");
    }

    return code;
  }

  function findProductByCode(code) {
    if (!window.NoorDB ||
        typeof window.NoorDB.getProducts !== "function") {
      throw new Error("قاعدة بيانات الأصناف غير متاحة.");
    }

    const normalized = validateCode(code);
    const products = window.NoorDB.getProducts();

    return products.find(product => {
      const candidates = [
        product.code,
        product.barcode,
        product.id
      ];

      return candidates.some(
        value => normalizeCode(value) === normalized
      );
    }) || null;
  }

  function createProductCode() {
    const existing = new Set();

    if (window.NoorDB &&
        typeof window.NoorDB.getProducts === "function") {
      window.NoorDB.getProducts().forEach(product => {
        [product.code, product.barcode, product.id]
          .filter(Boolean)
          .forEach(value => existing.add(normalizeCode(value)));
      });
    }

    let code;

    do {
      code = generateCode();
    } while (existing.has(code));

    return code;
  }

  function prepareProduct(product) {
    if (!product || typeof product !== "object") {
      throw new Error("بيانات الصنف غير صالحة.");
    }

    return {
      ...product,
      barcode: product.barcode
        ? validateCode(product.barcode)
        : createProductCode()
    };
  }

  window.NoorBarcode = Object.freeze({
    generate: generateCode,
    normalize: normalizeCode,
    validate: validateCode,
    findProduct: findProductByCode,
    createProductCode,
    prepareProduct
  });
})();
