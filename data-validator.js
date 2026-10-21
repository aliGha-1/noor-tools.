"use strict";

window.NoorDataValidator = (() => {
  function validateProduct(product) {
    const errors = [];

    if (!product || typeof product !== "object") {
      return { valid: false, errors: ["بيانات الصنف غير صحيحة."] };
    }

    if (typeof product.name !== "string" || !product.name.trim()) {
      errors.push("اسم الصنف مطلوب.");
    }

    const quantity = Number(product.quantity ?? product.stock ?? 0);

    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.push("كمية الصنف يجب أن تكون رقمًا موجبًا أو صفرًا.");
    }

    for (const field of ["salePrice", "sellPrice", "price", "purchasePrice", "buyPrice"]) {
      if (product[field] === undefined || product[field] === null || product[field] === "") {
        continue;
      }

      const value = Number(product[field]);

      if (!Number.isFinite(value) || value < 0) {
        errors.push(`قيمة الحقل ${field} غير صحيحة.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validateInvoice(invoice) {
    const errors = [];

    if (!invoice || typeof invoice !== "object") {
      return { valid: false, errors: ["بيانات الفاتورة غير صحيحة."] };
    }

    if (!["sale", "purchase"].includes(invoice.type)) {
      errors.push("نوع الفاتورة غير صحيح.");
    }

    if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
      errors.push("الفاتورة يجب أن تحتوي على صنف واحد على الأقل.");
    } else {
      invoice.items.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          errors.push(`بيانات الصنف رقم ${index + 1} غير صحيحة.`);
          return;
        }

        const quantity = Number(item.quantity);
        const price = Number(item.price);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          errors.push(`كمية الصنف رقم ${index + 1} يجب أن تكون أكبر من صفر.`);
        }

        if (!Number.isFinite(price) || price < 0) {
          errors.push(`سعر الصنف رقم ${index + 1} غير صحيح.`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validateContacts(contact) {
    const errors = [];

    if (!contact || typeof contact !== "object") {
      return { valid: false, errors: ["بيانات جهة الاتصال غير صحيحة."] };
    }

    if (typeof contact.name !== "string" || !contact.name.trim()) {
      errors.push("الاسم مطلوب.");
    }

    if (contact.phone !== undefined && contact.phone !== null) {
      if (typeof contact.phone !== "string" && typeof contact.phone !== "number") {
        errors.push("رقم الهاتف غير صحيح.");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  return Object.freeze({
    validateProduct,
    validateInvoice,
    validateContacts
  });
})();
