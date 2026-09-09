// Main Controller & Tab Persistence Routing
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.querySelectorAll('input[type="date"].default-today').forEach(i => i.value = today);

  const formatBnDate = (d = new Date()) => {
    const monthsBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const numbersBn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBn = n => String(n).split("").map(c => numbersBn[c] || c).join("");
    return `${toBn(d.getDate())} ${monthsBn[d.getMonth()]}, ${toBn(d.getFullYear())}`;
  };
  const headerDateEl = document.getElementById("mobile-header-date");
  if (headerDateEl) {
    headerDateEl.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${formatBnDate(new Date())}`;
  }

  const switchTab = (tab, updateHash = true) => {
    const valid = ["dashboard", "logs", "sites", "workers", "expenses", "reports"], target = valid.includes(tab) ? tab : "dashboard";
    AppState.activeTab = target; localStorage.setItem("twt_tab", target);
    if (updateHash && location.hash !== "#" + target) history.replaceState(null, "", "#" + target);
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.tab === target));
    document.querySelectorAll(".mobile-nav-btn").forEach(el => el.classList.toggle("active", el.dataset.tab === target));
    document.querySelectorAll(".tab-content").forEach(el => el.classList.toggle("active", el.id === "tab-" + target));
    const info = {
      dashboard: { title: "ড্যাশবোর্ড ও সংক্ষিপ্ত হিসাব", desc: "দৈনিক কার্যক্রম, মোট মজুরি ও খরচের একনজর হিসাব", btn: "নতুন হাজিরা এন্ট্রি", icon: "fa-solid fa-plus" },
      logs: { title: "দৈনিক হাজিরা ও মজুরি খাতা", desc: "সকল কারিগরের দৈনিক কাজের উপস্থিতি ও মজুরি তালিকা", btn: "নতুন হাজিরা এন্ট্রি", icon: "fa-solid fa-plus" },
      sites: { title: "বিল্ডিং ও সাইট সমূহ", desc: "বিল্ডিং ভিত্তিক কাজের হিসাব ও খরচের খতিয়ান", btn: "নতুন বিল্ডিং যোগ", icon: "fa-solid fa-city" },
      workers: { title: "কারিগর ও শ্রমিক তালিকা", desc: "সকল কারিগর, মেস্তুরি ও হেল্পারদের প্রোফাইল ও হিসাব", btn: "নতুন কারিগর যোগ", icon: "fa-solid fa-user-plus" },
      expenses: { title: "অন্যান্য সাইট খরচ", desc: "মালামাল ক্রয়, পরিবহন ও সাইটের যাবতীয় খরচ", btn: "নতুন খরচ যোগ", icon: "fa-solid fa-receipt" },
      reports: { title: "রিপোর্ট ও প্রিন্ট", desc: "প্রিন্ট ভাউচার ও সম্পূর্ণ হিসাবের বিবরণী", btn: "রিপোর্ট প্রিন্ট", icon: "fa-solid fa-print" }
    };
    const c = info[target] || info.dashboard;
    if (document.getElementById("current-page-title")) document.getElementById("current-page-title").textContent = c.title;
    if (document.getElementById("current-page-desc")) document.getElementById("current-page-desc").textContent = c.desc;
    const topBtn = document.getElementById("btn-topbar-action"), topTxt = document.getElementById("topbar-action-text");
    if (topBtn && topTxt) { topTxt.textContent = c.btn; topBtn.querySelector("i").className = c.icon; }
    document.getElementById("sidebar")?.classList.remove("open"); document.getElementById("sidebar-backdrop")?.classList.remove("active");
    Render.all();
  };

  const initialTab = location.hash.replace("#", "") || localStorage.getItem("twt_tab") || "dashboard";
  switchTab(initialTab, false); window.addEventListener("hashchange", () => switchTab(location.hash.replace("#", ""), false));
  document.querySelectorAll(".nav-item, .mobile-nav-btn").forEach(b => b.addEventListener("click", e => { e.preventDefault(); switchTab(b.dataset.tab); }));
  document.getElementById("mobile-menu-toggle")?.addEventListener("click", () => { document.getElementById("sidebar").classList.toggle("open"); document.getElementById("sidebar-backdrop").classList.toggle("active"); });
  document.getElementById("sidebar-backdrop")?.addEventListener("click", () => { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebar-backdrop").classList.remove("active"); });

  // Admin & Settings
  document.getElementById("btn-admin-toggle")?.addEventListener("click", () => {
    if (AppState.isAdmin) { AppState.setAdmin(false); Actions.toast("ভিউয়ার মোডে ফিরে যাওয়া হয়েছে", "info"); }
    else { document.getElementById("input-admin-pass").value = ""; Actions.openModal("modal-admin-unlock"); }
  });
  document.getElementById("form-admin-unlock")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (AppState.verifyPassword(document.getElementById("input-admin-pass").value)) { AppState.setAdmin(true); Actions.closeModal("modal-admin-unlock"); Actions.toast("অ্যাডমিন মোড আনলক হয়েছে!"); }
    else Actions.toast("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।", "error");
  });
  document.getElementById("btn-open-settings")?.addEventListener("click", () => { Render.settings(); Actions.openModal("modal-settings"); });
  document.getElementById("form-firebase-config")?.addEventListener("submit", Actions.saveFirebaseConfig);
  document.getElementById("form-change-password")?.addEventListener("submit", Actions.changePassword);
  document.getElementById("btn-export-backup")?.addEventListener("click", Actions.exportBackup);
  document.getElementById("input-import-backup")?.addEventListener("change", Actions.importBackup);

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
  });

  // Modals & Form Handlers
  document.querySelectorAll(".close-modal-btn").forEach(b => b.addEventListener("click", e => e.target.closest(".modal-overlay").classList.remove("active")));
  document.querySelectorAll(".modal-overlay").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("active"); }));
  document.getElementById("form-work-log")?.addEventListener("submit", Actions.saveLog);
  document.getElementById("form-site")?.addEventListener("submit", Actions.saveSite);
  document.getElementById("form-worker")?.addEventListener("submit", Actions.saveWorker);
  document.getElementById("form-expense")?.addEventListener("submit", Actions.saveExpense);

  const addWorkerRow = (data = {}) => {
    const c = document.getElementById("worker-rows-container");
    if (!c) return;
    const rowSiteId = data.site_id !== undefined ? data.site_id : "";
    const sOpts = AppState.sites.map(s => `<option value="${escapeHTML(s.id)}" data-name="${escapeHTML(s.name)}" ${rowSiteId === s.id ? 'selected' : ''}>🏢 ${escapeHTML(s.name)}</option>`).join('');
    const siteHtml = `<option value="" ${!rowSiteId ? 'selected' : ''}>🚫 কোনো কাজ নেই (শুধু জমা / পেমেন্ট)</option>` + sOpts;
    const wOpts = AppState.workers.map(w => `<option value="${escapeHTML(w.id)}" data-name="${escapeHTML(w.name)}" data-rate="${w.daily_rate || 0}" data-role="${escapeHTML(w.role || 'মেস্তুরি')}" ${data.worker_id === w.id ? 'selected' : ''}>${escapeHTML(w.name)} [${escapeHTML(w.role || 'মেস্তুরি')}] - ৳${w.daily_rate || 0}/দিন</option>`).join('');
    const workerHtml = AppState.workers.length ? `<option value="" disabled ${!data.worker_id ? 'selected' : ''}>👤 শ্রমিক নির্বাচন করুন...</option>` + wOpts : '<option value="" disabled selected>⚠️ কোনো কারিগর যুক্ত নেই</option>';
    
    const div = document.createElement("div");
    div.className = "worker-entry-row";
    const initWorker = data.worker_id ? AppState.workers.find(w => w.id === data.worker_id) : (data.worker_name ? { name: data.worker_name, role: data.role || 'মেস্তুরি' } : null);
    const initRole = data.role || (initWorker ? initWorker.role : '');
    const badgeCls = initRole === 'কাটার' ? 'tag-cutter' : initRole === 'হেল্পার' ? 'tag-helper' : initRole === 'লেবার' ? 'tag-labor' : 'tag-mistri';
    
    div.innerHTML = `
      <div class="worker-row-top">
        <div class="worker-row-badge-wrap">
          <span class="worker-row-num"><i class="fa-solid fa-user-check"></i> শ্রমিক #${c.children.length + 1}</span>
          <div class="worker-selected-preview" style="${initWorker ? 'display:inline-flex;' : 'display:none;'}">
            <span class="row-avatar-box">${initWorker ? AppState.getAvatar(initWorker, 'worker-avatar-xs') : ''}</span>
            <strong class="row-worker-name-display">${initWorker ? escapeHTML(initWorker.name) : ''}</strong>
            <span class="row-role-tag tag-badge ${badgeCls}">${escapeHTML(initRole || 'মেস্তুরি')}</span>
          </div>
        </div>
        <button type="button" class="btn-remove-worker-row" title="এই শ্রমিক বাদ দিন"><i class="fa-solid fa-trash-can"></i> বাদ দিন</button>
      </div>
      <div class="worker-inputs-grid">
        <div class="form-group worker-field-site">
          <label><i class="fa-solid fa-building"></i> বিল্ডিং / সাইট (কাজ না করলে খালি রাখুন)</label>
          <select class="form-select row-site-select">${siteHtml}</select>
        </div>
        <div class="form-group worker-field-main">
          <label><i class="fa-solid fa-user"></i> শ্রমিক / কারিগর নির্বাচন</label>
          <select class="form-select row-worker-select">${workerHtml}</select>
        </div>
        <div class="form-group">
          <label>মজুরি বাবদ টাকা (৳)</label>
          <input type="number" class="form-control row-wage-input" placeholder="যেমন: ১০০০" value="${data.wage_amount !== undefined ? data.wage_amount : ''}" min="0">
        </div>
        <div class="form-group">
          <label>জমা / দেওয়া হয়েছে (৳)</label>
          <input type="number" class="form-control row-advance-input" placeholder="০" value="${data.advance_paid !== undefined ? data.advance_paid : ''}" min="0">
        </div>
      </div>
      <div class="worker-inputs-subgrid">
        <div class="form-group">
          <label>টাইলস কাজ SqFt (ঐচ্ছিক)</label>
          <input type="number" class="form-control row-sqft-input" placeholder="যেমন: ১৫০" value="${data.work_sqft || ''}" min="0" step="any">
        </div>
        <div class="form-group">
          <label>কাজের বিবরণ / নোট (ঐচ্ছিক)</label>
          <input type="text" class="form-control row-remarks-input" placeholder="যেমন: বাথরুম টাইলস বা মন্তব্য" value="${escapeHTML(data.remarks || '')}">
        </div>
      </div>`;

    div.querySelector(".row-worker-select").addEventListener("change", e => {
      const opt = e.target.options[e.target.selectedIndex];
      if (opt && opt.value) {
        const w = AppState.workers.find(item => item.id === opt.value);
        const wageInput = div.querySelector(".row-wage-input");
        const workerLogs = AppState.logs.filter(l => l.worker_id === opt.value && +l.wage_amount > 0).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const autoWage = workerLogs.length ? workerLogs[0].wage_amount : (opt.getAttribute("data-rate") || "");
        wageInput.value = autoWage || opt.getAttribute("data-rate") || "";
        
        const r = opt.getAttribute("data-role") || (w ? w.role : "মেস্তুরি");
        const previewBox = div.querySelector(".worker-selected-preview");
        const avatarBox = div.querySelector(".row-avatar-box");
        const nameDisplay = div.querySelector(".row-worker-name-display");
        const tag = div.querySelector(".row-role-tag");

        if (avatarBox && w) avatarBox.innerHTML = AppState.getAvatar(w, 'worker-avatar-xs');
        if (nameDisplay && w) nameDisplay.textContent = w.name;
        if (tag) {
          tag.textContent = r;
          tag.className = `row-role-tag tag-badge ${r === 'কাটার' ? 'tag-cutter' : r === 'হেল্পার' ? 'tag-helper' : r === 'লেবার' ? 'tag-labor' : 'tag-mistri'}`;
        }
        if (previewBox) previewBox.style.display = "inline-flex";
      }
    });
    div.querySelector(".row-site-select").addEventListener("change", e => {
      const wSel = div.querySelector(".row-worker-select");
      const opt = wSel?.options[wSel.selectedIndex];
      const wageInput = div.querySelector(".row-wage-input");
      if (e.target.value) {
        if (opt && opt.value && (!wageInput.value || wageInput.value === "0")) {
          const workerLogs = AppState.logs.filter(l => l.worker_id === opt.value && +l.wage_amount > 0).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          const autoWage = workerLogs.length ? workerLogs[0].wage_amount : (opt.getAttribute("data-rate") || "");
          wageInput.value = autoWage || opt.getAttribute("data-rate") || "";
        }
      } else {
        if (!data.id) {
          wageInput.value = "0";
        }
      }
    });
    div.querySelector(".btn-remove-worker-row").addEventListener("click", () => {
      if (c.children.length > 1) {
        div.remove();
        Array.from(c.children).forEach((r, idx) => { r.querySelector('.worker-row-num').innerHTML = `<i class="fa-solid fa-user-check"></i> শ্রমিক #${idx + 1}`; });
      } else Actions.toast("কমপক্ষে একজন শ্রমিক থাকতে হবে", "info");
    });
    c.appendChild(div);
  };

  const openLog = () => { document.getElementById("form-work-log").reset(); Render.dropdowns(); document.getElementById("log-id").value = ""; document.getElementById("log-date").value = today; document.getElementById("modal-log-title").textContent = "দৈনিক হাজিরা / মজুরি / কাজের এন্ট্রি"; document.getElementById("btn-add-worker-row").style.display = "inline-flex"; document.getElementById("worker-rows-container").innerHTML = ""; addWorkerRow(); Actions.openModal("modal-work-log"); };
  const openSite = () => { document.getElementById("form-site").reset(); document.getElementById("site-id").value = ""; Actions.openModal("modal-site"); };
  const openWorker = () => { document.getElementById("form-worker").reset(); document.getElementById("worker-id").value = ""; Actions.openModal("modal-worker"); };
  const openExp = () => { document.getElementById("form-expense").reset(); Render.dropdowns(); document.getElementById("expense-id").value = ""; document.getElementById("expense-date").value = today; document.getElementById("expense-amount").value = ""; document.getElementById("expense-note").value = ""; Actions.openModal("modal-expense"); };

  document.getElementById("btn-add-worker-row")?.addEventListener("click", () => {
    addWorkerRow();
    const mb = document.querySelector("#modal-work-log .modal-body");
    if (mb) mb.scrollTop = mb.scrollHeight;
  });

  document.getElementById("btn-topbar-action")?.addEventListener("click", () => {
    if (AppState.activeTab === "sites") openSite(); else if (AppState.activeTab === "workers") openWorker();
    else if (AppState.activeTab === "expenses") openExp(); else if (AppState.activeTab === "reports") window.print(); else openLog();
  });
  ["btn-open-add-log", "btn-add-log-tab"].forEach(id => document.getElementById(id)?.addEventListener("click", openLog));
  ["btn-open-add-site", "btn-add-site-tab"].forEach(id => document.getElementById(id)?.addEventListener("click", openSite));
  ["btn-open-add-worker", "btn-add-worker-tab"].forEach(id => document.getElementById(id)?.addEventListener("click", openWorker));
  ["btn-open-add-expense", "btn-add-expense-tab"].forEach(id => document.getElementById(id)?.addEventListener("click", openExp));
  document.getElementById("link-quick-add-site")?.addEventListener("click", () => { Actions.closeModal("modal-work-log"); openSite(); });
  document.getElementById("link-quick-add-worker")?.addEventListener("click", () => { Actions.closeModal("modal-work-log"); openWorker(); });
  document.getElementById("link-quick-add-site-exp")?.addEventListener("click", () => { Actions.closeModal("modal-expense"); openSite(); });

  // Filters
  const onFilter = () => {
    AppState.filters.siteId = document.getElementById("filter-site")?.value || "all";
    AppState.filters.workerId = document.getElementById("filter-worker")?.value || "all";
    AppState.filters.role = document.getElementById("filter-role")?.value || "all";
    AppState.filters.startDate = document.getElementById("filter-start-date")?.value || "";
    AppState.filters.endDate = document.getElementById("filter-end-date")?.value || "";
    AppState.filters.q = document.getElementById("filter-search")?.value || "";
    Render.logs(); Render.expenses(); Render.reports();
  };
  document.querySelectorAll("#filter-site, #filter-worker, #filter-role, #filter-start-date, #filter-end-date").forEach(el => el?.addEventListener("change", onFilter));
  document.getElementById("filter-search")?.addEventListener("input", onFilter);
  document.getElementById("btn-toggle-filters")?.addEventListener("click", () => document.getElementById("filter-collapse-content")?.classList.toggle("open"));
  document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
    document.querySelectorAll(".filter-select").forEach(s => s.value = "all");
    document.getElementById("filter-start-date").value = ""; document.getElementById("filter-end-date").value = ""; document.getElementById("filter-search").value = ""; onFilter();
  });

  // View Modes Handlers
  document.getElementById("btn-view-card")?.addEventListener("click", () => AppState.setViewMode("card"));
  document.getElementById("btn-view-table")?.addEventListener("click", () => AppState.setViewMode("table"));

  // Actions & Delegated Clicks
  document.addEventListener("click", async (e) => {
    // Accordion Date Group Header Toggle (One Open at a Time with Smooth Animation)
    const dateHeader = e.target.closest(".date-group-header");
    if (dateHeader && !e.target.closest(".edit-log-btn, .delete-log-btn, .btn")) {
      const card = dateHeader.closest(".date-group-card");
      if (!card) return;
      const date = dateHeader.dataset.date;
      const container = document.getElementById("worklogs-container");
      const isCurrentlyExpanded = card.classList.contains("is-expanded");

      if (isCurrentlyExpanded) {
        // Collapse clicked card
        card.classList.remove("is-expanded");
        card.classList.add("is-collapsed");
        card.querySelector(".accordion-arrow")?.classList.remove("open");
        AppState.expandedDate = null;
      } else {
        // Collapse all other expanded cards first
        if (container) {
          container.querySelectorAll(".date-group-card.is-expanded").forEach(c => {
            c.classList.remove("is-expanded");
            c.classList.add("is-collapsed");
            c.querySelector(".accordion-arrow")?.classList.remove("open");
          });
        }
        // Expand the clicked card
        card.classList.remove("is-collapsed");
        card.classList.add("is-expanded");
        card.querySelector(".accordion-arrow")?.classList.add("open");
        AppState.expandedDate = date;
      }
      return;
    }

    const profW = e.target.closest(".view-worker-profile-btn"), editL = e.target.closest(".edit-log-btn"), delL = e.target.closest(".delete-log-btn"), editS = e.target.closest(".edit-site-btn"), delS = e.target.closest(".delete-site-btn"), editW = e.target.closest(".edit-worker-btn"), delW = e.target.closest(".delete-worker-btn"), editE = e.target.closest(".edit-expense-btn"), delE = e.target.closest(".delete-expense-btn");

    if (profW) { const w = AppState.workers.find(i => i.id === profW.dataset.id); Render.workerProfile(w); Actions.openModal("modal-worker-profile"); }
    if (editL) { 
      if (!AppState.isAdmin) { Actions.toast("এটি সম্পাদনা করার জন্য অ্যাডমিন আনলক করুন!", "warning"); return; }
      const l = AppState.logs.find(i => i.id === editL.dataset.id); 
      if (l) { 
        Render.dropdowns(); 
        document.getElementById("log-id").value = l.id; 
        document.getElementById("log-date").value = l.date; 
        document.getElementById("modal-log-title").textContent = "হাজিরা ও মজুরি তথ্য সম্পাদনা"; 
        document.getElementById("btn-add-worker-row").style.display = "none"; 
        const c = document.getElementById("worker-rows-container"); 
        c.innerHTML = ""; 
        addWorkerRow(l); 
        Actions.openModal("modal-work-log"); 
      } 
    }
    if (delL) {
      if (!AppState.isAdmin) { Actions.toast("এটি মুছে ফেলার জন্য অ্যাডমিন আনলক করুন!", "warning"); return; }
      if (confirm("আপনি কি নিশ্চিত এই হাজিরার এন্ট্রি মুছে ফেলতে চান?")) { await DB.remove("work_logs", delL.dataset.id); Actions.toast("হাজিরা এন্ট্রি মুছে ফেলা হয়েছে", "info"); }
    }
    if (editS) { 
      if (!AppState.isAdmin) { Actions.toast("বিল্ডিং তথ্য সম্পাদনা করতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      const s = AppState.sites.find(i => i.id === editS.dataset.id); if (s) { document.getElementById("site-id").value = s.id; document.getElementById("site-name").value = s.name; document.getElementById("site-location").value = s.location || ""; document.getElementById("site-status").value = s.status || "active"; Actions.openModal("modal-site"); } 
    }
    if (delS) {
      if (!AppState.isAdmin) { Actions.toast("বিল্ডিং মুছতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      if (confirm("বিল্ডিংটি মুছে ফেলতে চান? (এর সাথে যুক্ত আগের রেকর্ড অক্ষুণ্ন থাকবে)")) { await DB.remove("sites", delS.dataset.id); Actions.toast("বিল্ডিং মুছে ফেলা হয়েছে", "info"); }
    }
    if (editW) { 
      if (!AppState.isAdmin) { Actions.toast("শ্রমিক তথ্য সম্পাদনা করতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      const w = AppState.workers.find(i => i.id === editW.dataset.id); if (w) { document.getElementById("worker-id").value = w.id; document.getElementById("worker-name").value = w.name; document.getElementById("worker-role").value = w.role; document.getElementById("worker-phone").value = w.phone || ""; document.getElementById("worker-rate").value = w.daily_rate || 0; document.getElementById("worker-location").value = w.location || ""; document.getElementById("worker-avatar-url").value = w.avatar_url || ""; Actions.openModal("modal-worker"); } 
    }
    if (delW) {
      if (!AppState.isAdmin) { Actions.toast("শ্রমিক মুছতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      if (confirm("শ্রমিক প্রোফাইলটি মুছে ফেলতে চান?")) { await DB.remove("workers", delW.dataset.id); Actions.toast("শ্রমিক মুছে ফেলা হয়েছে", "info"); }
    }
    if (editE) { 
      if (!AppState.isAdmin) { Actions.toast("খরচ সম্পাদনা করতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      const exp = AppState.expenses.find(i => i.id === editE.dataset.id); if (exp) { Render.dropdowns(); document.getElementById("expense-id").value = exp.id; document.getElementById("expense-date").value = exp.date; document.getElementById("expense-site-select").value = exp.site_id; document.getElementById("expense-category").value = exp.category; document.getElementById("expense-amount").value = exp.amount; document.getElementById("expense-note").value = exp.note || ""; Actions.openModal("modal-expense"); } 
    }
    if (delE) {
      if (!AppState.isAdmin) { Actions.toast("খরচের রেকর্ড মুছতে অ্যাডমিন আনলক করুন!", "warning"); return; }
      if (confirm("খরচের রেকর্ডটি মুছে ফেলতে চান?")) { await DB.remove("expenses", delE.dataset.id); Actions.toast("খরচ মুছে ফেলা হয়েছে", "info"); }
    }
    if (e.target.closest(".view-site-btn")) { document.getElementById("filter-site").value = e.target.closest(".view-site-btn").dataset.id; onFilter(); switchTab("logs"); }
  });
  document.getElementById("btn-export-csv")?.addEventListener("click", Actions.exportCSV);
  document.getElementById("btn-print-report")?.addEventListener("click", () => window.print());

  DB.listen("sites", list => { AppState.sites = list; Render.all(); });
  DB.listen("workers", list => { AppState.workers = list; Render.all(); });
  DB.listen("work_logs", list => { AppState.logs = list; Render.all(); });
  DB.listen("expenses", list => { AppState.expenses = list; Render.all(); });
});
