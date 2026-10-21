"use strict";

window.NoorDataExport = (() => {
  function escapeCSV(value) {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function makeCSV(rows, columns) {
    const header = columns.map(column =>
      escapeCSV(column.label)
    );

    const lines = rows.map(row =>
      columns.map(column =>
        escapeCSV(
          typeof column.value === "function"
            ? column.value(row)
            : row[column.value]
        )
      )
    );

    // BOM helps spreadsheet programs display Arabic correctly.
    return "\uFEFF" + [header, ...lines]
      .map(line => line.join(","))
      .join("\r\n");
  }

  function downloadCSV(filename, csv) {
    if (typeof document === "undefined" ||
        typeof Blob === "undefined") {
      throw new Error("التصدير غير متاح في هذه البيئة.");
    }

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename.endsWith(".csv")
      ? filename
      : filename + ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportProducts(products) {
    if (!Array.isArray(products)) {
      throw new Error("قائمة الأصناف غير صحيحة.");
    }

    const csv = makeCSV(products, [
      { label: "اسم الصنف", value: "name" },
      { label: "كود الصنف", value: "code" },
      { label: "الباركود", value: "barcode" },
      { label: "القسم", value: "category" },
      {
        label: "الكمية",
        value: row => row.quantity ?? row.stock ?? 0
      },
      {
        label: "سعر البيع",
        value: row => row.salePrice ?? row.sellPrice ?? row.price ?? 0
      },
      {
        label: "سعر الشراء",
        value: row => row.purchasePrice ?? row.buyPrice ?? 0
      }
    ]);

    downloadCSV("noor-tools-products.csv", csv);

    return products.length;
  }

  function exportInvoices(invoices) {
    if (!Array.isArray(invoices)) {
      throw new Error("قائمة الفواتير غير صحيحة.");
    }

    const csv = makeCSV(invoices, [
      { label: "رقم الفاتورة", value: "id" },
      {
        label: "النوع",
        value: row => row.type === "sale" ? "مبيعات" :
          row.type === "purchase" ? "مشتريات" : row.type
      },
      { label: "التاريخ", value: "createdAt" },
      { label: "الإجمالي", value: "total" },
      {
        label: "عدد الأصناف",
        value: row => Array.isArray(row.items) ? row.items.length : 0
      }
    ]);

    downloadCSV("noor-tools-invoices.csv", csv);

    return invoices.length;
  }

  return Object.freeze({
    makeCSV,
    downloadCSV,
    exportProducts,
    exportInvoices
  });
})();
