"use strict";

/*
 * NOOR TOOLS
 * Product Search Manager
 * Design & Development: م. علي غريب
 */

(() => {
  function getDatabase() {
    if (!window.NoorDB) {
      throw new Error("قاعدة بيانات NOOR TOOLS غير متاحة.");
    }

    return window.NoorDB;
  }

  function getProducts() {
    const db = getDatabase();

    if (typeof db.getProducts !== "function") {
      throw new Error("قائمة الأصناف غير متاحة.");
    }

    const products = db.getProducts();

    return Array.isArray(products) ? products : [];
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase("ar");
  }

  function search(query, options = {}) {
    const term = normalize(query);
    let products = getProducts();

    if (term) {
      products = products.filter(product => {
        const searchable = [
          product.name,
          product.code,
          product.barcode,
          product.category,
          product.id
        ].map(normalize);

        return searchable.some(value => value.includes(term));
      });
    }

    if (options.category) {
      const category = normalize(options.category);

      products = products.filter(
        product => normalize(product.category) === category
      );
    }

    if (options.lowStock === true) {
      const threshold = Number.isFinite(Number(options.threshold))
        ? Number(options.threshold)
        : Number(window.NoorSettings?.get("lowStockThreshold") ?? 5);

      products = products.filter(product =>
        Number(product.quantity ?? product.stock ?? 0) <= threshold
      );
    }

    if (options.outOfStock === true) {
      products = products.filter(product =>
        Number(product.quantity ?? product.stock ?? 0) <= 0
      );
    }

    if (options.sortBy === "name") {
      products.sort((a, b) =>
        String(a.name ?? "").localeCompare(
          String(b.name ?? ""),
          "ar"
        )
      );
    } else if (options.sortBy === "quantity") {
      products.sort((a, b) =>
        Number(a.quantity ?? a.stock ?? 0) -
        Number(b.quantity ?? b.stock ?? 0)
      );
    } else if (options.sortBy === "price") {
      products.sort((a, b) =>
        Number(a.salePrice ?? a.sellPrice ?? a.price ?? 0) -
        Number(b.salePrice ?? b.sellPrice ?? b.price ?? 0)
      );
    }

    return products;
  }

  function getCategories() {
    const categories = getProducts()
      .map(product => String(product.category ?? "").trim())
      .filter(Boolean);

    return [...new Set(categories)].sort((a, b) =>
      a.localeCompare(b, "ar")
    );
  }

  function getLowStock(threshold) {
    return search("", {
      lowStock: true,
      threshold
    });
  }

  function getOutOfStock() {
    return search("", {
      outOfStock: true
    });
  }

  window.NoorProductSearch = Object.freeze({
    search,
    getCategories,
    getLowStock,
    getOutOfStock
  });
})();
