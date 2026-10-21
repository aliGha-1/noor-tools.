"use strict";

window.NoorCurrency = (() => {
  const DEFAULT_CONFIG = {
    currency: "EGP",
    locale: "ar-EG",
    fractionDigits: 2
  };

  function normalizeAmount(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      throw new Error("المبلغ المالي غير صالح.");
    }

    return amount;
  }

  function format(value, options = {}) {
    const amount = normalizeAmount(value);

    const config = {
      ...DEFAULT_CONFIG,
      ...options
    };

    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      minimumFractionDigits: config.fractionDigits,
      maximumFractionDigits: config.fractionDigits
    }).format(amount);
  }

  function formatNumber(value, fractionDigits = 2) {
    const amount = normalizeAmount(value);

    return new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits
    }).format(amount);
  }

  function parse(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") {
      return null;
    }

    const normalized = value
      .trim()
      .replace(/[٠-٩]/g, digit =>
        String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
      )
      .replace(/[۰-۹]/g, digit =>
        String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
      )
      .replace(/[٬,]/g, "")
      .replace(/٫/g, ".");

    if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
      return null;
    }

    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  }

  function round(value, digits = 2) {
    const amount = normalizeAmount(value);

    if (!Number.isInteger(digits) || digits < 0 || digits > 10) {
      throw new Error("عدد المنازل العشرية غير صالح.");
    }

    const factor = 10 ** digits;
    return Math.round((amount + Number.EPSILON) * factor) / factor;
  }

  return Object.freeze({
    format,
    formatNumber,
    parse,
    round
  });
})();
