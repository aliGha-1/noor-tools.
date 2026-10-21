"use strict";

/*
 * NOOR TOOLS
 * Settings Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const STORAGE_KEY = "noor_tools_settings_v1";

  const DEFAULTS = Object.freeze({
    businessName: "NOOR TOOLS",
    businessNameArabic: "نور تولز",
    currency: "EGP",
    currencyLabel: "ج.م",
    language: "ar",
    invoiceFooter: "شكرًا لثقتكم في NOOR TOOLS",
    showDeveloperCredit: true,
    developerCredit: "تصميم وتطوير: م. علي غريب",
    developerPhone: "01559330658",
    lowStockThreshold: 5,
    autoBackupReminder: true
  });

  function readSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return { ...DEFAULTS };
      }

      const saved = JSON.parse(raw);

      if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
        return { ...DEFAULTS };
      }

      return { ...DEFAULTS, ...saved };
    } catch (error) {
      console.error("تعذر تحميل إعدادات NOOR TOOLS:", error);
      return { ...DEFAULTS };
    }
  }

  function getAll() {
    return { ...readSettings() };
  }

  function get(key) {
    const settings = readSettings();

    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      return undefined;
    }

    return settings[key];
  }

  function set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
      throw new Error("إعداد غير معروف: " + key);
    }

    const settings = readSettings();
    settings[key] = value;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new CustomEvent("noor:settings-changed", {
        detail: { key, value }
      })
    );

    return getAll();
  }

  function update(values) {
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      throw new Error("بيانات الإعدادات غير صالحة.");
    }

    const settings = readSettings();

    for (const [key, value] of Object.entries(values)) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        throw new Error("إعداد غير معروف: " + key);
      }

      settings[key] = value;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new CustomEvent("noor:settings-changed", {
        detail: { ...values }
      })
    );

    return getAll();
  }

  function reset() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULTS)
    );

    window.dispatchEvent(
      new CustomEvent("noor:settings-changed", {
        detail: getAll()
      })
    );

    return getAll();
  }

  function formatCurrency(amount) {
    const settings = readSettings();

    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: 2
    }).format(Number(amount) || 0);
  }

  window.NoorSettings = Object.freeze({
    defaults: DEFAULTS,
    getAll,
    get,
    set,
    update,
    reset,
    formatCurrency
  });
})();
