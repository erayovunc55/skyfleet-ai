import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const EMPTY = { region: "", title: "", description: "", image_url: "", tag: "", duration: "", price: "", currency: "EUR", sort_order: 0, is_active: true };

export default function TourPackagesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try { const response = await apiClient.get("/tour-packages"); setRows(response.data?.data || []); }
    catch (error) { setNotice(error.response?.data?.message || error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function change(event) { const { name, value, type, checked } = event.target; setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value })); }
  function startEdit(row) { setEditing(row.id); setForm({ ...row, price: row.price || "" }); }
  function reset() { setEditing(null); setForm(EMPTY); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setNotice("");
    try { if (editing) await apiClient.patch(`/tour-packages/${editing}`, form); else await apiClient.post("/tour-packages", form); reset(); await load(); setNotice("Tour package saved."); }
    catch (error) { setNotice(error.response?.data?.message || error.message); }
    finally { setSaving(false); }
  }
  async function remove(row) { if (!window.confirm(`Delete ${row.title}?`)) return; await apiClient.delete(`/tour-packages/${row.id}`); await load(); }

  return <main className="tour-admin-page">
    <header><div><span>PUBLIC WEBSITE</span><h1>Tour Packages</h1><p>Create and publish package cards with your own price and image.</p></div><button type="button" onClick={reset}>+ New package</button></header>
    {notice && <div className="tour-admin-notice">{notice}</div>}
    <section className="tour-admin-layout">
      <form className="tour-admin-form" onSubmit={save}><h2>{editing ? "Edit package" : "New package"}</h2>
        <label>Region<input name="region" value={form.region} onChange={change} required /></label>
        <label>Title<input name="title" value={form.title} onChange={change} required /></label>
        <label>Description<textarea name="description" value={form.description} onChange={change} rows="4" required /></label>
        <label>Image URL<input name="image_url" value={form.image_url} onChange={change} placeholder="https://..." type="url" /></label>
        <div className="tour-admin-row"><label>Tag<input name="tag" value={form.tag} onChange={change} /></label><label>Duration<input name="duration" value={form.duration} onChange={change} /></label></div>
        <div className="tour-admin-row"><label>Price<input name="price" value={form.price} onChange={change} type="number" min="0" step="0.01" /></label><label>Currency<select name="currency" value={form.currency} onChange={change}><option>EUR</option><option>USD</option><option>GBP</option><option>TRY</option></select></label></div>
        <label>Sort order<input name="sort_order" value={form.sort_order} onChange={change} type="number" min="0" /></label>
        <label className="tour-admin-check"><input name="is_active" checked={form.is_active} onChange={change} type="checkbox" /> Publish on website</label>
        <div className="tour-admin-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create package"}</button>{editing && <button type="button" onClick={reset}>Cancel</button>}</div>
      </form>
      <section className="tour-admin-list"><h2>Published packages</h2>{loading ? <p>Loading...</p> : rows.map((row) => <article key={row.id}><div className="tour-admin-image" style={{ backgroundImage: `url(${row.image_url || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=500&q=70"})` }} /><div><small>{row.region} · {row.duration || "-"}</small><h3>{row.title}</h3><p>{row.description}</p><strong>{row.price ? `${row.price} ${row.currency}` : "Price on request"}</strong></div><div className="tour-admin-item-actions"><button type="button" onClick={() => startEdit(row)}>Edit</button><button type="button" onClick={() => remove(row)}>Delete</button></div></article>)}</section>
    </section>
  </main>;
}
