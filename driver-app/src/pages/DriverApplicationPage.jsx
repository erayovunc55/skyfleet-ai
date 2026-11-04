import { useState } from "react";
import { useLanguage } from "../i18n";
import apiClient from "../services/apiClient";

export default function DriverApplicationPage({ onBack }) {
  const { language } = useLanguage();
  const tr = language === "tr";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState(null);
  const label = (turkish, english) => tr ? turkish : english;

  async function submit(event) {
    event.preventDefault();
    const payload = new FormData(event.currentTarget);
    payload.set("application_type", "individual");
    payload.set("company_name", payload.get("contact_name"));
    payload.set("fleet_size", "1");
    payload.set("driver_count", "1");

    setSubmitting(true);
    setError("");
    try {
      const response = await apiClient.post("/public/supplier-applications", payload);
      if (!response.data?.data?.application_id) {
        throw new Error(label("Başvuru numarası alınamadı.", "Application reference was not returned."));
      }
      setApplicationId(response.data.data.application_id);
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors
        ? Object.values(errors).flat().join(" ")
        : requestError.response?.data?.message || requestError.message ||
          label("Başvuru gönderilemedi.", "Application could not be submitted."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="driver-login-page">
      <section className="driver-login-card driver-application-card">
        <button type="button" onClick={onBack} disabled={submitting}>
          {label("Girişe dön", "Back to login")}
        </button>
        <h1>{label("Bireysel Tedarikçi Başvurusu", "Individual Supplier Application")}</h1>
        <p>{label(
          "Kendi aracınızla tedarikçi ağımıza katılın. Hesaplarınız yönetici onayından sonra açılır. Açık işleri almak için hizmet alanlarınızı tedarikçi panelinden tanımlayın.",
          "Join our supplier network with your own vehicle. Your accounts are activated after admin approval. Configure your coverage in the supplier portal to receive available jobs.",
        )}</p>
        {applicationId ? (
          <div role="status">
            <h2>{label("Başvurunuz alındı", "Application received")} #{applicationId}</h2>
            <p>{label(
              "Onaydan sonra: tedarikçi paneline e-posta adresinizle, sürücü uygulamasına telefon numaranızla ve oluşturduğunuz şifreyle giriş yapın.",
              "After approval: sign in to the supplier portal with your email and to the driver app with your phone number, using the password you created.",
            )}</p>
            <a href="https://skytriptransfer.com/supplier/" target="_blank" rel="noreferrer">
              {label("Tedarikçi paneli", "Supplier portal")}
            </a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={submitting}>
              <legend>{label("İletişim ve hizmet bölgesi", "Contact and service area")}</legend>
              <label>{label("Ad soyad", "Full name")}<input name="contact_name" required maxLength={255} autoComplete="name" /></label>
              <label>{label("E-posta (tedarikçi girişi)", "Email (supplier login)")}<input name="company_email" type="email" required maxLength={255} autoComplete="email" /></label>
              <label>{label("Telefon (sürücü girişi, ülke koduyla)", "Phone (driver login, with country code)")}<input name="company_phone" type="tel" required maxLength={50} placeholder="+905..." autoComplete="tel" /></label>
              <label>{label("Ülke kodu", "Country code")}<input name="country_code" required minLength={2} maxLength={2} defaultValue="TR" /></label>
              <label>{label("Ülke", "Country")}<input name="country_name" required maxLength={100} defaultValue="Türkiye" /></label>
              <label>{label("Şehir", "City")}<input name="city" required maxLength={100} /></label>
              <label>{label("Hizmet verdiğiniz bölgeler", "Service regions")}<textarea name="service_regions" required maxLength={5000} /></label>
              <label>{label("Havalimanları", "Airports")}<input name="service_airports" maxLength={10000} placeholder="IST, SAW" /></label>
              <label>{label("Saat dilimi", "Timezone")}<input name="timezone" required defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} /></label>
              <label>{label("Para birimi", "Currency")}<input name="default_currency" required minLength={3} maxLength={3} defaultValue="EUR" /></label>
              <input type="hidden" name="preferred_language" value={language} />
            </fieldset>
            <fieldset disabled={submitting}>
              <legend>{label("Aracınız", "Your vehicle")}</legend>
              <label>{label("Plaka", "Plate")}<input name="vehicle_plate" required maxLength={20} /></label>
              <label>{label("Marka", "Brand")}<input name="vehicle_brand" required maxLength={100} /></label>
              <label>{label("Model", "Model")}<input name="vehicle_model" required maxLength={100} /></label>
              <label>{label("Araç tipi", "Vehicle type")}<input name="vehicle_types" required maxLength={100} placeholder="Sedan / Minivan" /></label>
              <label>{label("Yolcu kapasitesi (sürücü hariç)", "Passenger capacity (excluding driver)")}<input name="passenger_capacity" type="number" min={1} max={100} required /></label>
            </fieldset>
            <fieldset disabled={submitting}>
              <legend>{label("Belgeler (PDF veya fotoğraf, her biri en fazla 10 MB)", "Documents (PDF or image, up to 10 MB each)")}</legend>
              {[
                ["company_registration_file", label("Araç ruhsatı", "Vehicle registration")],
                ["tax_document_file", label("Vergi belgesi", "Tax document")],
                ["insurance_file", label("Sigorta belgesi", "Insurance certificate")],
                ["transport_license_file", label("Ehliyet ve taşıma yetki belgesi", "Driver and transport licence")],
              ].map(([name, title]) => (
                <label key={name}>{title}<input name={name} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required /></label>
              ))}
            </fieldset>
            <fieldset disabled={submitting}>
              <legend>{label("Hesap ve onay", "Account and consent")}</legend>
              <label>{label("Şifre (en az 8 karakter, harf ve rakam)", "Password (at least 8 characters, letters and numbers)")}<input name="portal_password" type="password" required minLength={8} autoComplete="new-password" /></label>
              <label>{label("Şifre tekrar", "Confirm password")}<input name="portal_password_confirmation" type="password" required minLength={8} autoComplete="new-password" /></label>
              <a href="https://skytriptransfer.com/privacy-policy/" target="_blank" rel="noreferrer">
                {label("Gizlilik Politikası", "Privacy Policy")}
              </a>
              <label className="driver-application-consent"><input name="terms_accepted" type="checkbox" value="1" required />{label(
                "Bilgilerimin doğruluğunu, belgelerimin incelenmesini ve yönetici onayından önce iş alamayacağımı kabul ediyorum.",
                "I confirm that my information is accurate, consent to document review and understand that I cannot accept work before admin approval.",
              )}</label>
            </fieldset>
            {error && <div className="driver-login-error" role="alert">{error}</div>}
            <button type="submit" disabled={submitting}>
              {submitting ? label("Gönderiliyor...", "Submitting...") : label("Başvuruyu gönder", "Submit application")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
