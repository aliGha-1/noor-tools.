"use strict";

window.NoorDiscounts = (() => {
  const STORAGE_KEY = "noor_tools_discounts_v1";
  const MAX_RECORDS = 2000;

  function readAll() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read discounts", error);
      return [];
    }
  }

  function add(discount) {
    if (!discount || typeof discount !== "object") {
      throw new Error("بيانات الخصم غير صحيحة.");
    }

    const name = String(discount.name ?? "").trim();
    const productId = String(discount.productId ?? "").trim();
    const type = discount.type;
    const value = Number(discount.value);

    if (!name) {
      throw new Error("اسم العرض مطلوب.");
    }

    if (!["percentage", "fixed"].includes(type)) {
      throw new Error("نوع الخصم غير صحيح.");
    }

    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("قيمة الخصم يجب أن تكون أكبر من صفر.");
    }

    if (type === "percentage" && value > 100) {
      throw new Error("الخصم بالنسبة المئوية لا يتجاوز 100%.");
    }

    const entry = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      name,
      productId,
      type,
      value,
      active: discount.active !== false,
      startDate: discount.startDate || null,
      endDate: discount.endDate || null,
      createdAt: new Date().toISOString()
    };

    if (entry.startDate && Number.isNaN(Date.parse(entry.startDate))) {
      throw new Error("تاريخ بداية العرض غير صحيح.");
    }

    if (entry.endDate && Number.isNaN(Date.parse(entry.endDate))) {
      throw new Error("تاريخ نهاية العرض غير صحيح.");
    }

    if (
      entry.startDate &&
      entry.endDate &&
      Date.parse(entry.endDate) < Date.parse(entry.startDate)
    ) {
      throw new Error("تاريخ نهاية العرض يسبق تاريخ بدايته.");
    }

    const records = readAll();
    records.unshift(entry);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_RECORDS))
      );
    } catch (error) {
      console.error("NOOR TOOLS: cannot save discount", error);
      throw new Error("تعذر حفظ العرض على الجهاز.");
    }

    return entry;
  }

  function getAll(filters = {}) {
    return readAll().filter(item => {
      if (
        filters.productId &&
        item.productId !== String(filters.productId)
      ) {
        return false;
      }

      if (
        filters.active !== undefined &&
        item.active !== filters.active
      ) {
        return false;
      }

      return true;
    });
  }

  function calculate(price, discountId) {
    const originalPrice = Number(price);

    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
      throw new Error("سعر المنتج غير صحيح.");
    }

    const discount = readAll().find(item => item.id === discountId);

    if (!discount) {
      throw new Error("العرض غير موجود.");
    }

    const now = Date.now();

    if (!discount.active) {
      throw new Error("العرض غير مفعّل.");
    }

    if (discount.startDate && now < Date.parse(discount.startDate)) {
      throw new Error("العرض لم يبدأ بعد.");
    }

    if (discount.endDate && now > Date.parse(discount.endDate)) {
      throw new Error("العرض انتهى.");
    }

    const amount = discount.type === "percentage"
      ? originalPrice * discount.value / 100
      : discount.value;

    const finalDiscount = Math.min(originalPrice, amount);

    return {
      originalPrice,
      discountAmount: Math.round(finalDiscount * 100) / 100,
      finalPrice: Math.round(
        (originalPrice - finalDiscount) * 100
      ) / 100
    };
  }

  function setActive(id, active) {
    const records = readAll();
    const item = records.find(discount => discount.id === id);

    if (!item) {
      return false;
    }

    item.active = Boolean(active);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  }

  return Object.freeze({
    add,
    getAll,
    calculate,
    setActive
  });
})();
