import { useEffect, useState } from "react";
import supplierService from "../services/supplierService";

export default function EditSupplierModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supplier) return;
    setForm({
      company_name: supplier.company_name || "",
      legal_name: supplier.legal_name || "",
      contact_name: supplier.contact_name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      whatsapp: supplier.whatsapp || "",
      tax_number: supplier.tax_number || "",
      registration_number: supplier.registration_number || "",
      country_code: supplier.country_code || "",
      country_name: supplier.country_name || "",
      city: supplier.city || "",
      address: supplier.address || "",
      timezone: supplier.timezone || "Europe/Istanbul",
      default_currency: supplier.default_currency || "EUR",
    });
  }, [supplier]);

  if (!supplier) return null;

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const updated = await supplierService.updateSupplier(supplier.id, form);
      onSaved?.(updated);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Tedarikçi güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ["company_name", "Şirket Adı", true], ["legal_name", "Yasal Şirket Unvanı"],
    ["contact_name", "Yetkili Kişi"], ["email", "Şirket E-postası"],
    ["phone", "Şirket Telefonu"], ["whatsapp", "WhatsApp"],
    ["tax_number", "Vergi Numarası"], ["registration_number", "Ticaret Sicil Numarası"],
    ["country_code", "Ülke Kodu", true], ["country_name", "Ülke"],
    ["city", "Şehir"], ["address", "Adres"], ["timezone", "Saat Dilimi"],
    ["default_currency", "Para Birimi"],
  ];

  return <div className="supplier-create-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
    <section className="supplier-create-modal">
      <header className="supplier-create-modal-header"><div><span>TEDARİKÇİ DÜZENLE</span><h2>{supplier.company_name}</h2><p>Kurumsal ve operasyon bilgilerini güncelleyin.</p></div><button type="button" className="supplier-create-close-button" onClick={onClose}>×</button></header>
      <form className="supplier-create-form" onSubmit={submit}>
        {error && <div className="supplier-create-error">{error}</div>}
        <section className="supplier-create-section"><header><h3>Şirket Bilgileri</h3></header><div className="supplier-create-fields">
          {fields.map(([key,label,required]) => <label className="supplier-create-field" key={key}><span>{label}{required ? <small> *</small> : null}</span><input value={form[key] ?? ""} required={Boolean(required)} onChange={(e)=>change(key,e.target.value)} /></label>)}
        </div></section>
        <footer className="supplier-create-modal-footer"><button type="button" className="supplier-create-cancel-button" onClick={onClose} disabled={saving}>Vazgeç</button><button type="submit" className="supplier-create-save-button" disabled={saving}>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button></footer>
      </form>
    </section>
  </div>;
}
