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

  setBtnLoading(btn, isLoading, loadingText = "সংরক্ষণ হচ্ছে...") {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${loadingText}</span>`;
      btn.classList.add("btn-loading");
    } else {
      btn.disabled = false;
      btn.classList.remove("btn-loading");
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
  },

  async saveLog(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const id = document.getElementById("log-id").value;
    const date = document.getElementById("log-date").value || new Date().toISOString().split("T")[0];

    const rows = document.querySelectorAll(".worker-entry-row");
    if (!rows.length) {
      Actions.closeModal("modal-work-log"); 
      return Actions.toast("কোনো শ্রমিক তথ্য পাওয়া যায়নি", "warning");
    }

    Actions.setBtnLoading(btn, true, id ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ হচ্ছে...");

    try {
      let savedCount = 0;
      for (const row of rows) {
        const rSite = row.querySelector(".row-site-select"), wSel = row.querySelector(".row-worker-select");
        const sId = (rSite && rSite.value) ? rSite.value : "";
        const sName = (sId && rSite.selectedIndex >= 0) ? (rSite.options[rSite.selectedIndex]?.getAttribute("data-name") || "বিল্ডিং") : "";
        const wId = wSel?.value || "";
        const wName = (wSel && wSel.selectedIndex >= 0) ? (wSel.options[wSel.selectedIndex]?.getAttribute("data-name") || (wId ? "কর্মী" : "অনির্দিষ্ট কর্মী")) : (wId ? "কর্মী" : "অনির্দিষ্ট কর্মী");
        const role = (wSel && wSel.selectedIndex >= 0) ? (wSel.options[wSel.selectedIndex]?.getAttribute("data-role") || AppState.workers.find(w => w.id === wId)?.role || "মেস্তুরি") : "মেস্তুরি";
        const wage = +row.querySelector(".row-wage-input")?.value || 0;
        const adv = +row.querySelector(".row-advance-input")?.value || 0;
        const sqft = +row.querySelector(".row-sqft-input")?.value || 0;
        const remarks = row.querySelector(".row-remarks-input")?.value.trim() || "";

        if (!wId && !wage && !adv && !sqft) continue;

        const data = { date, site_id: sId, site_name: sName, worker_id: wId, worker_name: wName, role, wage_amount: wage, advance_paid: adv, work_sqft: sqft, remarks };
        if (id && rows.length === 1) await DB.update("work_logs", id, data); 
        else await DB.add("work_logs", data);
        savedCount++;
      }

      Actions.closeModal("modal-work-log");
      Actions.toast(savedCount > 1 ? `${savedCount} জনের তথ্য সফলভাবে সংরক্ষিত হয়েছে!` : "তথ্য সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err) {
      console.error(err);
      Actions.toast("সংরক্ষণ করতে সমস্যা হয়েছে!", "error");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  async saveSite(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const id = document.getElementById("site-id").value;
    const name = document.getElementById("site-name").value.trim(), loc = document.getElementById("site-location").value.trim(), status = document.getElementById("site-status").value || "active";
    if (!name && !loc) return Actions.toast("কমপক্ষে বিল্ডিংয়ের নাম বা লোকেশন দিন!", "warning");
    
    Actions.setBtnLoading(btn, true, id ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ হচ্ছে...");
    try {
      const data = { name: name || "নতুন প্রজেক্ট সাইট", location: loc || "ঠিকানা নেই", status };
      if (id) await DB.update("sites", id, data); else await DB.add("sites", data);
      Actions.closeModal("modal-site"); 
      Actions.toast("বিল্ডিং তথ্য সংরক্ষিত হয়েছে!");
    } catch (err) {
      Actions.toast("বিল্ডিং সংরক্ষণে ত্রুটি হয়েছে!", "error");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  async saveWorker(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const id = document.getElementById("worker-id").value;
    const name = document.getElementById("worker-name").value.trim(), role = document.getElementById("worker-role").value || "মেস্তুরি";
    const rate = +document.getElementById("worker-rate").value || 0, phone = document.getElementById("worker-phone").value.trim();
    const loc = document.getElementById("worker-location")?.value.trim() || "", avatar = document.getElementById("worker-avatar-url")?.value.trim() || "";
    if (!name && !phone && !rate && !loc) return Actions.toast("কমপক্ষে শ্রমিকের নাম বা কোনো তথ্য দিন!", "warning");

    Actions.setBtnLoading(btn, true, id ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ হচ্ছে...");
    try {
      const data = { name: name || "নামবিহীন কারিগর", role, daily_rate: rate, phone, location: loc, avatar_url: avatar };
      if (id) await DB.update("workers", id, data); else await DB.add("workers", data);
      Actions.closeModal("modal-worker"); 
      Actions.toast("শ্রমিক তথ্য সংরক্ষিত হয়েছে!");
    } catch (err) {
      Actions.toast("শ্রমিক সংরক্ষণে ত্রুটি হয়েছে!", "error");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  async saveExpense(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const id = document.getElementById("expense-id").value, sSel = document.getElementById("expense-site-select");
    const date = document.getElementById("expense-date").value || new Date().toISOString().split("T")[0];
    const cat = document.getElementById("expense-category").value || "অন্যান্য বিবিধ খরচ", amt = +document.getElementById("expense-amount").value || 0, note = document.getElementById("expense-note").value.trim();
    const sId = sSel.value || "", sName = sSel.options[sSel.selectedIndex]?.getAttribute("data-name") || "সাধারণ সাইট";
    if (!amt && !note && !sId) return Actions.toast("কমপক্ষে খরচের পরিমাণ বা বিবরণ দিন!", "warning");

    Actions.setBtnLoading(btn, true, id ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ হচ্ছে...");
    try {
      const data = { date, site_id: sId, site_name: sName, category: cat, amount: amt, note };
      if (id) await DB.update("expenses", id, data); else await DB.add("expenses", data);
      Actions.closeModal("modal-expense"); 
      Actions.toast("সাইট খরচ সংরক্ষিত হয়েছে!");
    } catch (err) {
      Actions.toast("খরচ সংরক্ষণে ত্রুটি হয়েছে!", "error");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  saveFirebaseConfig(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    Actions.setBtnLoading(btn, true, "আপডেট হচ্ছে...");
    try {
      const cfg = {
        apiKey: document.getElementById("cfg-api-key").value.trim(), authDomain: document.getElementById("cfg-auth-domain").value.trim(),
        projectId: document.getElementById("cfg-project-id").value.trim(), storageBucket: document.getElementById("cfg-storage-bucket").value.trim(),
        messagingSenderId: document.getElementById("cfg-sender-id").value.trim(), appId: document.getElementById("cfg-app-id").value.trim()
      };
      DB.saveConfig(cfg); 
      Actions.closeModal("modal-settings");
      Actions.toast("ফায়ারবেস কনফিগারেশন আপডেট সম্পন্ন হয়েছে!", "success");
    } catch (err) {
      Actions.toast("কনফিগারেশনে ত্রুটি হয়েছে!", "error");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  changePassword(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const oldP = document.getElementById("old-pass").value, newP = document.getElementById("new-pass").value, confirmP = document.getElementById("confirm-pass").value;
    if (!AppState.verifyPassword(oldP)) return Actions.toast("বর্তমান পাসওয়ার্ড সঠিক নয়!", "error");
    if (newP.length < 6) return Actions.toast("নতুন পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে!", "warning");
    if (newP !== confirmP) return Actions.toast("নতুন পাসওয়ার্ড দুটি মিলেনি!", "error");
    
    Actions.setBtnLoading(btn, true, "পাসওয়ার্ড পরিবর্তন হচ্ছে...");
    try {
      AppState.updatePassword(newP); 
      Actions.closeModal("modal-settings");
      Actions.toast("অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!");
    } finally {
      Actions.setBtnLoading(btn, false);
    }
  },

  exportCSV() {
    const logs = AppState.filterLogs();
    if (!logs.length) return Actions.toast("এক্সপোর্ট করার কোনো ডাটা নেই", "warning");
    const balanceMap = AppState.getRunningBalances();
    let csv = "data:text/csv;charset=utf-8,\uFEFFতারিখ,বিল্ডিং / অবস্থা,শ্রমিক,রোল,মজুরি,জমা,মোট বকেয়া,কাজ (SqFt),নোট\n";
    logs.forEach(l => { 
      const sName = l.site_name || 'কাজ নেই (শুধু পেমেন্ট)';
      const cumDue = balanceMap.has(l.id) ? balanceMap.get(l.id) : ((+l.wage_amount || 0) - (+l.advance_paid || 0));
      csv += `"${l.date}","${sName}","${l.worker_name}","${l.role}",${l.wage_amount},${l.advance_paid},${cumDue},${l.work_sqft || 0},"${l.remarks || ''}"\n`; 
    });
    const link = document.createElement("a"); link.href = encodeURI(csv); link.download = `Tiles_Report_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  }
};
window.Actions = Actions;
