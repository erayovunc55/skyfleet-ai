import { useCallback, useEffect, useState } from "react";

import apiClient from "../services/apiClient";
import "../styles/users.css";

const MODULE_LABELS = {
  dashboard: "Dashboard",
  "live-operations": "Canlı Operasyon",
  "live-support": "Canlı Destek",
  transfers: "Transferler",
  "transfer-requests": "Transfer Talepleri",
  fleet: "Filo",
  drivers: "Sürücüler",
  suppliers: "Tedarikçiler",
  agencies: "Acentalar",
  locations: "Lokasyonlar",
  documents: "Belgeler",
  ratings: "Değerlendirmeler",
  finance: "Finans",
  "ai-dispatcher": "AI Dispatcher",
  "ai-training": "AI Eğitim",
  "tour-packages": "Tur Paketleri",
};

const PRESETS = {
  "Operasyon": ["live-operations", "transfers", "transfer-requests", "drivers", "fleet", "live-support"],
  "Muhasebe": ["finance", "documents", "transfers"],
  "Sadece izleme": ["dashboard", "live-operations", "transfers"],
};

const EMPTY = {
  id: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "dispatcher",
  modules: [],
  read_only: false,
  is_active: true,
};

export default function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState(Object.keys(MODULE_LABELS));
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/admin/users");
      setUsers(data.data || []);
      if (data.modules?.length) setModules(data.modules);
    } catch (err) {
      setError(err.response?.data?.message || "Kullanıcılar yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function edit(user) {
    setError("");
    setNotice("");
    setForm({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role,
      modules: user.permissions?.modules || [],
      read_only: Boolean(user.permissions?.read_only),
      is_active: Boolean(user.is_active),
    });
  }

  function toggleModule(key) {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(key)
        ? f.modules.filter((m) => m !== key)
        : [...f.modules, key],
    }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      modules: form.modules,
      read_only: form.read_only,
      is_active: form.is_active,
    };

    if (form.password) payload.password = form.password;

    try {
      if (form.id) {
        await apiClient.patch(`/admin/users/${form.id}`, payload);
      } else {
        await apiClient.post("/admin/users", { ...payload, password: form.password });
      }
      setNotice("Kullanıcı kaydedildi.");
      setForm(null);
      await load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(" ")
          : err.response?.data?.message || "Kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  function summary(user) {
    if (user.role !== "dispatcher" || !user.permissions) return "Tam yetki";
    const count = user.permissions.modules?.length || 0;
    return `${count} modül${user.permissions.read_only ? " · salt okunur" : ""}`;
  }

  return (
    <section className="users-page">
      <header className="users-head">
        <div>
          <span className="users-eyebrow">YÖNETİM</span>
          <h1>Kullanıcılar ve Yetkiler</h1>
          <p>Panele yeni kullanıcı ekleyin ve hangi bölümleri görebileceklerini belirleyin.</p>
        </div>
        <button className="users-primary" type="button" onClick={() => { setError(""); setNotice(""); setForm({ ...EMPTY }); }}>
          + Yeni kullanıcı
        </button>
      </header>

      {error && <div className="users-alert error">{error}</div>}
      {notice && <div className="users-alert ok">{notice}</div>}

      <div className="users-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>E-posta / Telefon</th>
              <th>Rol</th>
              <th>Yetki</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}<br /><small>{user.phone}</small></td>
                <td>{user.role}</td>
                <td>{summary(user)}</td>
                <td>
                  <span className={user.is_active ? "users-pill on" : "users-pill off"}>
                    {user.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td>
                  <button type="button" className="users-link" onClick={() => edit(user)}>
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="6" className="users-empty">Kullanıcı yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="users-modal" role="dialog" aria-modal="true">
          <form className="users-form" onSubmit={save}>
            <h2>{form.id ? "Kullanıcıyı düzenle" : "Yeni kullanıcı"}</h2>

            <div className="users-grid">
              <label>Ad Soyad
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>E-posta
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>Telefon
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>{form.id ? "Yeni şifre (boş bırakılırsa değişmez)" : "Şifre (en az 8 karakter)"}
                <input type="password" minLength={8} required={!form.id} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <label>Rol
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="dispatcher">Kısıtlı kullanıcı (Dispatcher)</option>
                  <option value="admin">Yönetici (tam yetki)</option>
                </select>
              </label>
              {form.id && form.id !== currentUser?.id && (
                <label className="users-check">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Hesap aktif
                </label>
              )}
            </div>

            {form.role === "dispatcher" ? (
              <>
                <div className="users-presets">
                  <span>Hazır şablon:</span>
                  {Object.entries(PRESETS).map(([name, list]) => (
                    <button key={name} type="button" onClick={() => setForm({ ...form, modules: list })}>{name}</button>
                  ))}
                </div>
                <div className="users-modules">
                  {modules.map((key) => (
                    <label key={key} className={form.modules.includes(key) ? "users-module on" : "users-module"}>
                      <input type="checkbox" checked={form.modules.includes(key)} onChange={() => toggleModule(key)} />
                      {MODULE_LABELS[key] || key}
                    </label>
                  ))}
                </div>
                <label className="users-check">
                  <input type="checkbox" checked={form.read_only} onChange={(e) => setForm({ ...form, read_only: e.target.checked })} />
                  Salt okunur (sadece görüntüleyebilir, değişiklik yapamaz)
                </label>
              </>
            ) : (
              <p className="users-hint">Yönetici tüm bölümlere erişir.</p>
            )}

            <div className="users-actions">
              <button type="button" className="users-secondary" onClick={() => setForm(null)}>Vazgeç</button>
              <button type="submit" className="users-primary" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}