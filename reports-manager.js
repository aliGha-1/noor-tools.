"use strict";

/*
 * NOOR TOOLS
 * Reports Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const currency = value =>
    (Number(value) || 0).toFixed(2) + " ج.م";

  function getDatabase() {
    if (!window.NoorDB) {
      throw new Error("قاعدة بيانات NOOR TOOLS غير متاحة.");
    }

    return window.NoorDB;
  }

  function getInvoices(filters = {}) {
    const db = getDatabase();

    if (typeof db.searchInvoices === "function") {
      return db.searchInvoices(filters) || [];
    }

    if (typeof db.getInvoices === "function") {
      let invoices = db.getInvoices() || [];

      if (filters.type) {
        invoices = invoices.filter(
          invoice => invoice.type === filters.type
        );
      }

      if (filters.from) {
        invoices = invoices.filter(
          invoice => invoice.createdAt >= filters.from
        );
      }

      if (filters.to) {
        invoices = invoices.filter(
          invoice => invoice.createdAt.slice(0, 10) <= filters.to
        );
      }

      return invoices;
    }

    throw new Error("وظائف قراءة الفواتير غير متاحة.");
  }

  function getStock() {
    const db = getDatabase();

    if (typeof db.getStockSummary !== "function") {
      throw new Error("ملخص المخزون غير متاح.");
    }

    return db.getStockSummary();
  }

  function summarizeInvoices(invoices = []) {
    let total = 0;
    let invoiceCount = 0;
    let itemCount = 0;

    invoices.forEach(invoice => {
      invoiceCount++;
      total += Number(invoice.total) || 0;

      (Array.isArray(invoice.items) ? invoice.items : [])
        .forEach(item => {
          itemCount += Number(item.quantity) || 0;
        });
    });

    return {
      invoiceCount,
      itemCount,
      total,
      formattedTotal: currency(total)
    };
  }

  function createSalesReport(filters = {}) {
    const invoices = getInvoices({
      ...filters,
      type: "sale"
    });

    return {
      title: "تقرير المبيعات",
      generatedAt: new Date().toISOString(),
      ...summarizeInvoices(invoices),
      invoices
    };
  }

  function createPurchasesReport(filters = {}) {
    const invoices = getInvoices({
      ...filters,
      type: "purchase"
    });

    return {
      title: "تقرير المشتريات",
      generatedAt: new Date().toISOString(),
      ...summarizeInvoices(invoices),
      invoices
    };
  }

  function createStockReport() {
    const stock = getStock();

    return {
      title: "تقرير المخزون",
      generatedAt: new Date().toISOString(),
      stock
    };
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map(row =>
      row.map(value => {
        const text = String(value ?? "");

        return '"' + text.replace(/"/g, '""') + '"';
      }).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportInvoicesCSV(filters = {}) {
    const invoices = getInvoices(filters);

    const rows = [
      [
        "رقم الفاتورة",
        "النوع",
        "التاريخ",
        "عدد الأصناف",
        "الإجمالي"
      ]
    ];

    invoices.forEach(invoice => {
      rows.push([
        invoice.id,
        invoice.type === "purchase" ? "مشتريات" : "مبيعات",
        invoice.createdAt,
        Array.isArray(invoice.items) ? invoice.items.length : 0,
        Number(invoice.total) || 0
      ]);
    });

    downloadCSV("noor-tools-invoices.csv", rows);

    return invoices.length;
  }

  window.NoorReports = Object.freeze({
    sales: createSalesReport,
    purchases: createPurchasesReport,
    stock: createStockReport,
    summarize: summarizeInvoices,
    exportInvoicesCSV
  });
})();
