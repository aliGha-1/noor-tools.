"use strict";

window.NoorInvoiceCalculator = (() => {
  function toNumber(value, label) {
    const number = Number(value ?? 0);

    if (!Number.isFinite(number)) {
      throw new Error(`قيمة ${label} غير صحيحة.`);
    }

    return number;
  }

  function calculateItem(item) {
    if (!item || typeof item !== "object") {
      throw new Error("بيانات الصنف غير صحيحة.");
    }

    const quantity = toNumber(item.quantity, "الكمية");
    const price = toNumber(item.price, "السعر");

    if (quantity <= 0) {
      throw new Error("الكمية يجب أن تكون أكبر من صفر.");
    }

    if (price < 0) {
      throw new Error("السعر لا يمكن أن يكون سالبًا.");
    }

    return {
      quantity,
      price,
      total: round(quantity * price)
    };
  }

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(invoice = {}) {
    if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
      throw new Error("الفاتورة يجب أن تحتوي على صنف واحد على الأقل.");
    }

    const items = invoice.items.map(item => {
      const result = calculateItem(item);

      return {
        ...item,
        quantity: result.quantity,
        price: result.price,
        total: result.total
      };
    });

    const subtotal = round(
      items.reduce((sum, item) => sum + item.total, 0)
    );

    const discount = toNumber(invoice.discount, "الخصم");
    const taxRate = toNumber(invoice.taxRate, "نسبة الضريبة");

    if (discount < 0 || discount > subtotal) {
      throw new Error("الخصم يجب أن يكون بين صفر وإجمالي الأصناف.");
    }

    if (taxRate < 0 || taxRate > 100) {
      throw new Error("نسبة الضريبة يجب أن تكون بين 0 و100.");
    }

    const taxableAmount = round(subtotal - discount);
    const tax = round(taxableAmount * taxRate / 100);
    const total = round(taxableAmount + tax);

    return {
      items,
      subtotal,
      discount: round(discount),
      taxableAmount,
      taxRate,
      tax,
      total
    };
  }

  function calculateProfit(salePrice, purchasePrice, quantity = 1) {
    const sale = toNumber(salePrice, "سعر البيع");
    const purchase = toNumber(purchasePrice, "سعر الشراء");
    const count = toNumber(quantity, "الكمية");

    if (sale < 0 || purchase < 0 || count < 0) {
      throw new Error("الأسعار والكميات لا يمكن أن تكون سالبة.");
    }

    return {
      unitProfit: round(sale - purchase),
      totalProfit: round((sale - purchase) * count)
    };
  }

  return Object.freeze({
    calculateItem,
    calculate,
    calculateProfit
  });
})();
