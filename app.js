"use strict";

/* =====================================
   NOOR TOOLS
   Application Functions
   Design & Development: م. علي غريب
   ===================================== */

(() => {
  const style = document.createElement("style");

  style.textContent = `
    .nt-overlay {
      position:fixed; inset:0; z-index:9999;
      overflow:auto; background:#071321; color:#fff;
      padding:16px; font-family:Tahoma,Arial,sans-serif;
    }
    .nt-wrap {max-width:900px;margin:auto}
    .nt-header {
      display:flex;justify-content:space-between;
      align-items:center;gap:12px;flex-wrap:wrap;
      border-bottom:1px solid #294052;padding-bottom:15px;
    }
    .nt-header h2 {margin:0;font-size:21px}
    .nt-card {
      background:#0c1c2d;border:1px solid #294052;
      border-radius:15px;padding:16px;margin:16px 0;
    }
    .nt-grid {
      display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
    }
    .nt-field label {display:block;color:#d5e1e8;margin:8px 0}
    .nt-field input,.nt-field select {
      width:100%;padding:12px;border-radius:9px;
      border:1px solid #34495a;background:#071321;color:white;
      box-sizing:border-box;
    }
    .nt-btn {
      border:0;border-radius:9px;padding:11px 14px;
      background:#21d18b;color:#071321;font-weight:bold;
      cursor:pointer;margin:4px 2px;
    }
    .nt-secondary {background:#183044;color:#fff;border:1px solid #34495a}
    .nt-danger {background:#713b43;color:#fff}
    .nt-list {overflow-x:auto}
    .nt-table {width:100%;border-collapse:collapse;min-width:530px}
    .nt-table th,.nt-table td {
      border-bottom:1px solid #294052;padding:10px;
      text-align:right;white-space:nowrap;
    }
    .nt-table th {color:#21d18b}
    .nt-muted {color:#9aafc0;font-size:13px;line-height:1.8}
    .nt-total {font-size:20px;color:#21d18b;font-weight:bold}
    .nt-message {padding:12px;border-radius:9px;background:#102b29;margin:10px 0}
    .nt-item {
      padding:12px;border:1px solid #294052;border-radius:10px;
      margin:8px 0;background:#071a29;
    }
    @media(max-width:520px) {
      .nt-grid {grid-template-columns:1fr}
      .nt-overlay {padding:10px}
    }
  `;

  document.head.appendChild(style);

  const categories = [
    "الكهرباء",
    "العدد اليدوية",
    "العدد الكهربائية",
    "السباكة والصحي",
    "الدهانات",
    "اللزق والعوازل",
    "المسامير والربط",
    "القطع والمستهلكات",
    "معدات السلامة",
    "معدات القياس",
    "أدوات البناء والمحارة",
    "أدوات الحدائق",
    "الأقفال والمفصلات",
    "التخزين والتنظيم",
    "أخرى"
  ];

  let overlay = null;
  let invoiceLines = [];
  let invoiceType = "sale";

  const money = value =>
    Number(value || 0).toLocaleString("ar-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " ج.م";

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function db() {
    if (!window.NoorDB) {
      throw new Error(
        "محرك البيانات لم يتم تحميله بعد. سنربطه بواجهة التطبيق في خطوة التكامل."
      );
    }
    return window.NoorDB;
  }

  function showError(error) {
    alert(error?.message || "حدث خطأ غير متوقع.");
  }

  function openWindow(title, content) {
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.className = "nt-overlay";

    overlay.innerHTML = `
      <div class="nt-wrap">
        <header class="nt-header">
          <div>
            <h2>NOOR <span style="color:#21d18b">TOOLS</span></h2>
            <div class="nt-muted">${escapeHTML(title)}</div>
          </div>
          <button class="nt-btn nt-secondary" data-action="close">
            رجوع للرئيسية
          </button>
        </header>
        <main id="nt-content">${content}</main>
        <footer class="nt-muted" style="text-align:center;padding:25px">
          تصميم وتطوير م. علي غريب · 01559330658
        </footer>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;

      if (action === "close") {
        overlay.remove();
        overlay = null;
        return;
      }

      if (action === "delete-product") {
        deleteProduct(Number(button.dataset.id));
      }

      if (action === "edit-product") {
        productForm(Number(button.dataset.id));
      }

      if (action === "new-invoice") {
        openInvoice(button.dataset.type);
      }

      if (action === "remove-line") {
        invoiceLines.splice(Number(button.dataset.index), 1);
        renderInvoiceLines();
      }

      if (action === "save-invoice") {
        saveInvoice();
      }

      if (action === "backup-export") {
        exportBackup();
      }

      if (action === "backup-import") {
        document.getElementById("nt-backup-file")?.click();
      }
    });
  }

  function setContent(html) {
    const content = overlay?.querySelector("#nt-content");
    if (content) content.innerHTML = html;
  }

  function categoryOptions(selected = "") {
    return categories.map(category => `
      <option value="${escapeHTML(category)}"
        ${category === selected ? "selected" : ""}>
        ${escapeHTML(category)}
      </option>
    `).join("");
  }

  function homeSection(title, html) {
    openWindow(title, html);
  }

  /* إدارة الأصناف */

  function productsPage() {
    const products = db().getProducts();

    homeSection("إدارة الأصناف", `
      <section class="nt-card">
        <button class="nt-btn" id="nt-add-product">＋ إضافة صنف جديد</button>
        <div class="nt-field">
          <label>البحث عن صنف</label>
          <input id="nt-product-search" placeholder="اكتب اسم الصنف...">
        </div>
      </section>
      <section class="nt-card">
        <div id="nt-products-table">${productTable(products)}</div>
      </section>
    `);

    document.getElementById("nt-add-product").onclick =
      () => productForm();

    document.getElementById("nt-product-search").oninput = event => {
      const query = event.target.value.trim().toLowerCase();
      const filtered = db().getProducts().filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );

      document.getElementById("nt-products-table").innerHTML =
        productTable(filtered);
    };
  }

  function productTable(products) {
    if (!products.length) {
      return `<p class="nt-muted">لا توجد أصناف بعد. أضف أول صنف للبدء.</p>`;
    }

    return `
      <div class="nt-list">
        <table class="nt-table">
          <thead>
            <tr>
              <th>الصنف</th><th>القسم</th><th>الكمية</th>
              <th>الشراء</th><th>البيع</th><th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${escapeHTML(product.quantity)} ${escapeHTML(product.unit)}</td>
                <td>${money(product.purchasePrice)}</td>
                <td>${money(product.salePrice)}</td>
                <td>
                  <button class="nt-btn nt-secondary"
                    data-action="edit-product" data-id="${product.id}">تعديل</button>
                  <button class="nt-btn nt-danger"
                    data-action="delete-product" data-id="${product.id}">حذف</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function productForm(id = null) {
    const existing = id ? db().getProduct(id) : null;

    if (id && !existing) {
      alert("الصنف غير موجود.");
      return;
    }

    setContent(`
      <section class="nt-card">
        <h3>${existing ? "تعديل بيانات الصنف" : "إضافة صنف جديد"}</h3>
        <form id="nt-product-form">
          <div class="nt-grid">
            <div class="nt-field">
              <label>اسم الصنف *</label>
              <input name="name" required value="${escapeHTML(existing?.name || "")}">
            </div>
            <div class="nt-field">
              <label>القسم *</label>
              <select name="category" required>${categoryOptions(existing?.category)}</select>
            </div>
            <div class="nt-field">
              <label>سعر الشراء</label>
              <input name="purchasePrice" type="number" min="0" step="0.01"
                required value="${existing?.purchasePrice ?? 0}">
            </div>
            <div class="nt-field">
              <label>سعر البيع</label>
              <input name="salePrice" type="number" min="0" step="0.01"
                required value="${existing?.salePrice ?? 0}">
            </div>
            <div class="nt-field">
              <label>الكمية الحالية</label>
              <input name="quantity" type="number" min="0" step="0.01"
                required value="${existing?.quantity ?? 0}">
            </div>
            <div class="nt-field">
              <label>وحدة القياس</label>
              <input name="unit" required value="${escapeHTML(existing?.unit || "قطعة")}">
            </div>
          </div>
          <button class="nt-btn" type="submit">حفظ الصنف</button>
          <button class="nt-btn nt-secondary" type="button"
            id="nt-product-cancel">إلغاء</button>
        </form>
      </section>
    `);

    document.getElementById("nt-product-cancel").onclick = productsPage;

    document.getElementById("nt-product-form").onsubmit = event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      const data = {
        name: form.get("name"),
        category: form.get("category"),
        purchasePrice: Number(form.get("purchasePrice")),
        salePrice: Number(form.get("salePrice")),
        quantity: Number(form.get("quantity")),
        unit: form.get("unit")
      };

      try {
        if (existing) {
          db().updateProduct(id, data);
        } else {
          db().addProduct(data);
        }

        productsPage();
        alert("تم حفظ بيانات الصنف بنجاح.");
      } catch (error) {
        showError(error);
      }
    };
  }

  function deleteProduct(id) {
    if (!confirm("هل تريد حذف هذا الصنف؟")) return;

    try {
      db().deleteProduct(id);
      productsPage();
    } catch (error) {
      showError(error);
    }
  }

  /* الفواتير متعددة الأصناف */

  function openInvoice(type) {
    invoiceType = type;
    invoiceLines = [];

    const title = type === "sale" ? "فاتورة مبيعات" : "فاتورة مشتريات";
    const products = db().getProducts();

    homeSection(title, `
      <section class="nt-card">
        <h3>${title}</h3>
        <p class="nt-muted">
          ${type === "sale"
            ? "سيتم خصم الكميات المباعة من المخزون عند حفظ الفاتورة."
            : "ستتم إضافة الكميات المشتراة إلى المخزون عند حفظ الفاتورة."}
        </p>
        <div class="nt-grid">
          <div class="nt-field">
            <label>الصنف</label>
            <select id="nt-invoice-product">
              <option value="">اختر صنفًا</option>
              ${products.map(product => `
                <option value="${product.id}">
                  ${escapeHTML(product.name)} — المتاح: ${product.quantity}
                </option>
              `).join("")}
            </select>
          </div>
          <div class="nt-field">
            <label>الكمية</label>
            <input id="nt-invoice-quantity" type="number" min="0.01"
              step="0.01" value="1">
          </div>
          <div class="nt-field">
            <label>سعر الوحدة</label>
            <input id="nt-invoice-price" type="number" min="0"
              step="0.01" value="0">
          </div>
        </div>
        <button class="nt-btn" id="nt-add-line">＋ إضافة صنف للفاتورة</button>
      </section>
      <section class="nt-card">
        <h3>أصناف الفاتورة</h3>
        <div id="nt-invoice-lines"></div>
        <p>الإجمالي: <span class="nt-total" id="nt-invoice-total">0.00 ج.م</span></p>
        <button class="nt-btn" data-action="save-invoice">حفظ الفاتورة</button>
      </section>
    `);

    const productSelect = document.getElementById("nt-invoice-product");
    const priceInput = document.getElementById("nt-invoice-price");

    productSelect.onchange = () => {
      const product = db().getProduct(productSelect.value);
      if (product) {
        priceInput.value = type === "sale"
          ? product.salePrice
          : product.purchasePrice;
      }
    };

    document.getElementById("nt-add-line").onclick = () => {
      const productId = Number(productSelect.value);
      const quantity = Number(
        document.getElementById("nt-invoice-quantity").value
      );
      const price = Number(priceInput.value);

      const product = db().getProduct(productId);

      if (!product) {
        alert("اختر صنفًا صحيحًا.");
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        alert("أدخل كمية أكبر من صفر.");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        alert("أدخل سعرًا صحيحًا.");
        return;
      }

      invoiceLines.push({ productId, quantity, price });
      renderInvoiceLines();

      document.getElementById("nt-add-line").textContent =
        "＋ إضافة صنف آخر";

      productSelect.value = "";
      document.getElementById("nt-invoice-quantity").value = "1";
      priceInput.value = "0";
    };
  }

  function renderInvoiceLines() {
    const target = document.getElementById("nt-invoice-lines");
    if (!target) return;

    if (!invoiceLines.length) {
      target.innerHTML = `<p class="nt-muted">لم تتم إضافة أصناف بعد.</p>`;
    } else {
      target.innerHTML = invoiceLines.map((line, index) => {
        const product = db().getProduct(line.productId);
        const name = product?.name || "صنف غير معروف";

        return `
          <div class="nt-item">
            <strong>${index + 1}. ${escapeHTML(name)}</strong>
            <p class="nt-muted">
              الكمية: ${line.quantity} × ${money(line.price)}
              = ${money(line.quantity * line.price)}
            </p>
            <button class="nt-btn nt-danger" data-action="remove-line"
              data-index="${index}">حذف الصنف من الفاتورة</button>
          </div>
        `;
      }).join("");
    }

    const total = invoiceLines.reduce(
      (sum, line) => sum + line.quantity * line.price,
      0
    );

    document.getElementById("nt-invoice-total").textContent = money(total);
  }

  function saveInvoice() {
    if (!invoiceLines.length) {
      alert("أضف صنفًا واحدًا على الأقل.");
      return;
    }

    if (!confirm("هل تريد حفظ الفاتورة وتحديث المخزون؟")) return;

    try {
      const invoice = db().createInvoice({
        type: invoiceType,
        items: invoiceLines
      });

      alert(
        "تم حفظ الفاتورة رقم " + invoice.id +
        "\nالإجمالي: " + money(invoice.total) +
        "\nالتاريخ والوقت: " +
        new Date(invoice.createdAt).toLocaleString("ar-EG")
      );

      invoiceLines = [];
      recordsPage();
    } catch (error) {
      showError(error);
    }
  }

  /* سجل الفواتير */

  function recordsPage() {
    const invoices = db().getInvoices();

    homeSection("سجل الفواتير", `
      <section class="nt-card">
        <div class="nt-grid">
          <div class="nt-field">
            <label>من تاريخ</label>
            <input type="date" id="nt-record-from">
          </div>
          <div class="nt-field">
            <label>إلى تاريخ</label>
            <input type="date" id="nt-record-to">
          </div>
        </div>
        <button class="nt-btn" id="nt-record-search">بحث</button>
        <button class="nt-btn nt-secondary" id="nt-record-all">عرض الكل</button>
      </section>
      <section class="nt-card">
        <div id="nt-record-results">${invoiceTable(invoices)}</div>
      </section>
    `);

    document.getElementById("nt-record-search").onclick = () => {
      const from = document.getElementById("nt-record-from").value;
      const to = document.getElementById("nt-record-to").value;

      try {
        const results = db().searchInvoices({ from, to });
        document.getElementById("nt-record-results").innerHTML =
          invoiceTable(results);
      } catch (error) {
        showError(error);
      }
    };

    document.getElementById("nt-record-all").onclick = recordsPage;
  }

  function invoiceTable(invoices) {
    if (!invoices.length) {
      return `<p class="nt-muted">لا توجد فواتير في الفترة المحددة.</p>`;
    }

    return `
      <div class="nt-list">
        <table class="nt-table">
          <thead>
            <tr>
              <th>رقم</th><th>النوع</th><th>التاريخ والوقت</th>
              <th>عدد الأصناف</th><th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(invoice => `
              <tr>
                <td>${invoice.id}</td>
                <td>${invoice.type === "sale" ? "مبيعات" : "مشتريات"}</td>
                <td>${escapeHTML(new Date(invoice.createdAt).toLocaleString("ar-EG"))}</td>
                <td>${invoice.items.length}</td>
                <td>${money(invoice.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* المخزون والتقارير */

  function stockPage() {
    const products = db().getProducts();

    homeSection("المخزون", `
      <section class="nt-card">
        <h3>حالة المخزون</h3>
        <p>عدد الأصناف: <strong>${products.length}</strong></p>
        <p>إجمالي الوحدات: <strong>${
          products.reduce((sum, product) => sum + product.quantity, 0)
        }</strong></p>
        <div class="nt-list">${productTable(products)}</div>
      </section>
    `);
  }

  function reportsPage() {
    const invoices = db().getInvoices();
    const sales = invoices.filter(item => item.type === "sale");
    const purchases = invoices.filter(item => item.type === "purchase");

    const sum = list => list.reduce((total, item) => total + item.total, 0);

    homeSection("التقارير", `
      <section class="nt-card">
        <h3>ملخص جميع الفواتير المحفوظة</h3>
        <p>عدد فواتير المبيعات: <strong>${sales.length}</strong></p>
        <p>إجمالي المبيعات: <span class="nt-total">${money(sum(sales))}</span></p>
        <hr style="border-color:#294052">
        <p>عدد فواتير المشتريات: <strong>${purchases.length}</strong></p>
        <p>إجمالي المشتريات: <span class="nt-total">${money(sum(purchases))}</span></p>
        <p class="nt-muted">هذه أرقام إجمالية للفواتير المحفوظة، وليست حسابًا لصافي الربح.</p>
      </section>
    `);
  }

  /* النسخ الاحتياطي */

  function backupPage() {
    homeSection("النسخ الاحتياطي", `
      <section class="nt-card">
        <h3>حفظ واستعادة البيانات</h3>
        <p class="nt-muted">
          صدّر نسخة احتياطية إلى ملف JSON، واحتفظ بها في مكان آمن.
          استعادة نسخة قديمة تستبدل البيانات الحالية.
        </p>
        <button class="nt-btn" data-action="backup-export">
          تنزيل نسخة احتياطية
        </button>
        <button class="nt-btn nt-secondary" data-action="backup-import">
          استعادة نسخة احتياطية
        </button>
        <input type="file" id="nt-backup-file" accept=".json,application/json"
          class="hidden">
      </section>
    `);

    document.getElementById("nt-backup-file").onchange = async event => {
      const file = event.target.files[0];
      if (!file) return;

      if (!confirm("تنبيه: استعادة النسخة ستستبدل البيانات الحالية. هل تريد المتابعة؟")) {
        event.target.value = "";
        return;
      }

      try {
        const text = await file.text();
        db().importBackup(text);
        alert("تمت استعادة النسخة الاحتياطية.");
        backupPage();
      } catch (error) {
        showError(error);
      }
    };
  }

  function exportBackup() {
    try {
      const blob = new Blob(
        [db().exportBackup()],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "NOOR-TOOLS-backup-" +
        new Date().toISOString().slice(0, 10) + ".json";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showError(error);
    }
  }

  /* ربط الأقسام بالواجهة الرئيسية */

  function openSection(label) {
    try {
      if (label.includes("إدارة الأصناف")) return productsPage();

      if (label.includes("المبيعات")) {
        return openInvoice("sale");
      }

      if (label.includes("المشتريات")) {
        return openInvoice("purchase");
      }

      if (label.includes("المخزون")) return stockPage();

      if (label.includes("سجل الفواتير")) return recordsPage();

      if (label.includes("التقارير")) return reportsPage();

      if (label.includes("النسخ الاحتياطي")) return backupPage();

      alert("الإعدادات المتقدمة سنضيفها في مرحلة لاحقة.");
    } catch (error) {
      showError(error);
    }
  }

  /*
    التقاط ضغطات الأقسام الحالية.
    هذا الملف يحتاج تحميل database.js قبله.
  */
  document.addEventListener("click", event => {
    const button = event.target.closest(".tool");
    if (!button) return;

    const label = button.innerText || button.textContent || "";

    const known = [
      "إدارة الأصناف",
      "فواتير المبيعات",
      "فواتير المشتريات",
      "المخزون",
      "سجل الفواتير",
      "التقارير",
      "النسخ الاحتياطي",
      "الإعدادات"
    ];

    const section = known.find(name => label.includes(name));
    if (!section) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    openSection(section);
  }, true);

  window.NoorApp = Object.freeze({
    openProducts: productsPage,
    openSales: () => openInvoice("sale"),
    openPurchases: () => openInvoice("purchase"),
    openStock: stockPage,
    openRecords: recordsPage,
    openReports: reportsPage,
    openBackup: backupPage
  });
})();
