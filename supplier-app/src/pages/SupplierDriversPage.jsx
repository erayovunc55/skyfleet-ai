import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignSupplierVehicleToDriver,
  createDriverPasswordResetLink,
  createSupplierDriver,
  deactivateSupplierDriver,
  getSupplierDrivers,
  getSupplierVehicles,
  updateSupplierDriver,
} from "../services/supplierService";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  password: "",
  vehicle_id: "",
  is_active: true,
};

export default function SupplierDriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingDriverId, setResettingDriverId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [driverData, vehicleData] = await Promise.all([
        getSupplierDrivers(),
        getSupplierVehicles(),
      ]);

      setDrivers(driverData);
      setVehicles(vehicleData);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Sürücü bilgileri yüklenemedi.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.is_active &&
          vehicle.operational_status === "active",
      ),
    [vehicles],
  );

  const summary = useMemo(
    () => ({
      total: drivers.length,
      active: drivers.filter((driver) => driver.is_active).length,
      assigned: drivers.filter((driver) => driver.vehicle_id).length,
      waiting: drivers.filter(
        (driver) => driver.is_active && !driver.vehicle_id,
      ).length,
    }),
    [drivers],
  );

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingDriver(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(driver) {
    setEditingDriver(driver);

    setForm({
      name: driver.name || "",
      phone: driver.phone || "",
      email: driver.email || "",
      password: "",
      vehicle_id: driver.vehicle_id
        ? String(driver.vehicle_id)
        : "",
      is_active: Boolean(driver.is_active),
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingDriver(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      vehicle_id: form.vehicle_id
        ? Number(form.vehicle_id)
        : null,
      is_active: form.is_active,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (editingDriver) {
        await updateSupplierDriver(editingDriver.id, payload);
        setMessage("Sürücü bilgileri güncellendi.");
      } else {
        if (!payload.password) {
          throw new Error(
            "Yeni sürücü için geçici şifre girmelisiniz.",
          );
        }

        await createSupplierDriver(payload);
        setMessage("Sürücü başarıyla oluşturuldu.");
      }

      closeForm();
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Sürücü kaydedilemedi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVehicleChange(driver, vehicleId) {
    setError("");
    setMessage("");

    try {
      await assignSupplierVehicleToDriver(
        driver.id,
        vehicleId ? Number(vehicleId) : null,
      );

      setMessage(
        vehicleId
          ? "Araç sürücüye atandı."
          : "Araç ataması kaldırıldı.",
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Araç ataması kaydedilemedi.",
        ),
      );
    }
  }

  async function handlePasswordReset(driver) {
    if (!driver.phone) {
      setError("Sürücünün WhatsApp için telefon numarası bulunmuyor.");
      return;
    }

    setResettingDriverId(driver.id);
    setError("");
    setMessage("");

    try {
      const data = await createDriverPasswordResetLink(driver.id);

      if (!data?.whatsapp_url) {
        throw new Error("WhatsApp bağlantısı oluşturulamadı.");
      }

      setMessage(
        `${driver.name} için 60 dakikalık şifre sıfırlama bağlantısı hazırlandı.`,
      );

      window.open(
        data.whatsapp_url,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Şifre sıfırlama bağlantısı oluşturulamadı.",
        ),
      );
    } finally {
      setResettingDriverId(null);
    }
  }

  async function handleDeactivate(driver) {
    const confirmed = window.confirm(
      `${driver.name} isimli sürücünün mobil erişimi kapatılsın mı?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deactivateSupplierDriver(driver.id);
      setMessage("Sürücü pasif duruma alındı.");
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Sürücü pasif duruma alınamadı.",
        ),
      );
    }
  }

  return (
    <main className="supplier-dashboard supplier-management-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">EKİP YÖNETİMİ</span>
          <h1>Sürücüler</h1>
          <p>
            Sürücü hesaplarını oluşturun, araçlarını belirleyin ve mobil
            erişimlerini yönetin.
          </p>
        </div>

        <div className="supplier-heading-actions">
          <button
            className="supplier-secondary-button"
            type="button"
            disabled={loading}
            onClick={loadData}
          >
            Yenile
          </button>

          <button
            className="supplier-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            + Yeni Sürücü
          </button>
        </div>
      </section>

      {error && (
        <div className="supplier-message error">{error}</div>
      )}

      {message && (
        <div className="supplier-message success">{message}</div>
      )}

      <section className="supplier-summary-grid supplier-management-summary">
        <SummaryCard label="Toplam Sürücü" value={summary.total} />
        <SummaryCard label="Aktif Sürücü" value={summary.active} />
        <SummaryCard label="Araç Atanmış" value={summary.assigned} />
        <SummaryCard label="Araç Bekleyen" value={summary.waiting} />
      </section>

      <section className="supplier-management-card">
        <div className="supplier-section-heading">
          <div>
            <h2>Sürücü Ekibi</h2>
            <p>{drivers.length} kayıt</p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            Sürücüler yükleniyor...
          </div>
        ) : drivers.length === 0 ? (
          <div className="supplier-empty-state">
            <strong>Henüz sürücü eklenmedi</strong>
            <p>İlk sürücü hesabınızı oluşturun.</p>
          </div>
        ) : (
          <div className="supplier-management-list">
            {drivers.map((driver) => (
              <article
                className="supplier-management-row supplier-driver-row"
                key={driver.id}
              >
                <div className="supplier-driver-identity">
                  <div className="supplier-management-avatar">
                    {getInitials(driver.name)}
                  </div>

                  <div>
                    <strong>{driver.name}</strong>
                    <span>ID #{driver.id}</span>
                  </div>
                </div>

                <div>
                  <span className="supplier-field-label">İletişim</span>
                  <strong>{driver.phone}</strong>
                  <small>{driver.email || "E-posta yok"}</small>
                </div>

                <div>
                  <span className="supplier-field-label">Durum</span>
                  <span
                    className={
                      driver.is_active
                        ? "supplier-driver-status active"
                        : "supplier-driver-status"
                    }
                  >
                    {driver.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <label className="supplier-driver-vehicle-select">
                  <span className="supplier-field-label">Araç ataması</span>
                  <select
                    value={driver.vehicle_id || ""}
                    disabled={!driver.is_active}
                    onChange={(event) =>
                      handleVehicleChange(driver, event.target.value)
                    }
                  >
                    <option value="">Araç atanmadı</option>
                    {activeVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} — {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="supplier-row-actions">
                  <button
                    className="supplier-row-button"
                    type="button"
                    onClick={() => openEditForm(driver)}
                  >
                    Düzenle
                  </button>

                  {driver.is_active && (
                    <button
                      className="supplier-row-button"
                      type="button"
                      disabled={resettingDriverId === driver.id}
                      onClick={() => handlePasswordReset(driver)}
                    >
                      {resettingDriverId === driver.id
                        ? "Hazırlanıyor..."
                        : "WhatsApp Şifre Sıfırla"}
                    </button>
                  )}

                  {driver.is_active && (
                    <button
                      className="supplier-row-button danger"
                      type="button"
                      onClick={() => handleDeactivate(driver)}
                    >
                      Pasif Yap
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="supplier-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="supplier-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={editingDriver ? "Sürücü düzenle" : "Yeni sürücü ekle"}
          >
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">SÜRÜCÜ HESABI</span>
                <h2>
                  {editingDriver ? "Sürücüyü Düzenle" : "Yeni Sürücü Ekle"}
                </h2>
                <p>
                  Sürücü bu bilgilerle mobil uygulamaya giriş yapacaktır.
                </p>
              </div>

              <button type="button" onClick={closeForm}>×</button>
            </div>

            <form
              className="supplier-management-form"
              onSubmit={handleSubmit}
            >
              <div className="supplier-form-grid">
                <FormField label="Ad Soyad">
                  <input
                    required
                    value={form.name}
                    placeholder="Sürücü adı soyadı"
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </FormField>

                <FormField label="Telefon">
                  <input
                    required
                    value={form.phone}
                    placeholder="+90 5XX XXX XX XX"
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                  />
                </FormField>

                <FormField label="E-posta">
                  <input
                    type="email"
                    value={form.email}
                    placeholder="surucu@firma.com"
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                  />
                </FormField>

                <FormField
                  label={
                    editingDriver
                      ? "Yeni şifre (isteğe bağlı)"
                      : "Geçici şifre"
                  }
                >
                  <input
                    type="password"
                    required={!editingDriver}
                    minLength="8"
                    value={form.password}
                    placeholder="En az 8 karakter"
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                  />
                </FormField>

                <FormField label="Araç">
                  <select
                    value={form.vehicle_id}
                    onChange={(event) =>
                      updateField("vehicle_id", event.target.value)
                    }
                  >
                    <option value="">Şimdilik araç atama</option>
                    {activeVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} — {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </FormField>

                <label className="supplier-checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateField("is_active", event.target.checked)
                    }
                  />
                  <span>Sürücü hesabı aktif olsun</span>
                </label>
              </div>

              <div className="supplier-driver-login-info">
                <strong>Mobil uygulama girişi</strong>
                <p>
                  Sürücü telefon numarası veya e-posta adresi ile
                  belirlediğiniz şifreyi kullanacaktır.
                </p>
              </div>

              <div className="supplier-modal-actions">
                <button
                  className="supplier-secondary-button"
                  type="button"
                  disabled={saving}
                  onClick={closeForm}
                >
                  Vazgeç
                </button>

                <button
                  className="supplier-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingDriver
                      ? "Değişiklikleri Kaydet"
                      : "Sürücüyü Kaydet"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="supplier-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FormField({ label, children }) {
  return (
    <label className="supplier-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function getInitials(name) {
  return String(name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getErrorMessage(error, fallback) {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors) {
    const firstError = Object.values(validationErrors)?.[0]?.[0];

    if (firstError) return firstError;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
