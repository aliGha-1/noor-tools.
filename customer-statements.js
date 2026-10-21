"use strict";

window.NoorCustomerStatements = (() => {
  function create(contact, invoices = []) {
    if (!contact || typeof contact !== "object") {
      throw new Error("بيانات العميل أو المورد غير صحيحة.");
    }

    if (!Array.isArray(invoices)) {
      throw new Error("قائمة الفواتير غير صحيحة.");
    }

    const contactId = String(contact.id ?? "");
    const contactName = String(contact.name ?? "").trim();

    if (!contactId && !contactName) {
      throw new Error("العميل أو المورد يحتاج إلى رقم أو اسم.");
    }

    const relevantInvoices = invoices.filter(invoice => {
      if (!invoice || typeof invoice !== "object") return false;

      const matchesId =
        contactId &&
        String(invoice.contactId ?? invoice.customerId ?? invoice.supplierId ?? "") === contactId;

      const matchesName =
        contactName &&
        String(invoice.contactName ?? invoice.customerName ?? invoice.supplierName ?? "")
          .trim()
          .toLowerCase() === contactName.toLowerCase();

      return Boolean(matchesId || matchesName);
    });

    const rows = relevantInvoices.map(invoice => ({
      id: invoice.id ?? "",
      date: invoice.createdAt ?? "",
      type: invoice.type ?? "",
      total: Number(invoice.total ?? 0)
    })).filter(row => Number.isFinite(row.total));

    const sales = rows
      .filter(row => row.type === "sale")
      .reduce((sum, row) => sum + row.total, 0);

    const purchases = rows
      .filter(row => row.type === "purchase")
      .reduce((sum, row) => sum + row.total, 0);

    return {
      contact: {
        id: contact.id ?? null,
        name: contactName,
        phone: contact.phone ?? ""
      },
      invoices: rows,
      summary: {
        invoiceCount: rows.length,
        sales: round(sales),
        purchases: round(purchases),
        difference: round(sales - purchases)
      }
    };
  }

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  return Object.freeze({ create });
})();
