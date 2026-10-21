"use strict";

window.NoorIntegration = (() => {
  const COMPONENTS = {
    config: "NoorConfig",
    database: "NoorDB",
    application: "NoorApp",
    backup: "NoorBackup",
    reports: "NoorReports",
    settings: "NoorSettings",
    productSearch: "NoorProductSearch",
    contacts: "NoorContacts",
    barcode: "NoorBarcode",
    finance: "NoorFinance",
    activityLog: "NoorActivityLog",
    notifications: "NoorNotifications",
    currency: "NoorCurrency",
    dataExport: "NoorDataExport",
    stockAlerts: "NoorStockAlerts",
    invoiceCalculator: "NoorInvoiceCalculator",
    invoiceFilter: "NoorInvoiceFilter",
    customerStatements: "NoorCustomerStatements",
    dataValidator: "NoorDataValidator",
    integrityCheck: "NoorIntegrityCheck"
  };

  function inspect() {
    const components = {};
    const missing = [];

    for (const [key, globalName] of Object.entries(COMPONENTS)) {
      const available =
        typeof window[globalName] !== "undefined";

      components[key] = {
        globalName,
        available
      };

      if (!available) {
        missing.push(globalName);
      }
    }

    return {
      appName: "NOOR TOOLS",
      checkedAt: new Date().toISOString(),
      total: Object.keys(COMPONENTS).length,
      available: Object.values(components)
        .filter(item => item.available).length,
      missing,
      ready: missing.length === 0,
      components
    };
  }

  function getComponent(name) {
    const globalName = COMPONENTS[name];

    if (!globalName) {
      throw new Error("اسم المكوّن غير معروف: " + name);
    }

    if (typeof window[globalName] === "undefined") {
      throw new Error("المكوّن غير محمّل: " + globalName);
    }

    return window[globalName];
  }

  function getStatus() {
    return inspect();
  }

  return Object.freeze({
    inspect,
    getComponent,
    getStatus
  });
})();
