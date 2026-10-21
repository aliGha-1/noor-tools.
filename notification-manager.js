"use strict";

window.NoorNotifications = (() => {
  const STORAGE_KEY = "noor_tools_notifications_v1";
  const MAX_ITEMS = 200;

  function readAll() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("NOOR TOOLS: cannot read notifications", error);
      return [];
    }
  }

  function add(message, type = "info", details = {}) {
    const allowedTypes = ["info", "success", "warning", "error"];

    if (typeof message !== "string" || !message.trim()) {
      throw new Error("اكتب نص الإشعار أولًا.");
    }

    if (!allowedTypes.includes(type)) {
      type = "info";
    }

    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      message: message.trim(),
      type,
      details,
      read: false,
      createdAt: new Date().toISOString()
    };

    const items = readAll();
    items.unshift(notification);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.slice(0, MAX_ITEMS))
      );
    } catch (error) {
      console.error("NOOR TOOLS: cannot save notification", error);
      throw new Error("تعذر حفظ الإشعار على هذا الجهاز.");
    }

    return notification;
  }

  function getAll(options = {}) {
    let items = readAll();

    if (options.unreadOnly) {
      items = items.filter(item => !item.read);
    }

    return items;
  }

  function markRead(id) {
    const items = readAll();
    const item = items.find(entry => entry.id === id);

    if (!item) return false;

    item.read = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  }

  function markAllRead() {
    const items = readAll().map(item => ({
      ...item,
      read: true
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items.length;
  }

  function getUnreadCount() {
    return readAll().filter(item => !item.read).length;
  }

  function remove(id) {
    const items = readAll();
    const remaining = items.filter(item => item.id !== id);

    if (remaining.length === items.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return true;
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }

  return Object.freeze({
    add,
    getAll,
    markRead,
    markAllRead,
    getUnreadCount,
    remove,
    clear
  });
})();
