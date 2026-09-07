// UI Rendering Engine with Worker Profile Support
const Render = {
  updateAdmin() {
    const p = document.getElementById("admin-status-pill"), b = document.getElementById("btn-admin-toggle");
    document.body.classList.toggle("is-admin", AppState.isAdmin);
    if (p) { p.className = AppState.isAdmin ? "badge-pill admin" : "badge-pill viewer"; p.innerHTML = AppState.isAdmin ? '<i class="fa-solid fa-lock-open"></i> অ্যাডমিন মোড' : '<i class="fa-solid fa-eye"></i> ভিউয়ার মোড'; }
    if (b) b.innerHTML = AppState.isAdmin ? '<i class="fa-solid fa-lock"></i> <span>লক করুন</span>' : '<i class="fa-solid fa-key"></i> <span>আনলক করুন</span>';
  },

  dropdowns() {
    const sOpts = AppState.sites.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name} (${s.location || 'সাইট'})</option>`).join('');
    const wOpts = AppState.workers.map(w => `<option value="${w.id}" data-name="${w.name}" data-rate="${w.daily_rate}" data-role="${w.role}">${w.name} - ${w.role} [৳${w.daily_rate || 0}/দিন]</option>`).join('');
    document.querySelectorAll(".select-site-options").forEach(el => {
      const cur = el.value, isF = el.classList.contains("filter-select");
      el.innerHTML = isF ? `<option value="all">🏢 সব বিল্ডিং / সাইট (${AppState.sites.length})</option>` + sOpts : (AppState.sites.length ? `<option value="" disabled ${!cur ? 'selected' : ''}>🏢 বিল্ডিং নির্বাচন করুন (${AppState.sites.length} টি উপলব্ধ)...</option>` + sOpts : '<option value="" disabled selected>⚠️ কোনো বিল্ডিং যুক্ত নেই (প্রথমে বিল্ডিং যোগ করুন)</option>');
      if (cur && el.querySelector(`option[value="${cur}"]`)) el.value = cur;
    });
    document.querySelectorAll(".select-worker-options").forEach(el => {
      const cur = el.value, isF = el.classList.contains("filter-select");
      el.innerHTML = isF ? `<option value="all">👥 সকল কারিগর / শ্রমিক (${AppState.workers.length})</option>` + wOpts : (AppState.workers.length ? `<option value="" disabled ${!cur ? 'selected' : ''}>👤 শ্রমিক নির্বাচন করুন (${AppState.workers.length} জন উপলব্ধ)...</option>` + wOpts : '<option value="" disabled selected>⚠️ কোনো কারিগর যুক্ত নেই (প্রথমে কারিগর যোগ করুন)</option>');
      if (cur && el.querySelector(`option[value="${cur}"]`)) el.value = cur;
    });
  },

  dashboard() {
    let wages = 0, adv = 0, sqft = 0, exp = 0;
    AppState.logs.forEach(l => { wages += +l.wage_amount || 0; adv += +l.advance_paid || 0; sqft += +l.work_sqft || 0; });
    AppState.expenses.forEach(e => { exp += +e.amount || 0; });
    document.getElementById("stat-total-expense").textContent = AppState.money(wages + exp);
    document.getElementById("stat-total-wages").textContent = AppState.money(wages);
    document.getElementById("stat-total-advance").textContent = AppState.money(adv);
    document.getElementById("stat-wage-balance").textContent = AppState.money(wages - adv);
    document.getElementById("stat-total-sqft").textContent = sqft.toLocaleString() + " SqFt";
    document.getElementById("stat-total-sites").textContent = AppState.sites.length;
    document.getElementById("stat-total-workers").textContent = AppState.workers.length;
    
    const rec = [...AppState.logs].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
    document.getElementById("dashboard-recent-logs").innerHTML = rec.length ? `<div class="table-responsive"><table class="custom-table"><thead><tr><th>তারিখ</th><th>শ্রমিক</th><th>বিল্ডিং</th><th>মজুরি</th><th>অগ্রিম</th><th>কাজ</th></tr></thead><tbody>${rec.map(l => { const w = AppState.workers.find(i => i.id === l.worker_id); return `<tr><td><strong>${l.date || '-'}</strong></td><td><div class="worker-row-info">${AppState.getAvatar(w, 'worker-avatar-sm')} <strong>${l.worker_name || 'কর্মী'}</strong></div></td><td><span class="badge-pill viewer">${l.site_name || 'সাধারণ সাইট'}</span></td><td class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</td><td class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</td><td>${l.work_sqft ? l.work_sqft + ' sqft' : (l.remarks || '-')}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state"><p>কোনো রেকর্ড পাওয়া যায়নি।</p></div>';
  },

  logs() {
    const list = AppState.filterLogs(), el = document.getElementById("worklogs-container");
    document.getElementById("worklogs-count").textContent = list.length + " টি রেকর্ড";
    if (!list.length) return el.innerHTML = '<div class="empty-state"><h4>কোনো রেকর্ড পাওয়া যায়নি</h4></div>';
    el.innerHTML = `<div class="table-responsive"><table class="custom-table"><thead><tr><th>তারিখ</th><th>বিল্ডিং</th><th>শ্রমিক</th><th>রোল</th><th>মজুরি</th><th>অগ্রিম</th><th>বকেয়া</th><th>কাজ</th><th>নোট</th><th class="admin-only" style="text-align:right">অ্যাকশন</th></tr></thead><tbody>${list.map(l => { const w = AppState.workers.find(i => i.id === l.worker_id), diff = (+l.wage_amount || 0) - (+l.advance_paid || 0); return `<tr><td><strong>${l.date || '-'}</strong></td><td><span class="badge-pill viewer">${l.site_name || 'সাধারণ সাইট'}</span></td><td><div class="worker-row-info">${AppState.getAvatar(w, 'worker-avatar-sm')} <strong>${l.worker_name || 'কর্মী'}</strong></div></td><td>${AppState.getRoleBadge(l.role)}</td><td class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</td><td class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</td><td class="${diff > 0 ? 'money-rose' : (diff < 0 ? 'money-amber' : '')}">${diff !== 0 ? AppState.money(diff) : '-'}</td><td>${l.work_sqft ? l.work_sqft + ' sqft' : '-'}</td><td style="color:#64748b;font-size:0.8rem">${l.remarks || '-'}</td><td class="admin-only" style="text-align:right"><button class="btn btn-secondary btn-icon btn-sm edit-log-btn" data-id="${l.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-outline-danger btn-icon btn-sm delete-log-btn" data-id="${l.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`; }).join('')}</tbody></table></div>`;
  },

  sites() {
    const el = document.getElementById("sites-grid-container");
    document.getElementById("sites-count").textContent = AppState.sites.length + " টি সাইট";
    el.innerHTML = AppState.sites.length ? AppState.sites.map(s => {
      const sLogs = AppState.logs.filter(l => l.site_id === s.id), sExp = AppState.expenses.filter(e => e.site_id === s.id);
      const labor = sLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), mat = sExp.reduce((acc, e) => acc + (+e.amount || 0), 0), sqft = sLogs.reduce((acc, l) => acc + (+l.work_sqft || 0), 0);
      return `<div class="entity-card"><div><div class="entity-card-header"><div><h4 class="entity-title">${s.name}</h4><div class="entity-subtitle"><i class="fa-solid fa-location-dot"></i> ${s.location || 'ঠিকানা নেই'}</div></div><span class="badge-pill admin">${s.status === 'completed' ? 'সম্পন্ন' : 'চলমান'}</span></div><div class="entity-stats"><div class="stat-item"><span>মোট খরচ</span><span class="money-green">${AppState.money(labor + mat)}</span></div><div class="stat-item"><span>মজুরি খরচ</span><span>${AppState.money(labor)}</span></div><div class="stat-item"><span>মালামাল খরচ</span><span>${AppState.money(mat)}</span></div><div class="stat-item"><span>টাইলস কাজ</span><span>${sqft} SqFt</span></div></div></div><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:0.75rem"><button class="btn btn-secondary btn-sm view-site-btn" data-id="${s.id}">বিস্তারিত দেখুন</button><div class="admin-only" style="display:flex;gap:0.35rem"><button class="btn btn-secondary btn-icon btn-sm edit-site-btn" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-outline-danger btn-icon btn-sm delete-site-btn" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button></div></div></div>`;
    }).join('') : '<div class="empty-state"><p>কোনো বিল্ডিং যোগ করা হয়নি।</p></div>';
  },

  workers() {
    const el = document.getElementById("workers-grid-container");
    document.getElementById("workers-count").textContent = AppState.workers.length + " জন কর্মী";
    el.innerHTML = AppState.workers.length ? AppState.workers.map(w => {
      const wLogs = AppState.logs.filter(l => l.worker_id === w.id);
      const earned = wLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), adv = wLogs.reduce((acc, l) => acc + (+l.advance_paid || 0), 0);
      return `<div class="entity-card"><div><div class="entity-card-header"><div class="worker-row-info">${AppState.getAvatar(w)}<div><h4 class="entity-title">${w.name}</h4><div class="entity-subtitle"><i class="fa-solid fa-phone"></i> ${w.phone || '-'} | <i class="fa-solid fa-location-dot"></i> ${w.location || 'ঠিকানা নেই'}</div></div></div>${AppState.getRoleBadge(w.role)}</div><div class="entity-stats"><div class="stat-item"><span>মোট আয়</span><span class="money-green">${AppState.money(earned)}</span></div><div class="stat-item"><span>অগ্রিম গ্রহণ</span><span class="money-amber">${AppState.money(adv)}</span></div><div class="stat-item"><span>অবশিষ্ট পাওনা</span><span class="${earned - adv > 0 ? 'money-rose' : 'money-green'}">${AppState.money(earned - adv)}</span></div><div class="stat-item"><span>কাজের দিন</span><span>${wLogs.length} দিন</span></div></div></div><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:0.75rem"><button class="btn btn-primary btn-sm view-worker-profile-btn" data-id="${w.id}"><i class="fa-solid fa-user"></i> প্রোফাইল ভিউ</button><div class="admin-only" style="display:flex;gap:0.35rem"><button class="btn btn-secondary btn-icon btn-sm edit-worker-btn" data-id="${w.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-outline-danger btn-icon btn-sm delete-worker-btn" data-id="${w.id}"><i class="fa-solid fa-trash"></i></button></div></div></div>`;
    }).join('') : '<div class="empty-state"><p>কোনো শ্রমিক যোগ করা হয়নি।</p></div>';
  },

  workerProfile(w) {
    if (!w) return;
    const wLogs = AppState.logs.filter(l => l.worker_id === w.id);
    const earned = wLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), adv = wLogs.reduce((acc, l) => acc + (+l.advance_paid || 0), 0), sqft = wLogs.reduce((acc, l) => acc + (+l.work_sqft || 0), 0);
    document.getElementById("prof-avatar-wrap").innerHTML = AppState.getAvatar(w, "worker-avatar-lg");
    document.getElementById("prof-name").textContent = w.name;
    document.getElementById("prof-role").innerHTML = AppState.getRoleBadge(w.role);
    document.getElementById("prof-phone").textContent = w.phone || "মোবাইল নেই";
    document.getElementById("prof-location").textContent = w.location || "ঠিকানা নেই";
    document.getElementById("prof-rate").textContent = (w.daily_rate ? AppState.money(w.daily_rate) + " / দিন" : "রেট নির্ধারণ নেই");
    document.getElementById("prof-earned").textContent = AppState.money(earned);
    document.getElementById("prof-advance").textContent = AppState.money(adv);
    document.getElementById("prof-balance").textContent = AppState.money(earned - adv);
    document.getElementById("prof-days").textContent = wLogs.length + " দিন";
    document.getElementById("prof-sqft").textContent = sqft + " SqFt";
    document.getElementById("prof-history-table").innerHTML = wLogs.length ? wLogs.map(l => `<tr><td><strong>${l.date || '-'}</strong></td><td><span class="badge-pill viewer">${l.site_name || 'সাধারণ সাইট'}</span></td><td class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</td><td class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</td><td>${l.work_sqft ? l.work_sqft + ' sqft' : (l.remarks || '-')}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center">কোনো ইতিহাস নেই।</td></tr>';
  },

  expenses() {
    const list = AppState.filterExpenses(), el = document.getElementById("expenses-container");
    document.getElementById("expenses-count").textContent = list.length + " টি খরচ";
    if (!list.length) return el.innerHTML = '<div class="empty-state"><p>কোনো খরচ পাওয়া যায়নি।</p></div>';
    el.innerHTML = `<div class="table-responsive"><table class="custom-table"><thead><tr><th>তারিখ</th><th>বিল্ডিং</th><th>খাত</th><th>পরিমাণ</th><th>বিবরণ</th><th class="admin-only" style="text-align:right">অ্যাকশন</th></tr></thead><tbody>${list.map(e => `<tr><td><strong>${e.date || '-'}</strong></td><td><span class="badge-pill viewer">${e.site_name || 'সাধারণ সাইট'}</span></td><td><span class="tag-badge tag-cutter">${e.category}</span></td><td class="money-rose">${AppState.money(e.amount)}</td><td style="color:#64748b">${e.note || '-'}</td><td class="admin-only" style="text-align:right"><button class="btn btn-secondary btn-icon btn-sm edit-expense-btn" data-id="${e.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-outline-danger btn-icon btn-sm delete-expense-btn" data-id="${e.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`;
  },

  settings() {
    const cfg = DB.getConfig();
    ["api-key", "auth-domain", "project-id", "storage-bucket", "sender-id", "app-id"].forEach(k => {
      const el = document.getElementById("cfg-" + k);
      if (el) el.value = cfg[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || cfg[k.replace("-", "")] || "";
    });
  },

  all() { this.updateAdmin(); this.dropdowns(); this.dashboard(); this.logs(); this.sites(); this.workers(); this.expenses(); this.settings(); }
};
window.Render = Render;
