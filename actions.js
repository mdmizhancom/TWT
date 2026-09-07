// User Actions, Security & Worker Profile Controller
const Actions = {
  toast(msg, type = "success") {
    const c = document.getElementById("toast-container");
    if (!c) return;
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  openModal(id) { const el = document.getElementById(id); if (el) el.classList.add("active"); },
  closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove("active"); },

  async saveLog(e) {
    e.preventDefault();
    const id = document.getElementById("log-id").value, topSite = document.getElementById("log-site-select");
    const date = document.getElementById("log-date").value || new Date().toISOString().split("T")[0];
    const topSId = topSite?.value || "", topSName = topSite?.options[topSite.selectedIndex]?.getAttribute("data-name") || (topSId ? "বিল্ডিং" : "সাধারণ সাইট");

    const rows = document.querySelectorAll(".worker-entry-row");
    if (!rows.length) {
      const emptyData = { date, site_id: topSId, site_name: topSName, worker_name: "কর্মী", role: "মেস্তুরি" };
      if (id) await DB.update("work_logs", id, emptyData); else await DB.add("work_logs", emptyData);
      Actions.closeModal("modal-work-log"); return Actions.toast("তারিখ তথ্য সংরক্ষিত হয়েছে!");
    }

    let savedCount = 0;
    for (const row of rows) {
      const rSite = row.querySelector(".row-site-select"), wSel = row.querySelector(".row-worker-select");
      const sId = (rSite && rSite.value) ? rSite.value : topSId;
      const sName = (rSite && rSite.value && rSite.selectedIndex >= 0) ? (rSite.options[rSite.selectedIndex]?.getAttribute("data-name") || (sId ? "বিল্ডিং" : "সাধারণ সাইট")) : topSName;
      const wId = wSel?.value || "";
      const wName = (wSel && wSel.selectedIndex >= 0) ? (wSel.options[wSel.selectedIndex]?.getAttribute("data-name") || (wId ? "কর্মী" : "অনির্দিষ্ট কর্মী")) : (wId ? "কর্মী" : "অনির্দিষ্ট কর্মী");
      const role = (wSel && wSel.selectedIndex >= 0) ? (wSel.options[wSel.selectedIndex]?.getAttribute("data-role") || AppState.workers.find(w => w.id === wId)?.role || "মেস্তুরি") : "মেস্তুরি";
      const wage = +row.querySelector(".row-wage-input")?.value || 0, adv = +row.querySelector(".row-advance-input")?.value || 0;
      const sqft = +row.querySelector(".row-sqft-input")?.value || 0, remarks = row.querySelector(".row-remarks-input")?.value.trim() || "";

      const data = { date, site_id: sId, site_name: sName, worker_id: wId, worker_name: wName, role, wage_amount: wage, advance_paid: adv, work_sqft: sqft, remarks };
      if (id && rows.length === 1) await DB.update("work_logs", id, data); else await DB.add("work_logs", data);
      savedCount++;
    }

    Actions.closeModal("modal-work-log");
    Actions.toast(savedCount > 1 ? `${savedCount} জন শ্রমিকের হাজিরা সফলভাবে সংরক্ষিত হয়েছে!` : "হাজিরা ও কাজের তথ্য সংরক্ষিত হয়েছে!");
  },

  async saveSite(e) {
    e.preventDefault();
    const id = document.getElementById("site-id").value;
    const name = document.getElementById("site-name").value.trim(), loc = document.getElementById("site-location").value.trim(), status = document.getElementById("site-status").value || "active";
    if (!name && !loc) return Actions.toast("কমপক্ষে বিল্ডিংয়ের নাম বা লোকেশন দিন!", "warning");
    const data = { name: name || "নতুন প্রজেক্ট সাইট", location: loc || "ঠিকানা নেই", status };
    if (id) await DB.update("sites", id, data); else await DB.add("sites", data);
    Actions.closeModal("modal-site"); Actions.toast("বিল্ডিং তথ্য সংরক্ষিত হয়েছে!");
  },

  async saveWorker(e) {
    e.preventDefault();
    const id = document.getElementById("worker-id").value;
    const name = document.getElementById("worker-name").value.trim(), role = document.getElementById("worker-role").value || "মেস্তুরি";
    const rate = +document.getElementById("worker-rate").value || 0, phone = document.getElementById("worker-phone").value.trim();
    const loc = document.getElementById("worker-location")?.value.trim() || "", avatar = document.getElementById("worker-avatar-url")?.value.trim() || "";
    if (!name && !phone && !rate && !loc) return Actions.toast("কমপক্ষে শ্রমিকের নাম বা কোনো তথ্য দিন!", "warning");
    const data = { name: name || "নামবিহীন কারিগর", role, daily_rate: rate, phone, location: loc, avatar_url: avatar };
    if (id) await DB.update("workers", id, data); else await DB.add("workers", data);
    Actions.closeModal("modal-worker"); Actions.toast("শ্রমিক তথ্য সংরক্ষিত হয়েছে!");
  },

  async saveExpense(e) {
    e.preventDefault();
    const id = document.getElementById("expense-id").value, sSel = document.getElementById("expense-site-select");
    const date = document.getElementById("expense-date").value || new Date().toISOString().split("T")[0];
    const cat = document.getElementById("expense-category").value || "অন্যান্য বিবিধ খরচ", amt = +document.getElementById("expense-amount").value || 0, note = document.getElementById("expense-note").value.trim();
    const sId = sSel.value || "", sName = sSel.options[sSel.selectedIndex]?.getAttribute("data-name") || "সাধারণ সাইট";
    if (!amt && !note && !sId) return Actions.toast("কমপক্ষে খরচের পরিমাণ বা বিবরণ দিন!", "warning");
    const data = { date, site_id: sId, site_name: sName, category: cat, amount: amt, note };
    if (id) await DB.update("expenses", id, data); else await DB.add("expenses", data);
    Actions.closeModal("modal-expense"); Actions.toast("সাইট খরচ সংরক্ষিত হয়েছে!");
  },

  saveFirebaseConfig(e) {
    e.preventDefault();
    const cfg = {
      apiKey: document.getElementById("cfg-api-key").value.trim(), authDomain: document.getElementById("cfg-auth-domain").value.trim(),
      projectId: document.getElementById("cfg-project-id").value.trim(), storageBucket: document.getElementById("cfg-storage-bucket").value.trim(),
      messagingSenderId: document.getElementById("cfg-sender-id").value.trim(), appId: document.getElementById("cfg-app-id").value.trim()
    };
    DB.saveConfig(cfg); Actions.closeModal("modal-settings");
    Actions.toast("ফায়ারবেস কনফিগারেশন আপডেট সম্পন্ন হয়েছে!", "success");
  },

  changePassword(e) {
    e.preventDefault();
    const oldP = document.getElementById("old-pass").value, newP = document.getElementById("new-pass").value, confirmP = document.getElementById("confirm-pass").value;
    if (!AppState.verifyPassword(oldP)) return Actions.toast("বর্তমান পাসওয়ার্ড সঠিক নয়!", "error");
    if (newP.length < 6) return Actions.toast("নতুন পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে!", "warning");
    if (newP !== confirmP) return Actions.toast("নতুন পাসওয়ার্ড দুটি মিলেনি!", "error");
    AppState.updatePassword(newP); Actions.closeModal("modal-settings");
    Actions.toast("অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!");
  },

  exportCSV() {
    const logs = AppState.filterLogs();
    if (!logs.length) return Actions.toast("এক্সপোর্ট করার কোনো ডাটা নেই", "warning");
    let csv = "data:text/csv;charset=utf-8,\uFEFFতারিখ,বিল্ডিং,শ্রমিক,রোল,মজুরি,অগ্রিম,বকেয়া,কাজ (SqFt),নোট\n";
    logs.forEach(l => { csv += `"${l.date}","${l.site_name}","${l.worker_name}","${l.role}",${l.wage_amount},${l.advance_paid},${+l.wage_amount - +l.advance_paid},${l.work_sqft || 0},"${l.remarks || ''}"\n`; });
    const link = document.createElement("a"); link.href = encodeURI(csv); link.download = `Tiles_Report_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  }
};
window.Actions = Actions;
