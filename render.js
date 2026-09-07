// UI Rendering Engine with Worker Profile Support & Responsive Mobile Cards
const Render = {
  updateAdmin() {
    const p = document.getElementById("admin-status-pill"), b = document.getElementById("btn-admin-toggle");
    document.body.classList.toggle("is-admin", AppState.isAdmin);
    if (p) { 
      p.className = AppState.isAdmin ? "badge-pill admin" : "badge-pill viewer"; 
      p.innerHTML = AppState.isAdmin ? '<i class="fa-solid fa-lock-open"></i> অ্যাডমিন মোড' : '<i class="fa-solid fa-eye"></i> ভিউয়ার মোড'; 
    }
    if (b) b.innerHTML = AppState.isAdmin ? '<i class="fa-solid fa-lock"></i> <span>লক</span>' : '<i class="fa-solid fa-key"></i> <span>আনলক</span>';
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
    
    const rec = [...AppState.logs].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
    document.getElementById("dashboard-recent-logs").innerHTML = rec.length ? `<div class="table-responsive"><table class="custom-table table-worklogs"><thead><tr><th>তারিখ</th><th>শ্রমিক</th><th>বিল্ডিং / স্ট্যাটাস</th><th>মজুরি</th><th>জমা</th><th>কাজ</th></tr></thead><tbody>${rec.map(l => { 
      const w = AppState.workers.find(i => i.id === l.worker_id); 
      const isWork = Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)");
      const siteBadge = isWork ? `<span class="badge-pill work-day"><i class="fa-solid fa-city"></i> ${l.site_name}</span>` : `<span class="badge-pill no-work"><i class="fa-solid fa-hand-holding-dollar"></i> কাজ নেই (শুধু জমা)</span>`;
      return `<tr class="log-card-row ${isWork ? '' : 'row-payment-only'}">
        <td data-label="তারিখ" class="td-cell td-date"><span class="card-date-badge"><i class="fa-regular fa-calendar"></i> ${l.date || '-'}</span></td>
        <td data-label="শ্রমিক" class="td-cell td-worker"><div class="worker-row-info">${AppState.getAvatar(w, 'worker-avatar-sm')} <div><strong class="worker-name">${l.worker_name || 'কর্মী'}</strong> <div class="worker-sub-role">${AppState.getRoleBadge(l.role)}</div></div></div></td>
        <td data-label="বিল্ডিং / স্ট্যাটাস" class="td-cell td-site">${siteBadge}</td>
        <td data-label="মজুরি" class="td-cell td-wage"><span class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</span></td>
        <td data-label="জমা" class="td-cell td-advance"><span class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</span></td>
        <td data-label="কাজ" class="td-cell td-work"><span class="work-sqft-val">${l.work_sqft ? l.work_sqft + ' sqft' : (l.remarks || (isWork ? '-' : 'জমা / পেমেন্ট'))}</span></td>
      </tr>`; 
    }).join('')}</tbody></table></div>` : '<div class="empty-state"><p><i class="fa-solid fa-clipboard-list" style="font-size:2rem;margin-bottom:0.5rem;opacity:0.4;"></i><br>কোনো সাম্প্রতিক এন্ট্রি পাওয়া যায়নি।</p></div>';
  },

  logs() {
    const list = AppState.filterLogs(), el = document.getElementById("worklogs-container");
    const balanceMap = AppState.getRunningBalances();
    document.getElementById("worklogs-count").textContent = list.length + " টি রেকর্ড";
    
    // Update view mode button states in header
    document.getElementById("btn-view-card")?.classList.toggle("active", AppState.viewMode === "card");
    document.getElementById("btn-view-table")?.classList.toggle("active", AppState.viewMode === "table");

    if (!list.length) {
      return el.innerHTML = `
        <div class="empty-state">
          <h4><i class="fa-solid fa-file-circle-question" style="font-size:2.4rem;margin-bottom:0.75rem;opacity:0.35;color:var(--primary);"></i><br>কোনো রেকর্ড পাওয়া যায়নি</h4>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.35rem">ফিল্টার পরিবর্তন করুন অথবা নতুন দৈনিক হাজিরা এন্ট্রি যোগ করুন।</p>
        </div>`;
    }

    // Group logs by Date
    const groups = {};
    list.forEach(l => {
      const d = l.date || "অনির্দিষ্ট তারিখ";
      if (!groups[d]) groups[d] = [];
      groups[d].push(l);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    // If no date is currently selected/expanded, auto-expand only the latest date
    if (!AppState.expandedDate && sortedDates.length > 0) {
      AppState.expandedDate = sortedDates[0];
    } else if (AppState.expandedDate && !sortedDates.includes(AppState.expandedDate)) {
      AppState.expandedDate = sortedDates[0] || null;
    }

    el.innerHTML = sortedDates.map(date => {
      const dayLogs = groups[date];
      const isExpanded = AppState.expandedDate === date;
      const dayWages = dayLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0);
      const dayAdvance = dayLogs.reduce((acc, l) => acc + (+l.advance_paid || 0), 0);
      const daySqft = dayLogs.reduce((acc, l) => acc + (+l.work_sqft || 0), 0);
      const dayBalance = dayWages - dayAdvance;

      let contentHtml = '';

      if (AppState.viewMode === "card") {
        // CARD VIEW MODE
        contentHtml = `
          <div class="log-cards-grid">
            ${dayLogs.map(l => {
              const w = AppState.workers.find(i => i.id === l.worker_id);
              const cumDue = balanceMap.has(l.id) ? balanceMap.get(l.id) : ((+l.wage_amount || 0) - (+l.advance_paid || 0));
              const isWork = Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)");
              const wage = +l.wage_amount || 0;
              const advance = +l.advance_paid || 0;

              let cardTypeClass = "card-work-and-payment";
              let siteBadge = "";
              let statusStrip = "";

              if (!isWork || (wage === 0 && advance > 0)) {
                // 1. শুধু জমা / পেমেন্ট নিয়েছে (Payment Only - No Work)
                cardTypeClass = "card-payment-only";
                siteBadge = `<span class="badge-pill no-work"><i class="fa-solid fa-hand-holding-dollar"></i> শুধু জমা</span>`;
                statusStrip = `<div class="card-status-strip strip-payment"><i class="fa-solid fa-hand-holding-dollar"></i> <span><strong>শুধু জমা / পেমেন্ট:</strong> কোনো কাজ নেই</span></div>`;
              } else if (wage > 0 && advance === 0) {
                // 2. শুধু কাজ করেছে কিন্তু বিল নেয়নি (Work Done - No Advance)
                cardTypeClass = "card-work-only";
                siteBadge = `<span class="badge-pill work-day" title="${l.site_name}"><i class="fa-solid fa-city"></i> ${l.site_name}</span><span class="badge-pill unpaid-work"><i class="fa-solid fa-circle-check"></i> পাওনা</span>`;
                statusStrip = `<div class="card-status-strip strip-work"><i class="fa-solid fa-briefcase"></i> <span><strong>কাজের দিন:</strong> কোনো টাকা জমা নেওয়া হয়নি</span></div>`;
              } else {
                // 3. স্বাভাবিক (কাজ ও জমা দুটোই আছে)
                cardTypeClass = "card-work-and-payment";
                siteBadge = `<span class="badge-pill work-day" title="${l.site_name}"><i class="fa-solid fa-city"></i> ${l.site_name}</span>`;
              }

              const dueDisplay = cumDue > 0 ? `<span class="money-rose font-bold">${AppState.money(cumDue)}</span>` : (cumDue < 0 ? `<span class="money-amber font-bold">${AppState.money(Math.abs(cumDue))} (জমা বেশি)</span>` : `<span style="color:#64748b;font-weight:600">৳০</span>`);

              return `
                <div class="log-worker-card ${cardTypeClass}">
                  <div class="card-worker-header">
                    <div class="worker-row-info">
                      ${AppState.getAvatar(w, 'worker-avatar-sm')}
                      <div>
                        <strong class="worker-name">${l.worker_name || 'কর্মী'}</strong>
                        <div class="worker-sub-role">${AppState.getRoleBadge(l.role)}</div>
                      </div>
                    </div>
                    <div class="card-site-wrap">${siteBadge}</div>
                  </div>

                  ${statusStrip}

                  <div class="card-metrics-grid">
                    <div class="metric-cell">
                      <span class="metric-label">মজুরি</span>
                      <span class="metric-val money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</span>
                    </div>
                    <div class="metric-cell">
                      <span class="metric-label">জমা</span>
                      <span class="metric-val money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</span>
                    </div>
                    <div class="metric-cell">
                      <span class="metric-label">মোট বকেয়া</span>
                      <span class="metric-val">${dueDisplay}</span>
                    </div>
                    <div class="metric-cell">
                      <span class="metric-label">কাজ (SqFt)</span>
                      <span class="metric-val">${l.work_sqft ? l.work_sqft + ' sqft' : '-'}</span>
                    </div>
                  </div>

                  ${l.remarks ? `
                    <div class="card-note-box">
                      <i class="fa-regular fa-note-sticky"></i>
                      <span>${l.remarks}</span>
                    </div>
                  ` : ''}

                  <div class="card-footer-actions admin-only">
                    <button class="btn btn-secondary btn-icon btn-sm edit-log-btn" data-id="${l.id}" title="সম্পাদনা"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-outline-danger btn-icon btn-sm delete-log-btn" data-id="${l.id}" title="মুছুন"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // TABLE VIEW MODE
        contentHtml = `
          <div class="table-responsive">
            <table class="custom-table table-view-dense">
              <thead>
                <tr>
                  <th>শ্রমিক</th>
                  <th>বিল্ডিং / অবস্থা</th>
                  <th>পদবি</th>
                  <th>মজুরি</th>
                  <th>জমা</th>
                  <th>মোট বকেয়া</th>
                  <th>কাজ</th>
                  <th>মন্তব্য</th>
                  <th class="admin-only" style="text-align:right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                ${dayLogs.map(l => {
                  const w = AppState.workers.find(i => i.id === l.worker_id);
                  const cumDue = balanceMap.has(l.id) ? balanceMap.get(l.id) : ((+l.wage_amount || 0) - (+l.advance_paid || 0));
                  const isWork = Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)");
                  const wage = +l.wage_amount || 0;
                  const advance = +l.advance_paid || 0;

                  let rowTypeClass = "row-work-and-payment";
                  let siteBadge = "";

                  if (!isWork || (wage === 0 && advance > 0)) {
                    rowTypeClass = "row-payment-only";
                    siteBadge = `<span class="badge-pill no-work"><i class="fa-solid fa-hand-holding-dollar"></i> শুধু জমা</span>`;
                  } else if (wage > 0 && advance === 0) {
                    rowTypeClass = "row-work-only";
                    siteBadge = `<span class="badge-pill work-day"><i class="fa-solid fa-city"></i> ${l.site_name}</span> <span class="badge-pill unpaid-work"><i class="fa-solid fa-circle-check"></i> পাওনা</span>`;
                  } else {
                    rowTypeClass = "row-work-and-payment";
                    siteBadge = `<span class="badge-pill work-day"><i class="fa-solid fa-city"></i> ${l.site_name}</span>`;
                  }

                  const dueDisplay = cumDue > 0 ? `<span class="money-rose font-bold">${AppState.money(cumDue)}</span>` : (cumDue < 0 ? `<span class="money-amber font-bold">${AppState.money(Math.abs(cumDue))} (জমা বেশি)</span>` : `<span style="color:#64748b;font-weight:600">৳০</span>`);

                  return `
                    <tr class="log-card-row ${rowTypeClass}">
                      <td data-label="শ্রমিক" class="td-cell td-worker"><div class="worker-row-info">${AppState.getAvatar(w, 'worker-avatar-sm')} <div><strong class="worker-name">${l.worker_name || 'কর্মী'}</strong></div></div></td>
                      <td data-label="বিল্ডিং / অবস্থা" class="td-cell td-site">${siteBadge}</td>
                      <td data-label="পদবি" class="td-cell td-role">${AppState.getRoleBadge(l.role)}</td>
                      <td data-label="মজুরি" class="td-cell td-wage"><span class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</span></td>
                      <td data-label="জমা" class="td-cell td-advance"><span class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</span></td>
                      <td data-label="মোট বকেয়া" class="td-cell td-due">${dueDisplay}</td>
                      <td data-label="কাজ" class="td-cell td-work"><span class="work-sqft-val">${l.work_sqft ? l.work_sqft + ' sqft' : '-'}</span></td>
                      <td data-label="নোট" class="td-cell td-note"><span class="note-text">${l.remarks || (isWork ? '-' : 'কাজ ছাড়া শুধু জমা')}</span></td>
                      <td data-label="অ্যাকশন" class="td-cell td-actions admin-only" style="text-align:right">
                        <div class="card-action-btns">
                          <button class="btn btn-secondary btn-icon btn-sm edit-log-btn" data-id="${l.id}" title="সম্পাদনা"><i class="fa-solid fa-pen"></i></button>
                          <button class="btn btn-outline-danger btn-icon btn-sm delete-log-btn" data-id="${l.id}" title="মুছুন"><i class="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      return `
        <div class="date-group-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}" data-date="${date}">
          <!-- Accordion Header Bar -->
          <div class="date-group-header" data-date="${date}" title="ক্লিক করে এই তারিখ খুলুন বা বন্ধ করুন">
            <div class="date-header-left">
              <i class="fa-solid fa-chevron-down accordion-arrow ${isExpanded ? 'open' : ''}"></i>
              <span class="date-badge-main"><i class="fa-regular fa-calendar-days"></i> ${date}</span>
              <span class="badge-pill viewer count-pill">${dayLogs.length} জন কর্মী</span>
            </div>

            <div class="date-header-stats">
              <div class="day-stat-chip green" title="দিনের মোট অর্জিত মজুরি">
                <small>মজুরি:</small> <strong>${AppState.money(dayWages)}</strong>
              </div>
              <div class="day-stat-chip amber" title="দিনের মোট জমা প্রদান">
                <small>জমা:</small> <strong>${AppState.money(dayAdvance)}</strong>
              </div>
              <div class="day-stat-chip ${dayBalance > 0 ? 'rose' : 'subtle'}" title="দিনের অবশিষ্ট বকেয়া">
                <small>বকেয়া:</small> <strong>${AppState.money(dayBalance)}</strong>
              </div>
              ${daySqft ? `
                <div class="day-stat-chip blue" title="দিনের মোট টাইলস কাজ">
                  <small>কাজ:</small> <strong>${daySqft} SqFt</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Smooth Collapsible Accordion Wrapper -->
          <div class="date-group-body-wrapper">
            <div class="date-group-body-inner">
              <div class="date-group-body">
                ${contentHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  sites() {
    const el = document.getElementById("sites-grid-container");
    document.getElementById("sites-count").textContent = AppState.sites.length + " টি সাইট";
    el.innerHTML = AppState.sites.length ? AppState.sites.map(s => {
      const sLogs = AppState.logs.filter(l => l.site_id === s.id), sExp = AppState.expenses.filter(e => e.site_id === s.id);
      const labor = sLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), mat = sExp.reduce((acc, e) => acc + (+e.amount || 0), 0), sqft = sLogs.reduce((acc, l) => acc + (+l.work_sqft || 0), 0);
      return `<div class="entity-card"><div><div class="entity-card-header"><div><h4 class="entity-title">${s.name}</h4><div class="entity-subtitle"><i class="fa-solid fa-location-dot"></i> ${s.location || 'ঠিকানা নেই'}</div></div><span class="badge-pill admin">${s.status === 'completed' ? 'সম্পন্ন' : 'চলমান'}</span></div><div class="entity-stats"><div class="stat-item"><span>মোট খরচ</span><span class="money-green">${AppState.money(labor + mat)}</span></div><div class="stat-item"><span>মজুরি খরচ</span><span>${AppState.money(labor)}</span></div><div class="stat-item"><span>মালামাল খরচ</span><span>${AppState.money(mat)}</span></div><div class="stat-item"><span>টাইলস কাজ</span><span>${sqft} SqFt</span></div></div></div><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:0.75rem"><button class="btn btn-secondary btn-sm view-site-btn" data-id="${s.id}"><i class="fa-solid fa-eye"></i> বিস্তারিত দেখুন</button><div class="admin-only" style="display:flex;gap:0.35rem"><button class="btn btn-secondary btn-icon btn-sm edit-site-btn" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-outline-danger btn-icon btn-sm delete-site-btn" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button></div></div></div>`;
    }).join('') : '<div class="empty-state"><p><i class="fa-solid fa-city" style="font-size:2rem;margin-bottom:0.5rem;opacity:0.4;"></i><br>কোনো বিল্ডিং যোগ করা হয়নি।</p></div>';
  },

  workers() {
    const el = document.getElementById("workers-grid-container");
    document.getElementById("workers-count").textContent = AppState.workers.length + " জন কর্মী";
    el.innerHTML = AppState.workers.length ? AppState.workers.map(w => {
      const wLogs = AppState.logs.filter(l => l.worker_id === w.id);
      const earned = wLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), adv = wLogs.reduce((acc, l) => acc + (+l.advance_paid || 0), 0);
      const workDays = wLogs.filter(l => Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)") || +l.wage_amount > 0).length;
      return `<div class="entity-card"><div><div class="entity-card-header"><div class="worker-row-info">${AppState.getAvatar(w)}<div><h4 class="entity-title">${w.name}</h4><div class="entity-subtitle"><i class="fa-solid fa-phone"></i> ${w.phone || '-'} | <i class="fa-solid fa-location-dot"></i> ${w.location || 'ঠিকানা নেই'}</div></div></div>${AppState.getRoleBadge(w.role)}</div><div class="entity-stats"><div class="stat-item"><span>মোট আয়</span><span class="money-green">${AppState.money(earned)}</span></div><div class="stat-item"><span>মোট জমা</span><span class="money-amber">${AppState.money(adv)}</span></div><div class="stat-item"><span>অবশিষ্ট পাওনা</span><span class="${earned - adv > 0 ? 'money-rose' : 'money-green'}">${AppState.money(earned - adv)}</span></div><div class="stat-item"><span>কাজের দিন</span><span>${workDays} দিন</span></div></div></div><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:0.75rem"><button class="btn btn-primary btn-sm view-worker-profile-btn" data-id="${w.id}"><i class="fa-solid fa-user"></i> প্রোফাইল ভিউ</button><div class="admin-only" style="display:flex;gap:0.35rem"><button class="btn btn-secondary btn-icon btn-sm edit-worker-btn" data-id="${w.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-outline-danger btn-icon btn-sm delete-worker-btn" data-id="${w.id}"><i class="fa-solid fa-trash"></i></button></div></div></div>`;
    }).join('') : '<div class="empty-state"><p><i class="fa-solid fa-users" style="font-size:2rem;margin-bottom:0.5rem;opacity:0.4;"></i><br>কোনো শ্রমিক যোগ করা হয়নি।</p></div>';
  },

  workerProfile(w) {
    if (!w) return;
    const balanceMap = AppState.getRunningBalances();
    const wLogs = AppState.logs.filter(l => l.worker_id === w.id);
    const earned = wLogs.reduce((acc, l) => acc + (+l.wage_amount || 0), 0), adv = wLogs.reduce((acc, l) => acc + (+l.advance_paid || 0), 0), sqft = wLogs.reduce((acc, l) => acc + (+l.work_sqft || 0), 0);
    const workDays = wLogs.filter(l => Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)") || +l.wage_amount > 0).length;
    document.getElementById("prof-avatar-wrap").innerHTML = AppState.getAvatar(w, "worker-avatar-lg");
    document.getElementById("prof-name").textContent = w.name;
    document.getElementById("prof-role").innerHTML = AppState.getRoleBadge(w.role);
    document.getElementById("prof-phone").textContent = w.phone || "মোবাইল নেই";
    document.getElementById("prof-location").textContent = w.location || "ঠিকানা নেই";
    document.getElementById("prof-rate").textContent = (w.daily_rate ? AppState.money(w.daily_rate) + " / দিন" : "রেট নির্ধারণ নেই");
    document.getElementById("prof-earned").textContent = AppState.money(earned);
    document.getElementById("prof-advance").textContent = AppState.money(adv);
    document.getElementById("prof-balance").textContent = AppState.money(earned - adv);
    document.getElementById("prof-days").textContent = workDays + " দিন";
    document.getElementById("prof-sqft").textContent = sqft + " SqFt";
    document.getElementById("prof-history-table").innerHTML = wLogs.length ? wLogs.map(l => {
      const cumDue = balanceMap.has(l.id) ? balanceMap.get(l.id) : ((+l.wage_amount || 0) - (+l.advance_paid || 0));
      const isWork = Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)");
      const siteBadge = isWork ? `<span class="badge-pill work-day"><i class="fa-solid fa-city"></i> ${l.site_name}</span>` : `<span class="badge-pill no-work"><i class="fa-solid fa-hand-holding-dollar"></i> কাজ নেই (শুধু জমা)</span>`;
      const dueDisplay = cumDue > 0 ? `<span class="money-rose font-bold">${AppState.money(cumDue)}</span>` : (cumDue < 0 ? `<span class="money-amber font-bold">${AppState.money(Math.abs(cumDue))} (অতিরিক্ত জমা)</span>` : `<span style="color:#64748b">৳০</span>`);
      return `<tr class="log-card-row ${isWork ? '' : 'row-payment-only'}">
        <td data-label="তারিখ" class="td-cell td-date"><span class="card-date-badge"><i class="fa-regular fa-calendar-days"></i> ${l.date || '-'}</span></td>
        <td data-label="বিল্ডিং / অবস্থা" class="td-cell td-site">${siteBadge}</td>
        <td data-label="মজুরি" class="td-cell td-wage"><span class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</span></td>
        <td data-label="জমা" class="td-cell td-advance"><span class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</span></td>
        <td data-label="মোট বকেয়া" class="td-cell td-due">${dueDisplay}</td>
        <td data-label="কাজ" class="td-cell td-work"><span class="work-sqft-val">${l.work_sqft ? l.work_sqft + ' sqft' : (l.remarks || (isWork ? '-' : 'কাজ ছাড়া শুধু জমা'))}</span></td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--text-muted);">কোনো ইতিহাস নেই।</td></tr>';
  },

  expenses() {
    const list = AppState.filterExpenses(), el = document.getElementById("expenses-container");
    document.getElementById("expenses-count").textContent = list.length + " টি খরচ";
    if (!list.length) return el.innerHTML = '<div class="empty-state"><p><i class="fa-solid fa-receipt" style="font-size:2rem;margin-bottom:0.5rem;opacity:0.4;"></i><br>কোনো খরচ পাওয়া যায়নি।</p></div>';
    el.innerHTML = `<div class="table-responsive"><table class="custom-table table-expenses"><thead><tr><th>তারিখ</th><th>বিল্ডিং</th><th>খাত</th><th>পরিমাণ</th><th>বিবরণ</th><th class="admin-only" style="text-align:right">অ্যাকশন</th></tr></thead><tbody>${list.map(e => `
      <tr class="log-card-row">
        <td data-label="তারিখ" class="td-cell td-date"><span class="card-date-badge"><i class="fa-regular fa-calendar-days"></i> ${e.date || '-'}</span></td>
        <td data-label="বিল্ডিং" class="td-cell td-site"><span class="badge-pill viewer"><i class="fa-solid fa-city"></i> ${e.site_name || 'সাধারণ সাইট'}</span></td>
        <td data-label="খাত" class="td-cell td-role"><span class="tag-badge tag-cutter">${e.category}</span></td>
        <td data-label="পরিমাণ" class="td-cell td-wage"><span class="money-rose font-bold">${AppState.money(e.amount)}</span></td>
        <td data-label="বিবরণ" class="td-cell td-note"><span class="note-text" style="color:#64748b">${e.note || '-'}</span></td>
        <td data-label="অ্যাকশন" class="td-cell td-actions admin-only" style="text-align:right">
          <div class="card-action-btns">
            <button class="btn btn-secondary btn-icon btn-sm edit-expense-btn" data-id="${e.id}" title="সম্পাদনা"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-outline-danger btn-icon btn-sm delete-expense-btn" data-id="${e.id}" title="মুছুন"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join('')}</tbody></table></div>`;
  },

  reports() {
    const list = AppState.filterLogs(), el = document.getElementById("report-table-view");
    if (!el) return;
    const balanceMap = AppState.getRunningBalances();
    const wages = list.reduce((a, b) => a + (+b.wage_amount || 0), 0);
    const advance = list.reduce((a, b) => a + (+b.advance_paid || 0), 0);
    const sqft = list.reduce((a, b) => a + (+b.work_sqft || 0), 0);
    const netDue = wages - advance;
    
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:1.25rem;">
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.75rem;">
          <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">ফিল্টারকৃত রেকর্ড</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--primary);">${list.length} টি</div>
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.75rem;">
          <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">মোট মজুরি</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--success);">${AppState.money(wages)}</div>
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.75rem;">
          <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">মোট জমা</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--warning);">${AppState.money(advance)}</div>
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.75rem;">
          <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">অবশিষ্ট বকেয়া</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--danger);">${AppState.money(netDue)}</div>
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.75rem;">
          <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;">টাইলস কাজ</div>
          <div style="font-size:1.2rem;font-weight:800;">${sqft} SqFt</div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="custom-table table-worklogs">
          <thead>
            <tr>
              <th>তারিখ</th>
              <th>বিল্ডিং / অবস্থা</th>
              <th>শ্রমিক</th>
              <th>পদবি</th>
              <th>মজুরি</th>
              <th>জমা</th>
              <th>মোট বকেয়া</th>
              <th>কাজ</th>
              <th>মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            ${list.length ? list.map(l => {
              const cumDue = balanceMap.has(l.id) ? balanceMap.get(l.id) : ((+l.wage_amount || 0) - (+l.advance_paid || 0));
              const isWork = Boolean(l.site_id && l.site_name && l.site_name !== "কোনো সাইট নেই (শুধু পেমেন্ট)");
              const dueDisplay = cumDue > 0 ? `<span class="money-rose font-bold">${AppState.money(cumDue)}</span>` : (cumDue < 0 ? `<span class="money-amber font-bold">${AppState.money(Math.abs(cumDue))} (অতিরিক্ত জমা)</span>` : `<span style="color:#64748b">৳০</span>`);
              return `<tr class="log-card-row ${isWork ? '' : 'row-payment-only'}">
                <td data-label="তারিখ" class="td-cell td-date"><span class="card-date-badge"><i class="fa-regular fa-calendar-days"></i> ${l.date || '-'}</span></td>
                <td data-label="বিল্ডিং / অবস্থা" class="td-cell td-site"><span class="badge-pill ${isWork ? 'work-day' : 'no-work'}">${isWork ? l.site_name : 'কাজ নেই'}</span></td>
                <td data-label="শ্রমিক" class="td-cell td-worker"><strong class="worker-name">${l.worker_name || 'কর্মী'}</strong></td>
                <td data-label="পদবি" class="td-cell td-role">${AppState.getRoleBadge(l.role)}</td>
                <td data-label="মজুরি" class="td-cell td-wage"><span class="money-green">${+l.wage_amount ? AppState.money(l.wage_amount) : '-'}</span></td>
                <td data-label="জমা" class="td-cell td-advance"><span class="money-amber">${+l.advance_paid ? AppState.money(l.advance_paid) : '-'}</span></td>
                <td data-label="মোট বকেয়া" class="td-cell td-due">${dueDisplay}</td>
                <td data-label="কাজ" class="td-cell td-work"><span class="work-sqft-val">${l.work_sqft ? l.work_sqft + ' sqft' : '-'}</span></td>
                <td data-label="মন্তব্য" class="td-cell td-note"><span class="note-text">${l.remarks || '-'}</span></td>
              </tr>`;
            }).join('') : '<tr><td colspan="9" style="text-align:center;padding:1.5rem;color:var(--text-muted)">কোনো রেকর্ড পাওয়া যায়নি</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  settings() {
    const cfg = DB.getConfig();
    const map = {
      "api-key": cfg.apiKey,
      "auth-domain": cfg.authDomain,
      "project-id": cfg.projectId,
      "storage-bucket": cfg.storageBucket,
      "sender-id": cfg.messagingSenderId || cfg.senderId,
      "app-id": cfg.appId
    };
    Object.keys(map).forEach(k => {
      const el = document.getElementById("cfg-" + k);
      if (el) el.value = map[k] || "";
    });
  },

  all() { 
    this.updateAdmin(); 
    this.dropdowns(); 
    this.dashboard(); 
    this.logs(); 
    this.sites(); 
    this.workers(); 
    this.expenses(); 
    this.reports();
    this.settings(); 
  }
};
window.Render = Render;
