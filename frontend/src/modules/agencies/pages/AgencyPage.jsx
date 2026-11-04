import { useEffect, useMemo, useState } from "react";

import agencyService from "../services/agencyService";
import "../../../styles/modules/agencies.css";

const CURRENCIES = ["EUR", "USD", "GBP", "TRY"];

const EMPTY_FORM = {
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
  discount_percent: 10,
  notes: "",
};

export default function AgencyPage() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");

  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [selectedAgencyDetail, setSelectedAgencyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);

  async function loadAgencies() {
    setLoading(true);
    setError("");

    try {
      const data = await agencyService.getAgencies();
      setAgencies(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Acentalar yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgencies();
  }, []);

  const statistics = useMemo(() => {
    const total = agencies.length;
    const active = agencies.filter((agency) => Boolean(agency.is_active)).length;
    const inactive = total - active;
    const transfers = agencies.reduce(
      (sum, agency) => sum + Number(agency.transfers_count || 0),
      0,
    );

    return { total, active, inactive, transfers };
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return agencies.filter((agency) => {
      if (
        statusFilter === "active" &&
        !agency.is_active
      ) {
        return false;
      }

      if (
        statusFilter === "inactive" &&
        agency.is_active
      ) {
        return false;
      }

      if (
        currencyFilter !== "all" &&
        String(agency.default_currency || "").toUpperCase() !== currencyFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        agency.company_name,
        agency.legal_name,
        agency.email,
        agency.phone,
        agency.city,
        agency.country_name,
        agency.country_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(query);
    });
  }, [agencies, search, statusFilter, currencyFilter]);

  async function openAgency(agencyId) {
    setSelectedAgencyId(agencyId);
    setDetailLoading(true);
    setSelectedAgencyDetail(null);
    setError("");

    try {
      const detail = await agencyService.getAgency(agencyId);
      setSelectedAgencyDetail(detail);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Acenta detayı yüklenemedi.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleAgency(agency) {
    setError("");

    try {
      await agencyService.toggleAgencyStatus(agency.id);
      setSuccess(
        agency.is_active
          ? "Acenta pasife alındı."
          : "Acenta tekrar aktifleştirildi.",
      );

      await loadAgencies();

      if (selectedAgencyId === agency.id) {
        await openAgency(agency.id);
      }

      window.setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Acenta durumu değiştirilemedi.",
      );
    }
  }

  function startEdit(agency) {
    setEditingAgency(agency);
  }

  async function handleSaved(message) {
    setShowCreateModal(false);
    setEditingAgency(null);
    setSuccess(message);
    await loadAgencies();
    window.setTimeout(() => setSuccess(""), 4000);
  }

  return (
    <main className="agency-page agency-control-center">
      <header className="agency-page-header">
        <div>
          <small>AGENCY OPERATIONS</small>
          <h1>Agency Control Center</h1>
          <span>
            B2B acenta ağını, özel indirim oranlarını, kullanıcı hesaplarını ve
            rezervasyon hacmini tek ekrandan yönetin.
          </span>
        </div>

        <div className="agency-page-actions">
          <button
            type="button"
            className="agency-secondary-button"
            onClick={loadAgencies}
            disabled={loading}
          >
            ↻ {loading ? "Yükleniyor..." : "Yenile"}
          </button>

          <button
            type="button"
            className="agency-primary-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Yeni Acenta
          </button>
        </div>
      </header>

      <section className="agency-kpi-grid">
        <AgencyKpi
          icon="◆"
          label="Toplam Acenta"
          value={statistics.total}
          tone="blue"
        />
        <AgencyKpi
          icon="✓"
          label="Aktif Acenta"
          value={statistics.active}
          tone="green"
        />
        <AgencyKpi
          icon="○"
          label="Pasif Acenta"
          value={statistics.inactive}
          tone="orange"
        />
        <AgencyKpi
          icon="↗"
          label="Toplam Rezervasyon"
          value={statistics.transfers}
          tone="cyan"
        />
      </section>

      {success && <div className="agency-page-success">{success}</div>}
      {error && <div className="agency-page-error">{error}</div>}

      <section className="agency-table-panel">
        <div className="agency-table-heading">
          <div>
            <small>AGENCY NETWORK</small>
            <h2>Acentalar</h2>
          </div>

          <strong>{filteredAgencies.length}</strong>
        </div>

        <div className="agency-filter-bar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Şirket, e-posta, telefon, şehir veya ülke ara..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          <select
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
          >
            <option value="all">Tüm para birimleri</option>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="agency-table-state">Acentalar yükleniyor...</div>
        ) : filteredAgencies.length === 0 ? (
          <div className="agency-table-state">
            Filtrelere uyan acenta bulunamadı.
          </div>
        ) : (
          <div className="agency-table-wrap">
            <table className="agency-control-table">
              <thead>
                <tr>
                  <th>Acenta</th>
                  <th>Konum</th>
                  <th>İletişim</th>
                  <th>Rezervasyon</th>
                  <th>Kullanıcı</th>
                  <th>Para Birimi</th>
                  <th>İndirim</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgencies.map((agency) => (
                  <tr key={agency.id}>
                    <td>
                      <div className="agency-company-cell">
                        <span className="agency-avatar">
                          {getInitials(agency.company_name)}
                        </span>

                        <div>
                          <strong>{agency.company_name}</strong>
                          <small>{agency.legal_name || `ID #${agency.id}`}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{formatLocation(agency)}</strong>
                    </td>

                    <td>
                      <div className="agency-contact-cell">
                        <strong>{agency.email || "E-posta belirtilmedi"}</strong>
                        <small>{agency.phone || "Telefon belirtilmedi"}</small>
                      </div>
                    </td>

                    <td>
                      <span className="agency-number-cell">
                        {Number(agency.transfers_count || 0)}
                      </span>
                    </td>

                    <td>
                      <span className="agency-number-cell">
                        {Number(agency.users_count || 0)}
                      </span>
                    </td>

                    <td>
                      <strong className="agency-currency-cell">
                        {agency.default_currency || "EUR"}
                      </strong>
                    </td>

                    <td>
                      <span className="agency-discount-badge">
                        %{formatDiscount(agency.discount_percent)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`agency-status-badge ${
                          agency.is_active ? "is-active" : "is-inactive"
                        }`}
                      >
                        <span className="agency-status-dot" />
                        {agency.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>

                    <td>
                      <div className="agency-row-actions">
                        <button
                          type="button"
                          className="agency-detail-button"
                          onClick={() => openAgency(agency.id)}
                        >
                          Detay
                        </button>

                        <button
                          type="button"
                          className="agency-detail-button"
                          onClick={() => startEdit(agency)}
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          className={`agency-detail-button ${
                            agency.is_active ? "danger" : "success"
                          }`}
                          onClick={() => toggleAgency(agency)}
                        >
                          {agency.is_active ? "Pasife Al" : "Aktifleştir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAgencyId && (
        <AgencyDrawer
          loading={detailLoading}
          detail={selectedAgencyDetail}
          onClose={() => {
            setSelectedAgencyId(null);
            setSelectedAgencyDetail(null);
          }}
          onEdit={(agency) => startEdit(agency)}
          onUserCreated={async () => {
            await openAgency(selectedAgencyId);
            await loadAgencies();
          }}
        />
      )}

      {showCreateModal && (
        <AgencyModal
          title="Yeni Acenta Oluştur"
          submitLabel="Acentayı Oluştur"
          initialValues={EMPTY_FORM}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (payload) => {
            await agencyService.createAgency(payload);
            await handleSaved("Acenta başarıyla oluşturuldu.");
          }}
        />
      )}

      {editingAgency && (
        <AgencyModal
          title="Acentayı Düzenle"
          submitLabel="Değişiklikleri Kaydet"
          initialValues={{
            ...EMPTY_FORM,
            ...editingAgency,
          }}
          onClose={() => setEditingAgency(null)}
          onSubmit={async (payload) => {
            await agencyService.updateAgency(editingAgency.id, payload);
            await handleSaved("Acenta başarıyla güncellendi.");
          }}
        />
      )}
    </main>
  );
}

function AgencyKpi({ icon, label, value, tone }) {
  return (
    <article className={`agency-kpi agency-kpi-${tone}`}>
      <span>{icon}</span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function AgencyDrawer({
  loading,
  detail,
  onClose,
  onEdit,
  onUserCreated,
}) {
  const agency = detail?.agency;
  const transfers = Array.isArray(detail?.transfers) ? detail.transfers : [];
  const [showUserForm, setShowUserForm] = useState(false);

  return (
    <div className="agency-drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="agency-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="agency-drawer-header">
          <div>
            <small>AGENCY PROFILE</small>
            <h2>{agency?.company_name || "Acenta Detayı"}</h2>
          </div>

          <button type="button" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        {loading ? (
          <div className="agency-drawer-state">Acenta detayı yükleniyor...</div>
        ) : !agency ? (
          <div className="agency-drawer-state">Acenta detayı bulunamadı.</div>
        ) : (
          <div className="agency-drawer-content">
            <section className="agency-profile-hero">
              <span className="agency-profile-avatar">
                {getInitials(agency.company_name)}
              </span>

              <div>
                <h3>{agency.company_name}</h3>
                <p>{agency.legal_name || "Ticari unvan belirtilmedi."}</p>

                <span
                  className={`agency-status-badge ${
                    agency.is_active ? "is-active" : "is-inactive"
                  }`}
                >
                  <span className="agency-status-dot" />
                  {agency.is_active ? "Operasyona Açık" : "Operasyona Kapalı"}
                </span>
              </div>
            </section>

            <section className="agency-detail-grid">
              <DetailItem label="E-posta" value={agency.email || "—"} />
              <DetailItem label="Telefon" value={agency.phone || "—"} />
              <DetailItem label="Şehir" value={agency.city || "—"} />
              <DetailItem
                label="Ülke"
                value={agency.country_name || agency.country_code || "—"}
              />
              <DetailItem
                label="Para Birimi"
                value={agency.default_currency || "EUR"}
              />
              <DetailItem
                label="İndirim"
                value={`%${formatDiscount(agency.discount_percent)}`}
              />
              <DetailItem label="Vergi No" value={agency.tax_number || "—"} />
              <DetailItem
                label="Kayıt No"
                value={agency.registration_number || "—"}
              />
            </section>

            <div className="agency-drawer-actions">
              <button type="button" onClick={() => onEdit(agency)}>
                Acentayı Düzenle
              </button>

              <button
                type="button"
                className="primary"
                onClick={() => setShowUserForm((current) => !current)}
              >
                + Portal Kullanıcısı
              </button>
            </div>

            {showUserForm && (
              <AgencyUserForm
                agencyId={agency.id}
                onCreated={async () => {
                  setShowUserForm(false);
                  await onUserCreated();
                }}
              />
            )}

            <section className="agency-recent-transfers">
              <div className="agency-section-heading">
                <div>
                  <small>RECENT BOOKINGS</small>
                  <h3>Son Rezervasyonlar</h3>
                </div>

                <strong>{transfers.length}</strong>
              </div>

              {transfers.length === 0 ? (
                <div className="agency-empty-block">
                  Bu acentaya ait transfer bulunmuyor.
                </div>
              ) : (
                <div className="agency-transfer-list">
                  {transfers.slice(0, 8).map((transfer) => (
                    <article key={transfer.id}>
                      <div>
                        <strong>
                          {transfer.booking_reference || `Transfer #${transfer.id}`}
                        </strong>
                        <small>
                          {transfer.passenger_name || "Yolcu"} ·{" "}
                          {transfer.vehicle_type || "Araç tipi yok"}
                        </small>
                      </div>

                      <div>
                        <strong>
                          {formatMoney(transfer.price, transfer.currency)}
                        </strong>
                        <small>{transfer.status || "pending"}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

function AgencyModal({
  title,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit({
        company_name: form.company_name,
        legal_name: form.legal_name || null,
        email: form.email || null,
        phone: form.phone || null,
        website: form.website || null,
        country_code: form.country_code
          ? String(form.country_code).toUpperCase()
          : null,
        country_name: form.country_name || null,
        city: form.city || null,
        tax_number: form.tax_number || null,
        registration_number: form.registration_number || null,
        default_currency: form.default_currency || "EUR",
        discount_percent: Number(form.discount_percent || 0),
        is_active: form.is_active ?? true,
        status: form.status || "active",
        notes: form.notes || null,
      });
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      const firstValidation = validation
        ? Object.values(validation).flat()[0]
        : null;

      setError(
        firstValidation ||
          requestError.response?.data?.message ||
          requestError.message ||
          "İşlem tamamlanamadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="agency-modal-backdrop" onMouseDown={onClose}>
      <form
        className="agency-modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>AGENCY MANAGEMENT</small>
            <h2>{title}</h2>
          </div>

          <button type="button" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        {error && <div className="agency-page-error">{error}</div>}

        <div className="agency-form-grid">
          <AgencyField label="Şirket Adı" wide>
            <input
              value={form.company_name}
              onChange={(event) => update("company_name", event.target.value)}
              required
            />
          </AgencyField>

          <AgencyField label="Ticari Unvan" wide>
            <input
              value={form.legal_name || ""}
              onChange={(event) => update("legal_name", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="E-posta">
            <input
              type="email"
              value={form.email || ""}
              onChange={(event) => update("email", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Telefon">
            <input
              value={form.phone || ""}
              onChange={(event) => update("phone", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Ülke">
            <input
              value={form.country_name || ""}
              onChange={(event) => update("country_name", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Ülke Kodu">
            <input
              maxLength={2}
              value={form.country_code || ""}
              onChange={(event) => update("country_code", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Şehir">
            <input
              value={form.city || ""}
              onChange={(event) => update("city", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Para Birimi">
            <select
              value={form.default_currency || "EUR"}
              onChange={(event) =>
                update("default_currency", event.target.value)
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </AgencyField>

          <AgencyField label="Acenta İndirimi (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.discount_percent ?? 10}
              onChange={(event) =>
                update("discount_percent", event.target.value)
              }
            />
          </AgencyField>

          <AgencyField label="Vergi No">
            <input
              value={form.tax_number || ""}
              onChange={(event) => update("tax_number", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Web Sitesi" wide>
            <input
              value={form.website || ""}
              onChange={(event) => update("website", event.target.value)}
            />
          </AgencyField>

          <AgencyField label="Not" wide>
            <textarea
              rows="4"
              value={form.notes || ""}
              onChange={(event) => update("notes", event.target.value)}
            />
          </AgencyField>
        </div>

        <footer>
          <button type="button" onClick={onClose}>
            Vazgeç
          </button>

          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Kaydediliyor..." : submitLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}

function AgencyUserForm({ agencyId, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await agencyService.createAgencyUser(agencyId, {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
      });

      await onCreated();
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      const firstValidation = validation
        ? Object.values(validation).flat()[0]
        : null;

      setError(
        firstValidation ||
          requestError.response?.data?.message ||
          "Kullanıcı oluşturulamadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="agency-user-form" onSubmit={submit}>
      <div className="agency-section-heading">
        <div>
          <small>PORTAL ACCESS</small>
          <h3>Yeni Portal Kullanıcısı</h3>
        </div>
      </div>

      {error && <div className="agency-page-error">{error}</div>}

      <div className="agency-user-grid">
        <input
          placeholder="Ad Soyad"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          required
        />

        <input
          type="email"
          placeholder="E-posta"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          required
        />

        <input
          placeholder="Telefon"
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
        />

        <input
          type="password"
          placeholder="Geçici şifre"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          minLength={8}
          required
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Oluşturuluyor..." : "Portal Kullanıcısını Oluştur"}
      </button>
    </form>
  );
}

function AgencyField({ label, wide = false, children }) {
  return (
    <label className={wide ? "agency-field agency-field-wide" : "agency-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getInitials(value) {
  return String(value || "AG")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLocation(agency) {
  const parts = [
    agency.city,
    agency.country_name || agency.country_code,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Konum belirtilmedi";
}

function formatDiscount(value) {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) ? numeric : numeric.toFixed(2);
}

function formatMoney(value, currency) {
  const numeric = Number(value || 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: String(currency || "EUR").toUpperCase(),
    maximumFractionDigits: 2,
  }).format(numeric);
}
