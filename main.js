// Main Controller & Tab Persistence Routing
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.querySelectorAll('input[type="date"].default-today').forEach(i => i.value = today);

  const switchTab = (tab, updateHash = true) => {
    const valid = ["dashboard", "logs", "sites", "workers", "expenses", "reports"];
    const target = valid.includes(tab) ? tab : "dashboard";
    AppState.activeTab = target;
    localStorage.setItem("twt_tab", target);
    if (updateHash && location.hash !== "#" + target) history.replaceState(null, "", "#" + target);

    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.tab === target));
    document.querySelectorAll(".mobile-nav-btn").forEach(el => el.classList.toggle("active", el.dataset.tab === target));
    document.querySelectorAll(".tab-content").forEach(el => el.classList.toggle("active", el.id === "tab-" + target));

    const titles = { dashboard: "ড্যাশবোর্ড ও সংক্ষিপ্ত হিসাব", logs: "দৈনিক হাজিরা ও মজুরি খাতা", sites: "বিল্ডিং ও সাইট সমূহ", workers: "কারিগর ও শ্রমিক তালিকা", expenses: "অন্যান্য সাইট খরচ", reports: "রিপোর্ট ও প্রিন্ট" };
    if (titles[target]) document.getElementById("current-page-title").textContent = titles[target];
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-backdrop").classList.remove("active");
    Render.all();
  };

  const initialTab = location.hash.replace("#", "") || localStorage.getItem("twt_tab") || "dashboard";
  switchTab(initialTab, false);
  window.addEventListener("hashchange", () => switchTab(location.hash.replace("#", ""), false));

  document.querySelectorAll(".nav-item, .mobile-nav-btn").forEach(b => b.addEventListener("click", e => { e.preventDefault(); switchTab(b.dataset.tab); }));
  document.getElementById("mobile-menu-toggle")?.addEventListener("click", () => { document.getElementById("sidebar").classList.toggle("open"); document.getElementById("sidebar-backdrop").classList.toggle("active"); });
  document.getElementById("sidebar-backdrop")?.addEventListener("click", () => { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebar-backdrop").classList.remove("active"); });

  // Admin Toggle & Password Login
  document.getElementById("btn-admin-toggle")?.addEventListener("click", () => {
    if (AppState.isAdmin) { AppState.setAdmin(false); Actions.toast("ভিউয়ার মোডে ফিরে যাওয়া হয়েছে", "info"); }
    else { document.getElementById("input-admin-pass").value = ""; Actions.openModal("modal-admin-unlock"); }
  });

  document.getElementById("form-admin-unlock")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (AppState.verifyPassword(document.getElementById("input-admin-pass").value)) {
      AppState.setAdmin(true); Actions.closeModal("modal-admin-unlock"); Actions.toast("অ্যাডমিন মোড সফলভাবে আনলক হয়েছে!");
    } else { Actions.toast("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।", "error"); }
  });

  // Settings Modals & Closers
  document.getElementById("btn-open-settings")?.addEventListener("click", () => { Render.settings(); Actions.openModal("modal-settings"); });
  document.getElementById("form-firebase-config")?.addEventListener("submit", Actions.saveFirebaseConfig);
  document.getElementById("form-change-password")?.addEventListener("submit", Actions.changePassword);
  document.querySelectorAll(".close-modal-btn").forEach(b => b.addEventListener("click", e => e.target.closest(".modal-overlay").classList.remove("active")));
  document.querySelectorAll(".modal-overlay").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("active"); }));
  document.getElementById("form-work-log")?.addEventListener("submit", Actions.saveLog);
  document.getElementById("form-site")?.addEventListener("submit", Actions.saveSite);
  document.getElementById("form-worker")?.addEventListener("submit", Actions.saveWorker);
  document.getElementById("form-expense")?.addEventListener("submit", Actions.saveExpense);

  // Quick Open Modal Handlers
  document.getElementById("btn-quick-add-log")?.addEventListener("click", () => { document.getElementById("form-work-log").reset(); document.getElementById("log-id").value = ""; document.getElementById("log-date").value = today; Actions.openModal("modal-work-log"); });
  document.getElementById("btn-open-add-log")?.addEventListener("click", () => document.getElementById("btn-quick-add-log").click());
  document.getElementById("btn-open-add-site")?.addEventListener("click", () => { document.getElementById("form-site").reset(); document.getElementById("site-id").value = ""; Actions.openModal("modal-site"); });
  document.getElementById("btn-open-add-worker")?.addEventListener("click", () => { document.getElementById("form-worker").reset(); document.getElementById("worker-id").value = ""; Actions.openModal("modal-worker"); });
  document.getElementById("btn-open-add-expense")?.addEventListener("click", () => { document.getElementById("form-expense").reset(); document.getElementById("expense-id").value = ""; document.getElementById("expense-date").value = today; Actions.openModal("modal-expense"); });
  document.getElementById("log-worker-select")?.addEventListener("change", e => {
    const opt = e.target.options[e.target.selectedIndex];
    if (opt) { document.getElementById("log-wage-input").value = opt.getAttribute("data-rate") || ""; document.getElementById("log-role-select").value = opt.getAttribute("data-role") || "মেস্তুরি"; }
  });

  // Filter Listeners
  const onFilter = () => {
    AppState.filters.siteId = document.getElementById("filter-site")?.value || "all";
    AppState.filters.workerId = document.getElementById("filter-worker")?.value || "all";
    AppState.filters.role = document.getElementById("filter-role")?.value || "all";
    AppState.filters.startDate = document.getElementById("filter-start-date")?.value || "";
    AppState.filters.endDate = document.getElementById("filter-end-date")?.value || "";
    AppState.filters.q = document.getElementById("filter-search")?.value || "";
    Render.logs(); Render.expenses();
  };
  document.querySelectorAll("#filter-site, #filter-worker, #filter-role, #filter-start-date, #filter-end-date").forEach(el => el?.addEventListener("change", onFilter));
  document.getElementById("filter-search")?.addEventListener("input", onFilter);
  document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
    document.querySelectorAll(".filter-select").forEach(s => s.value = "all");
    document.getElementById("filter-start-date").value = ""; document.getElementById("filter-end-date").value = ""; document.getElementById("filter-search").value = "";
    onFilter();
  });

  // Delegated Actions
  document.addEventListener("click", async (e) => {
    const profW = e.target.closest(".view-worker-profile-btn");
    if (profW) { const w = AppState.workers.find(i => i.id === profW.dataset.id); Render.workerProfile(w); Actions.openModal("modal-worker-profile"); }
    const editL = e.target.closest(".edit-log-btn"), delL = e.target.closest(".delete-log-btn");
    const editS = e.target.closest(".edit-site-btn"), delS = e.target.closest(".delete-site-btn");
    const editW = e.target.closest(".edit-worker-btn"), delW = e.target.closest(".delete-worker-btn");
    const editE = e.target.closest(".edit-expense-btn"), delE = e.target.closest(".delete-expense-btn");
    const viewS = e.target.closest(".view-site-btn");

    if (editL) { const l = AppState.logs.find(i => i.id === editL.dataset.id); if (l) { document.getElementById("log-id").value = l.id; document.getElementById("log-date").value = l.date; document.getElementById("log-site-select").value = l.site_id; document.getElementById("log-worker-select").value = l.worker_id; document.getElementById("log-role-select").value = l.role; document.getElementById("log-wage-input").value = l.wage_amount; document.getElementById("log-advance-input").value = l.advance_paid || 0; document.getElementById("log-sqft-input").value = l.work_sqft || 0; document.getElementById("log-remarks-input").value = l.remarks || ""; Actions.openModal("modal-work-log"); } }
    if (delL && confirm("এন্ট্রি মুছে ফেলতে চান?")) { await DB.remove("work_logs", delL.dataset.id); Actions.toast("মুছে ফেলা হয়েছে", "info"); }
    if (editS) { const s = AppState.sites.find(i => i.id === editS.dataset.id); if (s) { document.getElementById("site-id").value = s.id; document.getElementById("site-name").value = s.name; document.getElementById("site-location").value = s.location || ""; document.getElementById("site-status").value = s.status || "active"; Actions.openModal("modal-site"); } }
    if (delS && confirm("বিল্ডিং মুছে ফেলতে চান?")) { await DB.remove("sites", delS.dataset.id); Actions.toast("মুছে ফেলা হয়েছে", "info"); }
    if (editW) { const w = AppState.workers.find(i => i.id === editW.dataset.id); if (w) { document.getElementById("worker-id").value = w.id; document.getElementById("worker-name").value = w.name; document.getElementById("worker-role").value = w.role; document.getElementById("worker-phone").value = w.phone || ""; document.getElementById("worker-rate").value = w.daily_rate || 0; document.getElementById("worker-location").value = w.location || ""; document.getElementById("worker-avatar-url").value = w.avatar_url || ""; Actions.openModal("modal-worker"); } }
    if (delW && confirm("কর্মী মুছে ফেলতে চান?")) { await DB.remove("workers", delW.dataset.id); Actions.toast("মুছে ফেলা হয়েছে", "info"); }
    if (editE) { const exp = AppState.expenses.find(i => i.id === editE.dataset.id); if (exp) { document.getElementById("expense-id").value = exp.id; document.getElementById("expense-date").value = exp.date; document.getElementById("expense-site-select").value = exp.site_id; document.getElementById("expense-category").value = exp.category; document.getElementById("expense-amount").value = exp.amount; document.getElementById("expense-note").value = exp.note || ""; Actions.openModal("modal-expense"); } }
    if (delE && confirm("খরচ মুছে ফেলতে চান?")) { await DB.remove("expenses", delE.dataset.id); Actions.toast("মুছে ফেলা হয়েছে", "info"); }
    if (viewS) { document.getElementById("filter-site").value = viewS.dataset.id; onFilter(); switchTab("logs"); }
  });

  document.getElementById("btn-export-csv")?.addEventListener("click", Actions.exportCSV);
  document.getElementById("btn-print-report")?.addEventListener("click", () => window.print());

  // Real-time Listeners
  DB.listen("sites", list => { AppState.sites = list; Render.all(); });
  DB.listen("workers", list => { AppState.workers = list; Render.all(); });
  DB.listen("work_logs", list => { AppState.logs = list; Render.all(); });
  DB.listen("expenses", list => { AppState.expenses = list; Render.all(); });
});
