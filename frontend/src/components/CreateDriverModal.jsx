import {
  useState,
} from "react";

import {
  createDriver,
  updateDriver,
} from "../services/driverService";

export default function CreateDriverModal({
  driver = null,
  vehicles = [],
  onClose,
  onCreated,
  onSaved,
}) {
  const isEditing =
    Boolean(driver?.id);

  const [form, setForm] =
    useState(() => ({
      name: driver?.name || "",
      phone: driver?.phone || "",
      email: driver?.email || "",
      password: "",
      vehicle_id:
        driver?.vehicle_id ||
        driver?.vehicle?.id ||
        "",
      is_active:
        driver
          ? Boolean(driver.is_active)
          : true,
    }));

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const commonPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        is_active:
          form.is_active,
      };

      let savedDriver;

      if (isEditing) {
        savedDriver =
          await updateDriver(
            driver.id,
            {
              ...commonPayload,
              password:
                form.password ||
                null,
            },
          );
      } else {
        savedDriver =
          await createDriver({
            ...commonPayload,
            password:
              form.password,
            vehicle_id:
              form.vehicle_id
                ? Number(
                    form.vehicle_id,
                  )
                : null,
          });
      }

      if (onSaved) {
        await onSaved(
          savedDriver,
        );
      } else {
        await onCreated?.(
          savedDriver,
        );
      }
    } catch (requestError) {
      const errors =
        requestError?.response?.data
          ?.errors;

      const firstError =
        errors &&
        Object.values(errors)
          .flat()
          .find(Boolean);

      setError(
        firstError ||
          requestError?.response?.data
            ?.message ||
          requestError?.message ||
          "Sürücü kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="driver-modal-backdrop"
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
        className="driver-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-modal-title"
      >
        <header>
          <div>
            <span>
              {isEditing
                ? "SÜRÜCÜ KAYDI"
                : "YENİ KAYIT"}
            </span>

            <h2 id="driver-modal-title">
              {isEditing
                ? "Sürücüyü Düzenle"
                : "Yeni Sürücü Ekle"}
            </h2>

            <p>
              {isEditing
                ? "Sürücü bilgilerini ve hesap durumunu güncelleyin."
                : "Sürücü hesabı ve araç ataması oluşturun."}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            aria-label="Pencereyi kapat"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="driver-form-grid">
            <label>
              <span>Ad Soyad</span>

              <input
                required
                maxLength="255"
                value={form.name}
                placeholder="Sürücünün adı soyadı"
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Telefon</span>

              <input
                required
                maxLength="50"
                value={form.phone}
                placeholder="+90 5XX XXX XX XX"
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>E-posta</span>

              <input
                required
                type="email"
                maxLength="255"
                value={form.email}
                placeholder="surucu@example.com"
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>
                {isEditing
                  ? "Yeni Şifre (isteğe bağlı)"
                  : "Geçici Şifre"}
              </span>

              <input
                required={!isEditing}
                type="password"
                minLength="8"
                maxLength="255"
                value={form.password}
                placeholder={
                  isEditing
                    ? "Değişmeyecekse boş bırakın"
                    : "En az 8 karakter"
                }
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value,
                  )
                }
              />
            </label>

            {!isEditing && (
              <label className="driver-form-full">
                <span>Araç Ataması</span>

                <select
                  value={form.vehicle_id}
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "vehicle_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Şimdilik araç atama
                  </option>

                  {vehicles.map(
                    (vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                        disabled={
                          !vehicle.is_active ||
                          vehicle.operational_status ===
                            "inactive"
                        }
                      >
                        {getVehicleLabel(
                          vehicle,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}

            <label className="driver-active-field driver-form-full">
              <input
                type="checkbox"
                checked={form.is_active}
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "is_active",
                    event.target.checked,
                  )
                }
              />

              <span>
                Sürücü hesabı aktif olsun
              </span>
            </label>
          </div>

          {error && (
            <div className="drivers-message error">
              {error}
            </div>
          )}

          <footer>
            <button
              className="driver-modal-cancel"
              type="button"
              disabled={saving}
              onClick={onClose}
            >
              Vazgeç
            </button>

            <button
              className="driver-modal-save"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : isEditing
                  ? "Değişiklikleri Kaydet"
                  : "Sürücüyü Kaydet"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function getVehicleLabel(vehicle) {
  const plate =
    vehicle?.plate ||
    vehicle?.license_plate ||
    vehicle?.vehicle_plate ||
    "Plaka yok";

  const name = [
    vehicle?.brand,
    vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ");

  return name
    ? `${plate} — ${name}`
    : plate;
}