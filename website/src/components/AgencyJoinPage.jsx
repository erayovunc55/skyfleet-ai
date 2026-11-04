import { useState } from "react";
import axios from "axios";
import "../styles/agency-join.css";

const EMPTY = {
  company_name: "",
  legal_name: "",
  email: "",
  phone: "",
  website: "",
  country_code: "",
  country_name: "",
  city: "",
  tax_number: "",
  registration_number: "",
  default_currency: "EUR",
  portal_password: "",
  portal_password_confirmation: "",
  notes: "",
  consent: false,
};

export default function AgencyJoinPage({ language = "en" }) {
  const tr = language === "tr";

  const [form, setForm] = useState(EMPTY);

  const [state, setState] = useState({
    status: "idle",
    message: "",
  });

  function change(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setState({
      status: "submitting",
      message: tr
        ? "Başvurunuz gönderiliyor..."
        : "Submitting your application...",
    });

    if (
      form.portal_password !==
      form.portal_password_confirmation
    ) {
      setState({
        status: "error",
        message: tr
          ? "Şifreler birbiriyle eşleşmiyor."
          : "Passwords do not match.",
      });

      return;
    }

    try {
      const response = await axios.post(
        "/api/index.php/public/agency-applications",
        {
          ...form,

          country_code:
            form.country_code
              ? form.country_code
                  .trim()
                  .toUpperCase()
              : null,

          consent:
            form.consent
              ? 1
              : 0,
        },
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      setForm(EMPTY);

      setState({
        status: "success",

        message:
          response.data?.message ||
          (
            tr
              ? "Acenta başvurunuz başarıyla alındı. Ekibimiz inceleme sonrasında sizinle iletişime geçecektir."
              : "Your agency application has been received. Our team will contact you after review."
          ),
      });
    } catch (error) {
      const validation =
        error.response?.data?.errors;

      const firstValidationError =
        validation
          ? Object
              .values(validation)
              .flat()[0]
          : null;

      setState({
        status: "error",

        message:
          firstValidationError ||
          error.response?.data?.message ||
          (
            tr
              ? "Başvuru gönderilemedi. Lütfen bilgilerinizi kontrol edin."
              : "Application could not be submitted. Please review your details."
          ),
      });
    }
  }

  return (
    <main className="agency-join-page">

      <section className="agency-join-hero section-pad">

        <div>
          <span className="agency-join-eyebrow">
            {tr
              ? "SKYFLEET ACENTA AĞI"
              : "SKYFLEET AGENCY NETWORK"}
          </span>

          <h1>
            {tr
              ? "Transferlerinizi tek panelden yönetin."
              : "Manage your transfers from one professional portal."}
          </h1>

          <p>
            {tr
              ? "Skyfleet acenta ağına katılın; özel B2B fiyatlarını görüntüleyin, rezervasyon oluşturun ve operasyonlarınızı canlı takip edin."
              : "Join the Skyfleet agency network to access contracted B2B rates, create bookings and follow operations in real time."}
          </p>

          <div className="agency-join-benefits">

            <span>
              ✓{" "}
              {tr
                ? "Özel acenta fiyatları"
                : "Contracted agency rates"}
            </span>

            <span>
              ✓{" "}
              {tr
                ? "Anlık rezervasyon"
                : "Instant booking"}
            </span>

            <span>
              ✓{" "}
              {tr
                ? "Canlı transfer takibi"
                : "Live transfer tracking"}
            </span>

            <span>
              ✓{" "}
              {tr
                ? "Tek panelden operasyon"
                : "One operational workspace"}
            </span>

          </div>
        </div>

        <aside>
          <strong>
            B2B PARTNER
          </strong>

          <span>
            {tr
              ? "Başvuru → İnceleme → Portal erişimi"
              : "Apply → Review → Portal access"}
          </span>
        </aside>

      </section>


      <section className="agency-join-shell section-pad">

        <div className="agency-join-intro">

          <span className="agency-join-eyebrow">
            {tr
              ? "ACENTA BAŞVURUSU"
              : "AGENCY APPLICATION"}
          </span>

          <h2>
            {tr
              ? "Şirket bilgilerinizi gönderin."
              : "Tell us about your agency."}
          </h2>

          <p>
            {tr
              ? "Başvurunuz operasyon ekibimiz tarafından incelenir. Hesabınız başvuru sırasında oluşturulur ancak onaylanana kadar aktif olmaz."
              : "Our operations team reviews every application. Your portal account is created during registration but remains inactive until approval."}
          </p>

        </div>


        <form
          className="agency-join-form"
          onSubmit={submit}
        >

          <div className="agency-join-form-grid">

            <Field
              label={
                tr
                  ? "Şirket adı *"
                  : "Company name *"
              }
              wide
            >
              <input
                name="company_name"
                value={form.company_name}
                onChange={change}
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Ticari unvan"
                  : "Legal company name"
              }
              wide
            >
              <input
                name="legal_name"
                value={form.legal_name}
                onChange={change}
              />
            </Field>


            <Field
              label={
                tr
                  ? "E-posta *"
                  : "Business email *"
              }
            >
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Telefon *"
                  : "Phone *"
              }
            >
              <input
                name="phone"
                value={form.phone}
                onChange={change}
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Ülke *"
                  : "Country *"
              }
            >
              <input
                name="country_name"
                value={form.country_name}
                onChange={change}
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Ülke kodu"
                  : "Country code"
              }
            >
              <input
                name="country_code"
                maxLength={2}
                placeholder="TR"
                value={form.country_code}
                onChange={change}
              />
            </Field>


            <Field
              label={
                tr
                  ? "Şehir *"
                  : "City *"
              }
            >
              <input
                name="city"
                value={form.city}
                onChange={change}
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Para birimi *"
                  : "Preferred currency *"
              }
            >
              <select
                name="default_currency"
                value={form.default_currency}
                onChange={change}
                required
              >
                <option value="EUR">
                  EUR — Euro
                </option>

                <option value="USD">
                  USD — US Dollar
                </option>

                <option value="GBP">
                  GBP — Pound Sterling
                </option>

                <option value="TRY">
                  TRY — Turkish Lira
                </option>
              </select>
            </Field>


            <Field
              label={
                tr
                  ? "Portal şifresi *"
                  : "Portal password *"
              }
            >
              <input
                type="password"
                name="portal_password"
                value={form.portal_password}
                onChange={change}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Field>


            <Field
              label={
                tr
                  ? "Şifre tekrarı *"
                  : "Confirm password *"
              }
            >
              <input
                type="password"
                name="portal_password_confirmation"
                value={
                  form.portal_password_confirmation
                }
                onChange={change}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Field>


            <div className="agency-join-password-hint">
              {tr
                ? "Şifreniz en az 8 karakter olmalıdır."
                : "Your password must contain at least 8 characters."}
            </div>


            <Field
              label={
                tr
                  ? "Web sitesi"
                  : "Website"
              }
              wide
            >
              <input
                name="website"
                value={form.website}
                onChange={change}
                placeholder="https://"
              />
            </Field>


            <Field
              label={
                tr
                  ? "Vergi numarası"
                  : "Tax number"
              }
            >
              <input
                name="tax_number"
                value={form.tax_number}
                onChange={change}
              />
            </Field>


            <Field
              label={
                tr
                  ? "Şirket kayıt no"
                  : "Registration number"
              }
            >
              <input
                name="registration_number"
                value={form.registration_number}
                onChange={change}
              />
            </Field>


            <Field
              label={
                tr
                  ? "Not / operasyon bilgisi"
                  : "Notes / operational information"
              }
              wide
            >
              <textarea
                name="notes"
                rows="5"
                value={form.notes}
                onChange={change}
              />
            </Field>

          </div>


          <label className="agency-join-consent">

            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={change}
              required
            />

            <span>
              {tr
                ? "Bilgilerimin Skyfleet tarafından acenta başvurumun değerlendirilmesi, portal hesabımın oluşturulması ve benimle iletişime geçilmesi amacıyla kullanılmasını kabul ediyorum."
                : "I agree that Skyfleet may use these details to review my agency application, create my portal account and contact me about the partnership."}
            </span>

          </label>


          {state.message && (
            <div
              className={
                `agency-join-message ${state.status}`
              }
            >
              {state.message}
            </div>
          )}


          <button
            type="submit"
            className="agency-join-submit"
            disabled={
              state.status === "submitting"
            }
          >

            {state.status === "submitting"
              ? (
                tr
                  ? "Gönderiliyor..."
                  : "Submitting..."
              )
              : (
                tr
                  ? "Acenta Başvurusunu Gönder"
                  : "Submit Agency Application"
              )}

            <span>
              →
            </span>

          </button>


          <small className="agency-join-footnote">
            {tr
              ? "Başvurunuz onaylanana kadar portal hesabınız aktif olmayacaktır."
              : "Your portal account will remain inactive until your application is approved."}
          </small>

        </form>

      </section>

    </main>
  );
}


function Field({
  label,
  wide = false,
  children,
}) {
  return (
    <label
      className={
        wide
          ? "agency-join-field wide"
          : "agency-join-field"
      }
    >
      <span>
        {label}
      </span>

      {children}
    </label>
  );
}