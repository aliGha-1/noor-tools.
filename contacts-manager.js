"use strict";

/*
 * NOOR TOOLS
 * Customers & Suppliers Manager
 * Design & Development: م. علي غريب
 */

(() => {
  const STORAGE_KEY = "noor_tools_contacts_v1";

  function readContacts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return [];

      const contacts = JSON.parse(saved);

      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error("تعذر قراءة بيانات العملاء والموردين:", error);
      return [];
    }
  }

  function saveContacts(contacts) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(contacts)
    );
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function validateContact(data) {
    if (!data || typeof data !== "object") {
      throw new Error("بيانات جهة الاتصال غير صالحة.");
    }

    const name = normalizeText(data.name);

    if (!name) {
      throw new Error("اكتب اسم العميل أو المورد.");
    }

    const type = data.type;

    if (!["customer", "supplier", "both"].includes(type)) {
      throw new Error("نوع جهة الاتصال غير صحيح.");
    }

    return {
      name,
      type,
      phone: normalizeText(data.phone),
      address: normalizeText(data.address),
      notes: normalizeText(data.notes)
    };
  }

  function getAll(type) {
    const contacts = readContacts();

    if (!type) return contacts;

    return contacts.filter(contact => contact.type === type);
  }

  function getById(id) {
    return readContacts().find(
      contact => contact.id === String(id)
    ) || null;
  }

  function search(query, type) {
    const term = normalizeText(query).toLocaleLowerCase("ar");

    return getAll(type).filter(contact => {
      const searchable = [
        contact.name,
        contact.phone,
        contact.address,
        contact.notes
      ];

      return searchable.some(value =>
        normalizeText(value)
          .toLocaleLowerCase("ar")
          .includes(term)
      );
    });
  }

  function add(data) {
    const contactData = validateContact(data);
    const contacts = readContacts();

    const contact = {
      id: globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contacts.push(contact);
    saveContacts(contacts);

    return contact;
  }

  function update(id, changes) {
    const contacts = readContacts();
    const index = contacts.findIndex(
      contact => contact.id === String(id)
    );

    if (index === -1) {
      throw new Error("العميل أو المورد غير موجود.");
    }

    const updatedData = validateContact({
      ...contacts[index],
      ...changes
    });

    contacts[index] = {
      ...contacts[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    saveContacts(contacts);

    return contacts[index];
  }

  function remove(id) {
    const contacts = readContacts();
    const index = contacts.findIndex(
      contact => contact.id === String(id)
    );

    if (index === -1) {
      return false;
    }

    contacts.splice(index, 1);
    saveContacts(contacts);

    return true;
  }

  function exportContacts() {
    return {
      format: "NOOR_TOOLS_CONTACTS",
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts: readContacts()
    };
  }

  window.NoorContacts = Object.freeze({
    getAll,
    getById,
    search,
    add,
    update,
    remove,
    export: exportContacts
  });
})();
