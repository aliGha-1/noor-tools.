"use strict";

/*
 * NOOR TOOLS
 * Backup Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const BACKUP_FORMAT = "NOOR_TOOLS_BACKUP";
  const BACKUP_VERSION = 1;

  function getDatabase() {
    if (!window.NoorDB) {
      throw new Error("قاعدة بيانات NOOR TOOLS غير متاحة.");
    }

    return window.NoorDB;
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function createBackup() {
    const db = getDatabase();

    if (typeof db.exportBackup !== "function") {
      throw new Error("وظيفة تصدير النسخة الاحتياطية غير متاحة.");
    }

    const data = db.exportBackup();

    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      application: "NOOR TOOLS",
      createdAt: new Date().toISOString(),
      data
    };

    return backup;
  }

  function exportBackup() {
    const backup = createBackup();

    const date = new Date().toISOString()
      .replace(/:/g, "-")
      .replace(/\.\d{3}Z$/, "");

    downloadFile(
      JSON.stringify(backup, null, 2),
      `noor-tools-backup-${date}.json`
    );

    return backup;
  }

  function validateBackup(backup) {
    if (!backup || typeof backup !== "object") {
      throw new Error("ملف النسخة الاحتياطية غير صالح.");
    }

    if (backup.format !== BACKUP_FORMAT) {
      throw new Error("الملف ليس نسخة احتياطية من NOOR TOOLS.");
    }

    if (backup.version !== BACKUP_VERSION) {
      throw new Error("إصدار النسخة الاحتياطية غير مدعوم.");
    }

    if (!backup.data || typeof backup.data !== "object") {
      throw new Error("بيانات النسخة الاحتياطية غير مكتملة.");
    }

    return true;
  }

  async function importBackupFile(file) {
    if (!file) {
      throw new Error("لم يتم اختيار ملف.");
    }

    const text = await file.text();
    let backup;

    try {
      backup = JSON.parse(text);
    } catch {
      throw new Error("تعذر قراءة الملف: تنسيق JSON غير صالح.");
    }

    validateBackup(backup);

    const db = getDatabase();

    if (typeof db.importBackup !== "function") {
      throw new Error("وظيفة استعادة النسخة الاحتياطية غير متاحة.");
    }

    const confirmed = window.confirm(
      "استعادة النسخة الاحتياطية قد تستبدل البيانات الحالية. " +
      "هل تريد المتابعة؟"
    );

    if (!confirmed) {
      return {
        success: false,
        cancelled: true
      };
    }

    const result = db.importBackup(backup.data);

    return {
      success: result !== false,
      cancelled: false
    };
  }

  window.NoorBackup = Object.freeze({
    create: createBackup,
    export: exportBackup,
    validate: validateBackup,
    importFile: importBackupFile
  });
})();
