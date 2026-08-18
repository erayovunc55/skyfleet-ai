import {
  useState,
} from "react";

import supplierService from "../services/supplierService";

const INITIAL_FORM = {
  company_name: "",
  legal_name: "",
  contact_name: "",
  company_email: "",
  company_phone: "",
  whatsapp: "",
  tax_number: "",
  registration_number: "",
  country_code: "TR",
  country_name: "Türkiye",
  city: "",
  address: "",
  timezone: "Europe/Istanbul",
  default_currency: "EUR",
  payout_percentage: "90",
  portal_name: "",
  portal_email: "",
  portal_phone: "",
  portal_password: "",
  portal_password_confirmation: "",
};

export default function CreateSupplierModal({
  onClose,
  onCreated,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [validationErrors, setValidationErrors] =
    useState({});

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setValidationErrors(
      (currentErrors) => ({
        ...currentErrors,
        [name]: undefined,
      }),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");
    setValidationErrors({});

    try {
      const payload = {
        ...form,

        payout_percentage:
          Number(
            form.payout_percentage,
          ),

        company_email:
          normalizeOptionalValue(
            form.company_email,
          ),

        company_phone:
          normalizeOptionalValue(
            form.company_phone,
          ),

        whatsapp:
          normalizeOptionalValue(
            form.whatsapp,
          ),

        tax_number:
          normalizeOptionalValue(
            form.tax_number,
          ),

        registration_number:
          normalizeOptionalValue(
            form.registration_number,
          ),

        address:
          normalizeOptionalValue(
            form.address,
          ),
      };

      const createdSupplier =
        await supplierService
          .createSupplierWithAccount(
            payload,
          );

      await onCreated?.(
        createdSupplier,
      );

      onClose?.();
    } catch (requestError) {
      const responseErrors =
        requestError?.response
          ?.data?.errors;

      if (
        responseErrors &&
        typeof responseErrors ===
          "object"
      ) {
        setValidationErrors(
          responseErrors,
        );
      }

      setError(
        requestError?.response
          ?.data?.message ||
        requestError?.message ||
        "Tedarikçi oluşturulamadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="supplier-create-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !saving
        ) {
          onClose?.();
        }
      }}
    >
      <section
        className="supplier-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-create-title"
      >
        <header className="supplier-create-modal-header">
          <div>
            <span>
              YENİ TEDARİKÇİ
            </span>

            <h2 id="supplier-create-title">
              Tedarikçi ve Portal Hesabı
            </h2>

            <p>
              Şirketi ve tedarikçi paneli giriş
              hesabını birlikte oluşturun.
            </p>
          </div>

          <button
            type="button"
            className="supplier-create-close-button"
            aria-label="Pencereyi kapat"
            disabled={saving}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form
          className="supplier-create-form"
          onSubmit={handleSubmit}
        >
          <FormSection
            title="Şirket Bilgileri"
            description="Tedarikçinin ticari ve iletişim bilgileri."
          >
            <FormField
              label="Şirket Adı"
              name="company_name"
              value={form.company_name}
              error={
                validationErrors
                  .company_name?.[0]
              }
              required
              onChange={handleChange}
              placeholder="Örn. Antalya Transfer"
            />

            <FormField
              label="Yasal Şirket Unvanı"
              name="legal_name"
              value={form.legal_name}
              error={
                validationErrors
                  .legal_name?.[0]
              }
              required
              onChange={handleChange}
              placeholder="Örn. Antalya Transfer Ltd. Şti."
            />

            <FormField
              label="Yetkili Kişi"
              name="contact_name"
              value={form.contact_name}
              error={
                validationErrors
                  .contact_name?.[0]
              }
              required
              onChange={handleChange}
              placeholder="Ad Soyad"
            />

            <FormField
              label="Şirket E-postası"
              name="company_email"
              type="email"
              value={form.company_email}
              error={
                validationErrors
                  .company_email?.[0]
              }
              onChange={handleChange}
              placeholder="operation@firma.com"
            />

            <FormField
              label="Şirket Telefonu"
              name="company_phone"
              type="tel"
              value={form.company_phone}
              error={
                validationErrors
                  .company_phone?.[0]
              }
              onChange={handleChange}
              placeholder="+90 5XX XXX XX XX"
            />

            <FormField
              label="WhatsApp"
              name="whatsapp"
              type="tel"
              value={form.whatsapp}
              error={
                validationErrors
                  .whatsapp?.[0]
              }
              onChange={handleChange}
              placeholder="+90 5XX XXX XX XX"
            />

            <FormField
              label="Vergi Numarası"
              name="tax_number"
              value={form.tax_number}
              error={
                validationErrors
                  .tax_number?.[0]
              }
              onChange={handleChange}
              placeholder="Vergi numarası"
            />

            <FormField
              label="Ticaret Sicil Numarası"
              name="registration_number"
              value={
                form.registration_number
              }
              error={
                validationErrors
                  .registration_number?.[0]
              }
              onChange={handleChange}
              placeholder="Sicil numarası"
            />
          </FormSection>

          <FormSection
            title="Konum ve Finans"
            description="Tedarikçinin çalışma bölgesi ve ödeme oranı."
          >
            <FormField
              label="Ülke Kodu"
              name="country_code"
              value={form.country_code}
              error={
                validationErrors
                  .country_code?.[0]
              }
              required
              maxLength={2}
              onChange={handleChange}
              placeholder="TR"
            />

            <FormField
              label="Ülke"
              name="country_name"
              value={form.country_name}
              error={
                validationErrors
                  .country_name?.[0]
              }
              required
              onChange={handleChange}
              placeholder="Türkiye"
            />

            <FormField
              label="Şehir"
              name="city"
              value={form.city}
              error={
                validationErrors
                  .city?.[0]
              }
              required
              onChange={handleChange}
              placeholder="İstanbul"
            />

            <FormField
              label="Adres"
              name="address"
              value={form.address}
              error={
                validationErrors
                  .address?.[0]
              }
              onChange={handleChange}
              placeholder="Şirket adresi"
            />

            <FormSelect
              label="Saat Dilimi"
              name="timezone"
              value={form.timezone}
              error={
                validationErrors
                  .timezone?.[0]
              }
              required
              onChange={handleChange}
              options={[
                {
                  value:
                    "Europe/Istanbul",
                  label:
                    "Europe/Istanbul",
                },
                {
                  value:
                    "Europe/London",
                  label:
                    "Europe/London",
                },
                {
                  value:
                    "Europe/Madrid",
                  label:
                    "Europe/Madrid",
                },
                {
                  value:
                    "Africa/Cairo",
                  label:
                    "Africa/Cairo",
                },
                {
                  value: "UTC",
                  label: "UTC",
                },
              ]}
            />

            <FormSelect
              label="Para Birimi"
              name="default_currency"
              value={
                form.default_currency
              }
              error={
                validationErrors
                  .default_currency?.[0]
              }
              required
              onChange={handleChange}
              options={[
                {
                  value: "EUR",
                  label: "EUR — Euro",
                },
                {
                  value: "TRY",
                  label:
                    "TRY — Türk Lirası",
                },
                {
                  value: "USD",
                  label:
                    "USD — Amerikan Doları",
                },
                {
                  value: "GBP",
                  label:
                    "GBP — İngiliz Sterlini",
                },
              ]}
            />

            <FormField
              label="Tedarikçi Ödeme Oranı (%)"
              name="payout_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                form.payout_percentage
              }
              error={
                validationErrors
                  .payout_percentage?.[0]
              }
              required
              onChange={handleChange}
              placeholder="90"
            />
          </FormSection>

          <FormSection
            title="Portal Giriş Hesabı"
            description="Tedarikçi bu bilgilerle kendi paneline giriş yapacak."
          >
            <FormField
              label="Kullanıcı Ad Soyad"
              name="portal_name"
              value={form.portal_name}
              error={
                validationErrors
                  .portal_name?.[0]
              }
              required
              onChange={handleChange}
              placeholder="Panel yöneticisinin adı"
            />

            <FormField
              label="Giriş E-postası"
              name="portal_email"
              type="email"
              value={form.portal_email}
              error={
                validationErrors
                  .portal_email?.[0]
              }
              required
              onChange={handleChange}
              placeholder="manager@firma.com"
            />

            <FormField
              label="Giriş Telefonu"
              name="portal_phone"
              type="tel"
              value={form.portal_phone}
              error={
                validationErrors
                  .portal_phone?.[0]
              }
              required
              onChange={handleChange}
              placeholder="+90 5XX XXX XX XX"
            />

            <FormField
              label="Geçici Şifre"
              name="portal_password"
              type="password"
              value={
                form.portal_password
              }
              error={
                validationErrors
                  .portal_password?.[0]
              }
              required
              minLength={8}
              autoComplete="new-password"
              onChange={handleChange}
              placeholder="En az 8 karakter"
            />

            <FormField
              label="Şifre Tekrarı"
              name="portal_password_confirmation"
              type="password"
              value={
                form
                  .portal_password_confirmation
              }
              error={
                validationErrors
                  .portal_password_confirmation?.[0]
              }
              required
              minLength={8}
              autoComplete="new-password"
              onChange={handleChange}
              placeholder="Şifreyi tekrar yazın"
            />
          </FormSection>

          {error && (
            <div className="supplier-create-error">
              {error}
            </div>
          )}

          <footer className="supplier-create-modal-footer">
            <button
              type="button"
              className="supplier-create-cancel-button"
              disabled={saving}
              onClick={onClose}
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="supplier-create-save-button"
              disabled={saving}
            >
              {saving
                ? "Oluşturuluyor..."
                : "Tedarikçiyi Oluştur"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="supplier-create-section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>

      <div className="supplier-create-fields">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  error,
  required = false,
  ...inputProps
}) {
  return (
    <label className="supplier-create-field">
      <span>
        {label}

        {required && (
          <small> *</small>
        )}
      </span>

      <input
        {...inputProps}
        required={required}
        className={
          error ? "has-error" : ""
        }
      />

      {error && (
        <small className="supplier-create-field-error">
          {error}
        </small>
      )}
    </label>
  );
}

function FormSelect({
  label,
  options,
  error,
  required = false,
  ...selectProps
}) {
  return (
    <label className="supplier-create-field">
      <span>
        {label}

        {required && (
          <small> *</small>
        )}
      </span>

      <select
        {...selectProps}
        required={required}
        className={
          error ? "has-error" : ""
        }
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <small className="supplier-create-field-error">
          {error}
        </small>
      )}
    </label>
  );
}

function normalizeOptionalValue(value) {
  const normalized =
    String(value || "").trim();

  return normalized || null;
}