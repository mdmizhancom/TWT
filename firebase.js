// Firebase Dynamic Configuration & Clean Sync Manager
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCmu9t9leGA9cttdCcCSIGBTH2bHAi13hc",
  authDomain: "tiles-work-tracer.firebaseapp.com",
  projectId: "tiles-work-tracer",
  storageBucket: "tiles-work-tracer.firebasestorage.app",
  messagingSenderId: "1042216202116",
  appId: "1:1042216202116:web:2fba3d89f5011c529677d1"
};

let db = null;
async function initFirebase(cfg) {
  try {
    if (window.firebase && cfg && cfg.apiKey) {
      if (firebase.apps.length) {
        await Promise.all(firebase.apps.map(app => app.delete()));
      }
      firebase.initializeApp(cfg);
      db = firebase.firestore();
    }
  } catch (e) { console.warn("Firebase Init:", e.message); }
}

const savedConfig = localStorage.getItem("twt_firebase_config");
initFirebase(savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG);

const DB = {
  _listeners: {},
  getConfig() {
    const c = localStorage.getItem("twt_firebase_config");
    return c ? JSON.parse(c) : DEFAULT_CONFIG;
  },
  saveConfig(cfg) {
    localStorage.setItem("twt_firebase_config", JSON.stringify(cfg));
    initFirebase(cfg);
  },
  get(k) {
    try { const d = localStorage.getItem("twt_" + k); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  },
  save(k, list) {
    try { localStorage.setItem("twt_" + k, JSON.stringify(list)); } catch (e) {}
    if (this._listeners[k]) {
      this._listeners[k].forEach(cb => {
        try { cb(list); } catch (err) { console.error("Listener error:", err); }
      });
    }
  },
  listen(col, cb) {
    if (!this._listeners[col]) this._listeners[col] = [];
    this._listeners[col].push(cb);
    cb(this.get(col));
    if (db) {
      try {
        db.collection(col).onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          try { localStorage.setItem("twt_" + col, JSON.stringify(list)); } catch (e) {}
          cb(list);
        }, err => console.warn(col + " listen:", err));
      } catch (err) {}
    }
  },
  async add(col, data) {
    const item = { ...data, created_at: new Date().toISOString() };
    if (db) {
      try { const ref = await db.collection(col).add(item); item.id = ref.id; } catch (e) {}
    }
    if (!item.id) item.id = "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    const list = this.get(col);
    list.unshift(item);
    this.save(col, list);
    return item;
  },
  async update(col, id, updates) {
    if (db && !id.startsWith("id_")) {
      try { await db.collection(col).doc(id).update(updates); } catch (e) {}
    }
    const list = this.get(col).map(it => it.id === id ? { ...it, ...updates } : it);
    this.save(col, list);
    return true;
  },
  async remove(col, id) {
    if (db && !id.startsWith("id_")) {
      try { await db.collection(col).doc(id).delete(); } catch (e) {}
    }
    const list = this.get(col).filter(it => it.id !== id);
    this.save(col, list);
    return true;
  }
};
window.DB = DB;
