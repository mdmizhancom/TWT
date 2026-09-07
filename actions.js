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
    const id = document.getElementById("log-id").value;
    const sSel = document.getElementById("log-site-select"), wSel = document.getElementById("log-worker-select");
    const data = {
      date: document.getElementById("log-date").value,
      site_id: sSel.value, site_name: sSel.options[sSel.selectedIndex]?.getAttribute("data-name") || "",
      worker_id: wSel.value, worker_name: wSel.options[wSel.selectedIndex]?.getAttribute("data-name") || "",
      role: document.getElementById("log-role-select").value,
      wage_amount: +document.getElementById("log-wage-input").value || 0,
      advance_paid: +document.getElementById("log-advance-input").value || 0,
      work_sqft: +document.getElementById("log-sqft-input").value || 0,
      remarks: document.getElementById("log-remarks-input").value
    };
    if (id) await DB.update("work_logs", id, data); else await DB.add("work_logs", data);
    Actions.closeModal("modal-work-log"); Actions.toast("হাজিরা ও মজুরি সংরক্ষিত হয়েছে!");
  },

  async saveSite(e) {
    e.preventDefault();
    const id = document.getElementById("site-id").value;
    const data = { name: document.getElementById("site-name").value, location: document.getElementById("site-location").value, status: document.getElementById("site-status").value };
    if (id) await DB.update("sites", id, data); else await DB.add("sites", data);
    Actions.closeModal("modal-site"); Actions.toast("বিল্ডিং তথ্য সংরক্ষিত হয়েছে!");
  },

  async saveWorker(e) {
    e.preventDefault();
    const id = document.getElementById("worker-id").value;
    const data = {
      name: document.getElementById("worker-name").value, role: document.getElementById("worker-role").value,
      daily_rate: +document.getElementById("worker-rate").value || 0, phone: document.getElementById("worker-phone").value,
      location: document.getElementById("worker-location")?.value || "", avatar_url: document.getElementById("worker-avatar-url")?.value || ""
    };
    if (id) await DB.update("workers", id, data); else await DB.add("workers", data);
    Actions.closeModal("modal-worker"); Actions.toast("শ্রমিক তথ্য সংরক্ষিত হয়েছে!");
  },

  async saveExpense(e) {
    e.preventDefault();
    const id = document.getElementById("expense-id").value, sSel = document.getElementById("expense-site-select");
    const data = {
      date: document.getElementById("expense-date").value, site_id: sSel.value,
      site_name: sSel.options[sSel.selectedIndex]?.getAttribute("data-name") || "",
      category: document.getElementById("expense-category").value, amount: +document.getElementById("expense-amount").value || 0, note: document.getElementById("expense-note").value
    };
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
    Actions.toast("ফায়ারবেস কনফিগারেশন আপডেট ও পুনঃসংযোগ সম্পন্ন হয়েছে!", "success");
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
