// Application State, Avatar Generator & Security Store
const DEFAULT_PASS = "M~R.88@Mizhan.25";

// HTML Sanitizer Utility to prevent XSS / UI injection attacks
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHTML = escapeHTML;

// Safe URL validator for avatars (prevents javascript: and vbscript: URIs)
function safeAvatarUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return encodeURI(trimmed);
  }
  return "";
}

// Convert Bengali numerals to English numerals for search & parsing
function bnToEnDigits(str) {
  if (!str) return "";
  const map = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return String(str).replace(/[০-৯]/g, d => map[d] || d);
}
window.bnToEnDigits = bnToEnDigits;

const AppState = {
  sites: [], workers: [], logs: [], expenses: [],
  isAdmin: localStorage.getItem("twt_admin") === "true",
  adminPass: localStorage.getItem("twt_pass") || DEFAULT_PASS,
  activeTab: "dashboard",
  viewMode: localStorage.getItem("twt_view_mode") || "card",
  expandedDate: null,
  filters: { siteId: "all", workerId: "all", role: "all", startDate: "", endDate: "", q: "" },

  setViewMode(mode) {
    this.viewMode = mode === "table" ? "table" : "card";
    localStorage.setItem("twt_view_mode", this.viewMode);
    document.getElementById("btn-view-card")?.classList.toggle("active", this.viewMode === "card");
    document.getElementById("btn-view-table")?.classList.toggle("active", this.viewMode === "table");
    if (window.Render) window.Render.logs();
  },

  toggleDate(date) {
    if (this.expandedDate === date) {
      this.expandedDate = null;
    } else {
      this.expandedDate = date;
    }
    if (window.Render) window.Render.logs();
  },

  setAdmin(status) {
    this.isAdmin = !!status;
    localStorage.setItem("twt_admin", this.isAdmin ? "true" : "false");
    document.body.classList.toggle("is-admin", this.isAdmin);
    if (window.Render) window.Render.updateAdmin();
  },

  verifyPassword(p) {
    const input = String(p || "").trim();
    return input === String(this.adminPass).trim();
  },

  updatePassword(p) {
    this.adminPass = String(p).trim();
    localStorage.setItem("twt_pass", this.adminPass);
  },

  getAvatar(w, cls = "") {
    const safeUrl = safeAvatarUrl(w && w.avatar_url);
    const safeName = escapeHTML(w && w.name ? w.name : "Worker");
    const initial = w && w.name ? escapeHTML(w.name.trim().charAt(0)) : '<i class="fa-solid fa-user"></i>';

    if (safeUrl) {
      return `<img src="${safeUrl}" class="worker-avatar ${cls}" alt="${safeName}" onerror="this.outerHTML='<div class=\\'worker-avatar ${cls}\\'>${initial}</div>'">`;
    }
    return `<div class="worker-avatar ${cls}">${initial}</div>`;
  },

  getRoleBadge(role) {
    const r = role || "মেস্তুরি";
    const safeR = escapeHTML(r);
    if (r.includes("কাটার")) return `<span class="tag-badge tag-cutter"><i class="fa-solid fa-scissors"></i> ${safeR}</span>`;
    if (r.includes("হেল্পার")) return `<span class="tag-badge tag-helper"><i class="fa-solid fa-hands-holding"></i> ${safeR}</span>`;
    if (r.includes("লেবার")) return `<span class="tag-badge tag-labor"><i class="fa-solid fa-person-digging"></i> ${safeR}</span>`;
    return `<span class="tag-badge tag-mistri"><i class="fa-solid fa-trowel"></i> ${safeR}</span>`;
  },

  parseDateToTime(dStr) {
    if (!dStr) return 0;
    if (typeof dStr === "number") return dStr;
    if (dStr instanceof Date) return dStr.getTime();
    const s = bnToEnDigits(String(dStr).trim());
    // YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]).getTime();
    }
    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      return new Date(+dmyMatch[3], +dmyMatch[2] - 1, +dmyMatch[1]).getTime();
    }
    const parsed = Date.parse(s);
    return isNaN(parsed) ? 0 : parsed;
  },

  getWorkerCanonicalKey(workerId, workerName) {
    const wId = String(workerId || "").trim();
    const wName = String(workerName || "").trim().toLowerCase();
    
    // 1. If worker_id exists and matches a known worker in AppState
    if (wId && this.workers && this.workers.length) {
      const found = this.workers.find(w => String(w.id) === wId);
      if (found) return "w_" + found.id;
    }
    // 2. If worker_name matches a known worker by name
    if (wName && this.workers && this.workers.length) {
      const found = this.workers.find(w => (w.name || "").trim().toLowerCase() === wName);
      if (found) return "w_" + found.id;
    }
    // 3. Fallback to worker_id or worker_name
    if (wId) return "w_" + wId;
    if (wName) return "name_" + wName;
    return "unknown_worker";
  },

  filterLogs() {
    const { siteId, workerId, role, startDate, endDate, q } = this.filters;
    const startT = startDate ? this.parseDateToTime(startDate) : null;
    const endT = endDate ? this.parseDateToTime(endDate) : null;
    const query = q ? bnToEnDigits(q.trim().toLowerCase()) : "";

    return this.logs.filter(l => {
      if (siteId !== "all" && l.site_id !== siteId) return false;
      if (workerId !== "all") {
        const lKey = this.getWorkerCanonicalKey(l.worker_id, l.worker_name);
        const targetWorker = this.workers.find(w => w.id === workerId);
        const targetKey = targetWorker ? this.getWorkerCanonicalKey(targetWorker.id, targetWorker.name) : ("w_" + workerId);
        if (lKey !== targetKey) return false;
      }
      if (role !== "all" && l.role !== role) return false;
      
      const logT = this.parseDateToTime(l.date);
      if (startT && logT < startT) return false;
      if (endT && logT > endT) return false;

      if (query) {
        const rawText = `${l.worker_name || ""} ${l.site_name || ""} ${l.remarks || ""} ${l.date || ""}`.toLowerCase();
        const normalized = bnToEnDigits(rawText);
        if (!normalized.includes(query) && !rawText.includes(query)) return false;
      }
      return true;
    }).sort((a, b) => {
      const tA = this.parseDateToTime(a.date);
      const tB = this.parseDateToTime(b.date);
      if (tA !== tB) return tB - tA; // Newest date first for log lists
      const crA = a.created_at ? Date.parse(a.created_at) || 0 : 0;
      const crB = b.created_at ? Date.parse(b.created_at) || 0 : 0;
      return crB - crA;
    });
  },

  filterExpenses() {
    const { siteId, startDate, endDate, q } = this.filters;
    const startT = startDate ? this.parseDateToTime(startDate) : null;
    const endT = endDate ? this.parseDateToTime(endDate) : null;
    const query = q ? bnToEnDigits(q.trim().toLowerCase()) : "";

    return this.expenses.filter(e => {
      if (siteId !== "all" && e.site_id !== siteId) return false;
      const expT = this.parseDateToTime(e.date);
      if (startT && expT < startT) return false;
      if (endT && expT > endT) return false;
      if (query) {
        const rawText = `${e.site_name || ""} ${e.category || ""} ${e.note || ""} ${e.date || ""}`.toLowerCase();
        const normalized = bnToEnDigits(rawText);
        if (!normalized.includes(query) && !rawText.includes(query)) return false;
      }
      return true;
    }).sort((a, b) => {
      const tA = this.parseDateToTime(a.date);
      const tB = this.parseDateToTime(b.date);
      if (tA !== tB) return tB - tA;
      return (b.created_at || "").localeCompare(a.created_at || "");
    });
  },

  getRunningBalances() {
    // Sort all logs strictly in ascending chronological order (oldest date first -> newest date last)
    const sorted = [...this.logs].sort((a, b) => {
      const timeA = this.parseDateToTime(a.date);
      const timeB = this.parseDateToTime(b.date);
      if (timeA !== timeB) return timeA - timeB; // Oldest date first

      const crA = a.created_at ? Date.parse(a.created_at) || 0 : 0;
      const crB = b.created_at ? Date.parse(b.created_at) || 0 : 0;
      if (crA !== crB) return crA - crB;

      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    const running = {};
    const map = new Map();
    sorted.forEach(l => {
      const wKey = this.getWorkerCanonicalKey(l.worker_id, l.worker_name);
      if (running[wKey] === undefined) running[wKey] = 0;
      const net = (+l.wage_amount || 0) - (+l.advance_paid || 0);
      running[wKey] += net;
      map.set(l.id, running[wKey]);
    });
    return map;
  },

  money(n) { return "৳" + Number(n || 0).toLocaleString("en-IN"); }
};
window.AppState = AppState;

