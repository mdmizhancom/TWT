// Application State, Avatar Generator & Security Store
const DEFAULT_PASS = "M~R.88@Mizhan.25";

const AppState = {
  sites: [], workers: [], logs: [], expenses: [],
  isAdmin: localStorage.getItem("twt_admin") === "true",
  adminPass: localStorage.getItem("twt_pass") || DEFAULT_PASS,
  activeTab: "dashboard",
  filters: { siteId: "all", workerId: "all", role: "all", startDate: "", endDate: "", q: "" },

  setAdmin(status) {
    this.isAdmin = !!status;
    localStorage.setItem("twt_admin", this.isAdmin ? "true" : "false");
    document.body.classList.toggle("is-admin", this.isAdmin);
    if (window.Render) window.Render.updateAdmin();
  },

  verifyPassword(p) { return String(p).trim() === String(this.adminPass).trim(); },
  updatePassword(p) { this.adminPass = String(p).trim(); localStorage.setItem("twt_pass", this.adminPass); },

  getAvatar(w, cls = "") {
    if (w && w.avatar_url && w.avatar_url.trim()) {
      return `<img src="${w.avatar_url}" class="worker-avatar ${cls}" alt="${w.name || 'Worker'}" onerror="this.outerHTML='<div class=\\'worker-avatar ${cls}\\'>${(w.name || 'W').charAt(0)}</div>'">`;
    }
    const initial = w && w.name ? w.name.trim().charAt(0) : '<i class="fa-solid fa-user"></i>';
    return `<div class="worker-avatar ${cls}">${initial}</div>`;
  },

  filterLogs() {
    const { siteId, workerId, role, startDate, endDate, q } = this.filters;
    return this.logs.filter(l => {
      if (siteId !== "all" && l.site_id !== siteId) return false;
      if (workerId !== "all" && l.worker_id !== workerId) return false;
      if (role !== "all" && l.role !== role) return false;
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;
      if (q) {
        const text = `${l.worker_name} ${l.site_name} ${l.remarks || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  filterExpenses() {
    const { siteId, startDate, endDate, q } = this.filters;
    return this.expenses.filter(e => {
      if (siteId !== "all" && e.site_id !== siteId) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      if (q) {
        const text = `${e.site_name} ${e.category} ${e.note || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  money(n) { return "৳" + Number(n || 0).toLocaleString("en-IN"); }
};
window.AppState = AppState;
