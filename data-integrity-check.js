"use strict";

window.NoorIntegrityCheck = (() => {
  function checkProducts(products) {
    const issues = [];
    const seenIds = new Set();

    if (!Array.isArray(products)) {
      return {
        valid: false,
        checked: 0,
        issues: ["قائمة الأصناف ليست قائمة صحيحة."]
      };
    }

    products.forEach((product, index) => {
      if (!product || typeof product !== "object") {
        issues.push({
          index,
          issue: "بيانات الصنف غير صحيحة."
        });
        return;
      }

      const id = product.id ?? product.code;

      if (id !== undefined && id !== null && id !== "") {
        const key = String(id);

        if (seenIds.has(key)) {
          issues.push({
            index,
            id: key,
            issue: "يوجد رقم أو كود مكرر."
          });
        } else {
          seenIds.add(key);
        }
      }

      if (typeof product.name !== "string" || !product.name.trim()) {
        issues.push({
          index,
          issue: "اسم الصنف فارغ."
        });
      }

      const quantity = Number(product.quantity ?? product.stock ?? 0);

      if (!Number.isFinite(quantity) || quantity < 0) {
        issues.push({
          index,
          issue: "كمية الصنف غير صحيحة."
        });
      }
    });

    return {
      valid: issues.length === 0,
      checked: products.length,
      issues
    };
  }

  function checkInvoices(invoices) {
    const issues = [];

    if (!Array.isArray(invoices)) {
      return {
        valid: false,
        checked: 0,
        issues: ["قائمة الفواتير ليست قائمة صحيحة."]
      };
    }

    invoices.forEach((invoice, index) => {
      if (!invoice || typeof invoice !== "object") {
        issues.push({
          index,
          issue: "بيانات الفاتورة غير صحيحة."
        });
        return;
      }

      if (!["sale", "purchase"].includes(invoice.type)) {
        issues.push({
          index,
          issue: "نوع الفاتورة غير معروف."
        });
      }

      if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
        issues.push({
          index,
          issue: "الفاتورة لا تحتوي على أصناف."
        });
      }

      const total = Number(invoice.total);

      if (!Number.isFinite(total) || total < 0) {
        issues.push({
          index,
          issue: "إجمالي الفاتورة غير صحيح."
        });
      }
    });

    return {
      valid: issues.length === 0,
      checked: invoices.length,
      issues
    };
  }

  return Object.freeze({
    checkProducts,
    checkInvoices
  });
})();
