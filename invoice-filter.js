"use strict";

window.NoorInvoiceFilter = (() => {
  function normalizeDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10);
  }

  function filter(invoices, options = {}) {
    if (!Array.isArray(invoices)) {
      throw new Error("قائمة الفواتير غير صحيحة.");
    }

    const from = normalizeDate(options.from);
    const to = normalizeDate(options.to);
    const type = options.type || "all";
    const search = String(options.search || "").trim().toLowerCase();

    const minTotal = options.minTotal === undefined
      ? null
      : Number(options.minTotal);

    const maxTotal = options.maxTotal === undefined
      ? null
      : Number(options.maxTotal);

    if (minTotal !== null && !Number.isFinite(minTotal)) {
      throw new Error("الحد الأدنى للمبلغ غير صحيح.");
    }

    if (maxTotal !== null && !Number.isFinite(maxTotal)) {
      throw new Error("الحد الأقصى للمبلغ غير صحيح.");
    }

    return invoices.filter(invoice => {
      if (!invoice || typeof invoice !== "object") {
        return false;
      }

      if (
        type !== "all" &&
        invoice.type !== type
      ) {
        return false;
      }

      const invoiceDate = normalizeDate(invoice.createdAt);

      if (from && (!invoiceDate || invoiceDate < from)) {
        return false;
      }

      if (to && (!invoiceDate || invoiceDate > to)) {
        return false;
      }

      const total = Number(invoice.total ?? 0);

      if (!Number.isFinite(total)) {
        return false;
      }

      if (minTotal !== null && total < minTotal) {
        return false;
      }

      if (maxTotal !== null && total > maxTotal) {
        return false;
      }

      if (search) {
        const searchable = [
          invoice.id,
          invoice.customerName,
          invoice.supplierName,
          invoice.notes
        ]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }

  function summarize(invoices) {
    const rows = Array.isArray(invoices) ? invoices : [];

    return {
      count: rows.length,
      total: Number(
        rows.reduce((sum, invoice) => {
          const amount = Number(invoice.total ?? 0);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0).toFixed(2)
      ),
      salesCount: rows.filter(item => item.type === "sale").length,
      purchasesCount: rows.filter(item => item.type === "purchase").length
    };
  }

  return Object.freeze({
    filter,
    summarize
  });
})();
