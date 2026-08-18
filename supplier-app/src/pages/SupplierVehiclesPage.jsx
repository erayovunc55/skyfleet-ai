import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changeSupplierVehicleStatus,
  createSupplierVehicle,
  getSupplierVehicles,
  updateSupplierVehicle,
} from "../services/supplierService";

const EMPTY_FORM = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  vehicle_type: "Minivan",
  color: "",
  passenger_capacity: "7",
  luggage_capacity: "7",
  insurance_expiry_date: "",
  inspection_expiry_date: "",
  operational_status: "active",
  note: "",
};

const STATUS_LABELS = {
  active: "Aktif",
  service: "Serviste",
  faulty: "Arızalı",
  inactive: "Pasif",
};

export default function SupplierVehiclesPage() {
  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingVehicle,
    setEditingVehicle,
  ] = useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const loadVehicles = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getSupplierVehicles();

        setVehicles(data);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Araçlar yüklenemedi.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const summary = useMemo(
    () => ({
      total: vehicles.length,

      active: vehicles.filter(
        (vehicle) =>
          vehicle.is_active &&
          vehicle.operational_status ===
            "active",
      ).length,

      service: vehicles.filter(
        (vehicle) =>
          vehicle.operational_status ===
          "service",
      ).length,

      unavailable: vehicles.filter(
        (vehicle) =>
          !vehicle.is_active ||
          [
            "faulty",
            "inactive",
          ].includes(
            vehicle.operational_status,
          ),
      ).length,
    }),
    [vehicles],
  );

  function updateField(
    name,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function openCreateForm() {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(vehicle) {
    setEditingVehicle(vehicle);

    setForm({
      plate:
        vehicle.plate || "",

      brand:
        vehicle.brand || "",

      model:
        vehicle.model || "",

      year:
        vehicle.year
          ? String(vehicle.year)
          : "",

      vehicle_type:
        vehicle.vehicle_type ||
        "Minivan",

      color:
        vehicle.color || "",

      passenger_capacity:
        String(
          vehicle.passenger_capacity ||
            1,
        ),

      luggage_capacity:
        String(
          vehicle.luggage_capacity ??
            0,
        ),

      insurance_expiry_date:
        formatInputDate(
          vehicle.insurance_expiry_date,
        ),

      inspection_expiry_date:
        formatInputDate(
          vehicle.inspection_expiry_date,
        ),

      operational_status:
        vehicle.operational_status ||
        "active",

      note:
        vehicle.note || "",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      plate:
        form.plate.trim(),

      brand:
        form.brand.trim(),

      model:
        form.model.trim(),

      year:
        form.year
          ? Number(form.year)
          : null,

      vehicle_type:
        form.vehicle_type,

      color:
        form.color.trim() ||
        null,

      passenger_capacity:
        Number(
          form.passenger_capacity,
        ),

      luggage_capacity:
        Number(
          form.luggage_capacity || 0,
        ),

      insurance_expiry_date:
        form.insurance_expiry_date ||
        null,

      inspection_expiry_date:
        form.inspection_expiry_date ||
        null,

      operational_status:
        form.operational_status,

      is_active:
        form.operational_status !==
        "inactive",

      note:
        form.note.trim() ||
        null,
    };

    try {
      if (editingVehicle) {
        await updateSupplierVehicle(
          editingVehicle.id,
          payload,
        );

        setMessage(
          "Araç bilgileri güncellendi.",
        );
      } else {
        await createSupplierVehicle(
          payload,
        );

        setMessage(
          "Araç başarıyla oluşturuldu.",
        );
      }

      closeForm();
      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Araç kaydedilemedi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    vehicle,
    status,
  ) {
    setError("");
    setMessage("");

    try {
      await changeSupplierVehicleStatus(
        vehicle.id,
        status,
      );

      setMessage(
        "Araç durumu güncellendi.",
      );

      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Araç durumu güncellenemedi.",
        ),
      );
    }
  }

  return (
    <main className="supplier-dashboard supplier-management-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">
            FİLO YÖNETİMİ
          </span>

          <h1>Araçlar</h1>

          <p>
            Operasyonlarda kullanacağınız
            araçları ekleyin ve yönetin.
          </p>
        </div>

        <div className="supplier-heading-actions">
          <button
            className="supplier-secondary-button"
            type="button"
            disabled={loading}
            onClick={loadVehicles}
          >
            Yenile
          </button>

          <button
            className="supplier-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            + Yeni Araç
          </button>
        </div>
      </section>

      {error && (
        <div className="supplier-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="supplier-message success">
          {message}
        </div>
      )}

      <section className="supplier-summary-grid supplier-management-summary">
        <SummaryCard
          label="Toplam Araç"
          value={summary.total}
        />

        <SummaryCard
          label="Aktif Araç"
          value={summary.active}
        />

        <SummaryCard
          label="Serviste"
          value={summary.service}
        />

        <SummaryCard
          label="Kullanılamaz"
          value={summary.unavailable}
        />
      </section>

      <section className="supplier-management-card">
        <div className="supplier-section-heading">
          <div>
            <h2>Araç Filosu</h2>

            <p>
              {vehicles.length} kayıt
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            Araçlar yükleniyor...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="supplier-empty-state">
            <strong>
              Henüz araç eklenmedi
            </strong>

            <p>
              İlk aracınızı ekleyerek
              filonuzu oluşturmaya
              başlayın.
            </p>
          </div>
        ) : (
          <div className="supplier-management-list">
            {vehicles.map(
              (vehicle) => (
                <article
                  className="supplier-management-row"
                  key={vehicle.id}
                >
                  <div className="supplier-vehicle-identity">
                    <div className="supplier-management-avatar">
                      🚐
                    </div>

                    <div>
                      <strong>
                        {vehicle.plate}
                      </strong>

                      <span>
                        {vehicle.brand}
                        {" "}
                        {vehicle.model}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="supplier-field-label">
                      Araç tipi
                    </span>

                    <strong>
                      {vehicle.vehicle_type}
                    </strong>
                  </div>

                  <div>
                    <span className="supplier-field-label">
                      Kapasite
                    </span>

                    <strong>
                      {vehicle.passenger_capacity}
                      {" yolcu / "}
                      {vehicle.luggage_capacity}
                      {" bagaj"}
                    </strong>
                  </div>

                  <div>
                    <span className="supplier-field-label">
                      Sürücü
                    </span>

                    <strong>
                      {vehicle.driver?.name ||
                        "Atanmadı"}
                    </strong>
                  </div>

                  <label className="supplier-status-select">
                    <span className="supplier-field-label">
                      Durum
                    </span>

                    <select
                      value={
                        vehicle.operational_status
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          vehicle,
                          event.target.value,
                        )
                      }
                    >
                      {Object.entries(
                        STATUS_LABELS,
                      ).map(
                        ([
                          value,
                          label,
                        ]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <button
                    className="supplier-row-button"
                    type="button"
                    onClick={() =>
                      openEditForm(vehicle)
                    }
                  >
                    Düzenle
                  </button>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="supplier-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <section
            className="supplier-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingVehicle
                ? "Araç düzenle"
                : "Yeni araç ekle"
            }
          >
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">
                  FİLO KAYDI
                </span>

                <h2>
                  {editingVehicle
                    ? "Aracı Düzenle"
                    : "Yeni Araç Ekle"}
                </h2>
              </div>

              <button
                type="button"
                onClickClick={closeForm}
              >
                ×
              </button>
            </div>

            <form
              className="supplier-management-form"
              onSubmit={handleSubmit}
            >
              <div className="supplier-form-grid">
                <FormField label="Plaka">
                  <input
                    required
                    value={form.plate}
                    placeholder="34 ABC 123"
                    onChange={(event) =>
                      updateField(
                        "plate",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Marka">
                  <input
                    required
                    value={form.brand}
                    placeholder="Mercedes-Benz"
                    onChange={(event) =>
                      updateField(
                        "brand",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Model">
                  <input
                    required
                    value={form.model}
                    placeholder="Vito"
                    onChange={(event) =>
                      updateField(
                        "model",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Model yılı">
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={form.year}
                    placeholder="2024"
                    onChange={(event) =>
                      updateField(
                        "year",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Araç tipi">
                  <select
                    value={
                      form.vehicle_type
                    }
                    onChange={(event) =>
                      updateField(
                        "vehicle_type",
                        event.target.value,
                      )
                    }
                  >
                    <option value="Sedan">
                      Sedan
                    </option>

                    <option value="Minivan">
                      Minivan
                    </option>

                    <option value="Minibus">
                      Minibüs
                    </option>

                    <option value="Bus">
                      Otobüs
                    </option>

                    <option value="VIP">
                      VIP
                    </option>
                  </select>
                </FormField>

                <FormField label="Renk">
                  <input
                    value={form.color}
                    placeholder="Siyah"
                    onChange={(event) =>
                      updateField(
                        "color",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Yolcu kapasitesi">
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={
                      form.passenger_capacity
                    }
                    onChange={(event) =>
                      updateField(
                        "passenger_capacity",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Bagaj kapasitesi">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.luggage_capacity
                    }
                    onChange={(event) =>
                      updateField(
                        "luggage_capacity",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Sigorta bitiş tarihi">
                  <input
                    type="date"
                    value={
                      form.insurance_expiry_date
                    }
                    onChange={(event) =>
                      updateField(
                        "insurance_expiry_date",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Muayene bitiş tarihi">
                  <input
                    type="date"
                    value={
                      form.inspection_expiry_date
                    }
                    onChange={(event) =>
                      updateField(
                        "inspection_expiry_date",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label="Operasyon durumu">
                  <select
                    value={
                      form.operational_status
                    }
                    onChange={(event) =>
                      updateField(
                        "operational_status",
                        event.target.value,
                      )
                    }
                  >
                    {Object.entries(
                      STATUS_LABELS,
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>
              </div>

              <FormField label="Not">
                <textarea
                  rows="3"
                  value={form.note}
                  placeholder="Araç hakkında operasyon notu..."
                  onChange={(event) =>
                    updateField(
                      "note",
                      event.target.value,
                    )
                  }
                />
              </FormField>

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
                    : editingVehicle
                      ? "Değişiklikleri Kaydet"
                      : "Aracı Kaydet"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <article className="supplier-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <label className="supplier-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatInputDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(
    0,
    10,
  );
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response?.data?.errors;

  if (validationErrors) {
    const firstError =
      Object.values(
        validationErrors,
      )?.[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}