/* ==========================================
   NOOR TOOLS 2027
   Local Database & Inventory Manager
   Design & Development: م. علي غريب
   ========================================== */

"use strict";

const NoorDB = (() => {
  const DB_KEY = "noor_tools_database_v1";

  const DEFAULT_DB = {
    version: 1,
    products: [],
    invoices: [],
    nextProductId: 1,
    nextInvoiceId: 1001
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    try {
      const saved = localStorage.getItem(DB_KEY);

      if (!saved) {
        return clone(DEFAULT_DB);
      }

      const db = JSON.parse(saved);

      return {
        ...clone(DEFAULT_DB),
        ...db,
        products: Array.isArray(db.products) ? db.products : [],
        invoices: Array.isArray(db.invoices) ? db.invoices : []
      };
    } catch (error) {
      console.error("NOOR TOOLS database read error:", error);
      throw new Error("تعذر قراءة قاعدة البيانات المحفوظة.");
    }
  }

  function save(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    } catch (error) {
      console.error("NOOR TOOLS database save error:", error);
      throw new Error(
        "تعذر حفظ البيانات. تأكد من توفر مساحة تخزين كافية."
      );
    }
  }

  function now() {
    return new Date().toISOString();
  }

  function number(value, label) {
    const result = Number(value);

    if (!Number.isFinite(result) || result < 0) {
      throw new Error(label + " يجب أن يكون رقمًا صحيحًا غير سالب.");
    }

    return result;
  }

  function text(value, label) {
    const result = String(value ?? "").trim();

    if (!result) {
      throw new Error("من فضلك أدخل " + label + ".");
    }

    return result;
  }

  function getProducts() {
    return clone(load().products);
  }

  function getInvoices() {
    return clone(
      load().invoices.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      )
    );
  }

  function getProduct(id) {
    const product = load().products.find(
      item => item.id === Number(id)
    );

    return product ? clone(product) : null;
  }

  function addProduct(data) {
    const db = load();

    const product = {
      id: db.nextProductId++,
      name: text(data.name, "اسم الصنف"),
      category: text(data.category, "قسم الصنف"),
      purchasePrice: number(data.purchasePrice ?? 0, "سعر الشراء"),
      salePrice: number(data.salePrice ?? 0, "سعر البيع"),
      quantity: number(data.quantity ?? 0, "الكمية"),
      unit: String(data.unit || "قطعة").trim(),
      createdAt: now(),
      updatedAt: now()
    };

    db.products.push(product);
    save(db);

    return clone(product);
  }

  function updateProduct(id, changes) {
    const db = load();

    const product = db.products.find(
      item => item.id === Number(id)
    );

    if (!product) {
      throw new Error("الصنف غير موجود.");
    }

    if (changes.name !== undefined) {
      product.name = text(changes.name, "اسم الصنف");
    }

    if (changes.category !== undefined) {
      product.category = text(changes.category, "قسم الصنف");
    }

    if (changes.purchasePrice !== undefined) {
      product.purchasePrice = number(
        changes.purchasePrice,
        "سعر الشراء"
      );
    }

    if (changes.salePrice !== undefined) {
      product.salePrice = number(
        changes.salePrice,
        "سعر البيع"
      );
    }

    if (changes.quantity !== undefined) {
      product.quantity = number(changes.quantity, "الكمية");
    }

    if (changes.unit !== undefined) {
      product.unit = text(changes.unit, "وحدة الصنف");
    }

    product.updatedAt = now();

    save(db);

    return clone(product);
  }

  function deleteProduct(id) {
    const db = load();

    const productId = Number(id);

    const used = db.invoices.some(invoice =>
      invoice.items.some(item => item.productId === productId)
    );

    if (used) {
      throw new Error(
        "لا يمكن حذف صنف مرتبط بفواتير سابقة. يمكنك الاحتفاظ به أو إيقاف استخدامه."
      );
    }

    const before = db.products.length;

    db.products = db.products.filter(
      product => product.id !== productId
    );

    if (db.products.length === before) {
      throw new Error("الصنف غير موجود.");
    }

    save(db);

    return true;
  }

  /*
    إنشاء فاتورة بيع أو شراء متعددة الأصناف.

    type:
      sale     = مبيعات
      purchase = مشتريات

    items:
      [{ productId, quantity, price }]
  */
  function createInvoice(data) {
    const db = load();

    if (!["sale", "purchase"].includes(data.type)) {
      throw new Error("نوع الفاتورة غير صحيح.");
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("يجب إضافة صنف واحد على الأقل للفاتورة.");
    }

    const items = data.items.map(line => {
      const productId = Number(line.productId);
      const product = db.products.find(
        item => item.id === productId
      );

      if (!product) {
        throw new Error("يوجد صنف غير موجود في قاعدة البيانات.");
      }

      const quantity = number(line.quantity, "الكمية");

      if (quantity <= 0) {
        throw new Error("يجب أن تكون كمية الصنف أكبر من صفر.");
      }

      const price = number(line.price, "السعر");

      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        quantity,
        price,
        total: quantity * price
      };
    });

    // تجميع الكميات المتكررة للصنف نفسه للتحقق من المخزون.
    if (data.type === "sale") {
      const quantities = {};

      for (const item of items) {
        quantities[item.productId] =
          (quantities[item.productId] || 0) + item.quantity;
      }

      for (const [id, quantity] of Object.entries(quantities)) {
        const product = db.products.find(
          item => item.id === Number(id)
        );

        if (product.quantity < quantity) {
          throw new Error(
            "الكمية المتاحة من " + product.name +
            " غير كافية. المتاح: " + product.quantity
          );
        }
      }
    }

    // حساب الإجمالي من جميع أصناف الفاتورة.
    const total = items.reduce(
      (sum, item) => sum + item.total,
      0
    );

    // تجهيز الفاتورة قبل حفظ التغييرات.
    const invoice = {
      id: db.nextInvoiceId,
      type: data.type,
      createdAt: now(),
      items,
      total
    };

    // تحديث المخزون.
    for (const item of items) {
      const product = db.products.find(
        product => product.id === item.productId
      );

      if (data.type === "sale") {
        product.quantity -= item.quantity;
      } else {
        product.quantity += item.quantity;
      }

      product.updatedAt = now();
    }

    db.nextInvoiceId++;
    db.invoices.push(invoice);

    // حفظ الفاتورة وحركة المخزون معًا.
    save(db);

    return clone(invoice);
  }

  function getInvoice(id) {
    const invoice = load().invoices.find(
      item => item.id === Number(id)
    );

    return invoice ? clone(invoice) : null;
  }

  function searchInvoices(options = {}) {
    const db = load();

    let invoices = db.invoices.slice();

    if (options.type) {
      invoices = invoices.filter(
        invoice => invoice.type === options.type
      );
    }

    if (options.from) {
      const from = new Date(options.from + "T00:00:00");

      invoices = invoices.filter(
        invoice => new Date(invoice.createdAt) >= from
      );
    }

    if (options.to) {
      const to = new Date(options.to + "T23:59:59.999");

      invoices = invoices.filter(
        invoice => new Date(invoice.createdAt) <= to
      );
    }

    if (options.id !== undefined && options.id !== "") {
      invoices = invoices.filter(
        invoice => invoice.id === Number(options.id)
      );
    }

    invoices.sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );

    return clone(invoices);
  }

  function getStockSummary() {
    const db = load();

    return {
      productsCount: db.products.length,
      totalUnits: db.products.reduce(
        (sum, product) => sum + product.quantity,
        0
      ),
      salesCount: db.invoices.filter(
        invoice => invoice.type === "sale"
      ).length,
      purchasesCount: db.invoices.filter(
        invoice => invoice.type === "purchase"
      ).length
    };
  }

  function exportBackup() {
    const db = load();

    return JSON.stringify({
      application: "NOOR TOOLS",
      version: 1,
      exportedAt: now(),
      database: db
    }, null, 2);
  }

  function importBackup(jsonText) {
    let backup;

    try {
      backup = JSON.parse(jsonText);
    } catch {
      throw new Error("ملف النسخة الاحتياطية غير صالح.");
    }

    if (
      backup.application !== "NOOR TOOLS" ||
      !backup.database ||
      !Array.isArray(backup.database.products) ||
      !Array.isArray(backup.database.invoices)
    ) {
      throw new Error("الملف ليس نسخة احتياطية صالحة لـ NOOR TOOLS.");
    }

    const db = backup.database;

    if (
      !Number.isInteger(db.nextProductId) ||
      !Number.isInteger(db.nextInvoiceId)
    ) {
      throw new Error("بيانات النسخة الاحتياطية غير مكتملة.");
    }

    save(db);

    return true;
  }

  return Object.freeze({
    getProducts,
    getInvoices,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    createInvoice,
    getInvoice,
    searchInvoices,
    getStockSummary,
    exportBackup,
    importBackup
  });
})();

window.NoorDB = NoorDB;
