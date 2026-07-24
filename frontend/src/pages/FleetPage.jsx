import { useEffect, useMemo, useState } from "react";

import VehicleCard from "../components/VehicleCard";

import {
  assignVehicleToDriver,
  getDrivers,
} from "../services/driverService";

import {
  changeVehicleStatus,
  createVehicle,
  getVehicles,
  uploadVehiclePhoto,
} from "../services/vehicleService";

const initialForm = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  vehicle_type: "Minivan",
  color: "",
  passenger_capacity: 7,
  luggage_capacity: 6,
  current_mileage: 0,
  insurance_expiry_date: "",
  note: "",
};

export default function FleetPage({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [updatingVehicleId, setUpdatingVehicleId] =
    useState(null);

  const [uploadingVehicleId, setUploadingVehicleId] =
    useState(null);

  const [assigningVehicleId, setAssigningVehicleId] =
    useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [vehicleData, driverData] =
        await Promise.all([
          getVehicles(),
          getDrivers(),
        ]);

      setVehicles(
        Array.isArray(vehicleData)
          ? vehicleData
          : [],
      );

      setDrivers(
        Array.isArray(driverData)
          ? driverData
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Filo bilgileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVehicles() {
    const data = await getVehicles();

    setVehicles(
      Array.isArray(data) ? data : [],
    );
  }

  async function loadDrivers() {
    const data = await getDrivers();

    setDrivers(
      Array.isArray(data) ? data : [],
    );
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedPhoto(null);

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoPreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Araç fotoğrafı en fazla 5 MB olabilir.",
      );

      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setError("");
    setSelectedPhoto(file);
    setPhotoPreview(
      URL.createObjectURL(file),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await createVehicle({
        plate: form.plate,
        brand: form.brand,
        model: form.model,

        year: form.year
          ? Number(form.year)
          : null,

        vehicle_type: form.vehicle_type,
        color: form.color || null,

        passenger_capacity: Number(
          form.passenger_capacity,
        ),

        luggage_capacity: Number(
          form.luggage_capacity,
        ),

        current_mileage: Number(
          form.current_mileage,
        ),

        insurance_expiry_date:
          form.insurance_expiry_date || null,

        note: form.note || null,

        operational_status: "active",
      });

      const createdVehicle = response.data;

      const hadSelectedPhoto = Boolean(
        selectedPhoto,
      );

      if (selectedPhoto && createdVehicle?.id) {
        await uploadVehiclePhoto(
          createdVehicle.id,
          selectedPhoto,
        );
      }

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setForm(initialForm);
      setSelectedPhoto(null);
      setPhotoPreview("");

      setSuccessMessage(
        hadSelectedPhoto
          ? "Araç ve fotoğraf başarıyla eklendi."
          : "Araç başarıyla eklendi.",
      );

      await loadVehicles();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Araç eklenemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleExistingPhotoUpload(
    vehicle,
    photoFile,
  ) {
    if (!photoFile) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(photoFile.type)) {
      setError(
        "Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.",
      );
      return;
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      setError(
        "Araç fotoğrafı en fazla 5 MB olabilir.",
      );
      return;
    }

    setUploadingVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await uploadVehiclePhoto(
        vehicle.id,
        photoFile,
      );

      const updatedVehicle =
        response.data?.vehicle;

      if (updatedVehicle) {
        setVehicles((currentVehicles) =>
          currentVehicles.map(
            (currentVehicle) =>
              currentVehicle.id === vehicle.id
                ? updatedVehicle
                : currentVehicle,
          ),
        );
      } else {
        await loadVehicles();
      }

      setSuccessMessage(
        `${vehicle.plate} araç fotoğrafı güncellendi.`,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Araç fotoğrafı yüklenemedi.",
      );
    } finally {
      setUploadingVehicleId(null);
    }
  }

  async function handleStatusChange(
    vehicle,
    operationalStatus,
  ) {
    setUpdatingVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await changeVehicleStatus(
          vehicle.id,
          operationalStatus,
        );

      const updatedVehicle = response.data;

      setVehicles((currentVehicles) =>
        currentVehicles.map(
          (currentVehicle) =>
            currentVehicle.id === vehicle.id
              ? updatedVehicle
              : currentVehicle,
        ),
      );

      setSuccessMessage(
        `${vehicle.plate} araç durumu ${getOperationalStatusLabel(
          operationalStatus,
        ).toLowerCase()} olarak güncellendi.`,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Araç durumu güncellenemedi.",
      );
    } finally {
      setUpdatingVehicleId(null);
    }
  }

  async function handleDriverAssign(
    vehicle,
    driverId,
  ) {
    setAssigningVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");

    try {
      const currentlyAssignedDriver =
        drivers.find(
          (driver) =>
            Number(driver.vehicle_id) ===
            Number(vehicle.id),
        );

      if (
        currentlyAssignedDriver &&
        currentlyAssignedDriver.id !== driverId
      ) {
        await assignVehicleToDriver(
          currentlyAssignedDriver.id,
          null,
        );
      }

      if (driverId) {
        const driverWithAnotherVehicle =
          drivers.find(
            (driver) =>
              driver.id === driverId &&
              driver.vehicle_id &&
              Number(driver.vehicle_id) !==
                Number(vehicle.id),
          );

        if (driverWithAnotherVehicle) {
          await assignVehicleToDriver(
            driverWithAnotherVehicle.id,
            null,
          );
        }

        await assignVehicleToDriver(
          driverId,
          vehicle.id,
        );
      }

      await loadDrivers();

      setSuccessMessage(
        driverId
          ? `${vehicle.plate} aracına sürücü atandı.`
          : `${vehicle.plate} aracındaki sürücü kaldırıldı.`,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Sürücü ataması yapılamadı.",
      );
    } finally {
      setAssigningVehicleId(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: vehicles.length,

      active: vehicles.filter(
        (vehicle) =>
          getVehicleOperationalStatus(vehicle) ===
          "active",
      ).length,

      inactive: vehicles.filter(
        (vehicle) =>
          getVehicleOperationalStatus(vehicle) ===
          "inactive",
      ).length,
    };
  }, [vehicles]);

  return (
    <main className="fleet-page">
      <header className="fleet-header">
        <div>
          <p>SKYFLEET AI</p>
          <h1>Filo Yönetimi</h1>
        </div>

        <button
          type="button"
          onClick={onBack}
        >
          Dispatcher&apos;a Dön
        </button>
      </header>

      <section className="fleet-stats">
        <article>
          <span>Toplam Araç</span>
          <strong>{stats.total}</strong>
        </article>

        <article>
          <span>Aktif</span>
          <strong>{stats.active}</strong>
        </article>

        <article>
          <span>Pasif</span>
          <strong>{stats.inactive}</strong>
        </article>
      </section>

      <section className="fleet-layout">
        <form
          className="vehicle-form"
          onSubmit={handleSubmit}
        >
          <div className="fleet-section-heading">
            <div>
              <p>YENİ KAYIT</p>
              <h2>Araç Ekle</h2>
            </div>
          </div>

          <div className="vehicle-photo-uploader">
            <div className="vehicle-photo-preview">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Araç fotoğrafı önizlemesi"
                />
              ) : (
                <div className="vehicle-photo-placeholder">
                  <span>🚐</span>
                  <small>
                    Araç fotoğrafı seçilmedi
                  </small>
                </div>
              )}
            </div>

            <label className="vehicle-photo-input">
              Araç Fotoğrafı

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />

              <small>
                JPG, PNG veya WEBP — en fazla 5 MB
              </small>
            </label>
          </div>

          <div className="vehicle-form-grid">
            <label>
              Plaka
              <input
                name="plate"
                value={form.plate}
                onChange={handleInputChange}
                placeholder="34 NS 8526"
                required
              />
            </label>

            <label>
              Marka
              <input
                name="brand"
                value={form.brand}
                onChange={handleInputChange}
                placeholder="Mercedes-Benz"
                required
              />
            </label>

            <label>
              Model
              <input
                name="model"
                value={form.model}
                onChange={handleInputChange}
                placeholder="Vito 114 CDI"
                required
              />
            </label>

            <label>
              Model Yılı
              <input
                name="year"
                type="number"
                min="1950"
                value={form.year}
                onChange={handleInputChange}
                placeholder="2016"
              />
            </label>

            <label>
              Araç Türü
              <select
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={handleInputChange}
              >
                <option value="Minivan">
                  Minivan
                </option>
                <option value="Sedan">
                  Sedan
                </option>
                <option value="Business Sedan">
                  Business Sedan
                </option>
                <option value="Luxury Sedan">
                  Luxury Sedan
                </option>
                <option value="Van">
                  Van
                </option>
                <option value="Minibus">
                  Minibus
                </option>
                <option value="Bus">
                  Bus
                </option>
              </select>
            </label>

            <label>
              Renk
              <input
                name="color"
                value={form.color}
                onChange={handleInputChange}
                placeholder="Siyah"
              />
            </label>

            <label>
              Yolcu Kapasitesi
              <input
                name="passenger_capacity"
                type="number"
                min="1"
                max="100"
                value={
                  form.passenger_capacity
                }
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Bagaj Kapasitesi
              <input
                name="luggage_capacity"
                type="number"
                min="0"
                max="100"
                value={
                  form.luggage_capacity
                }
                onChange={handleInputChange}
              />
            </label>

            <label>
              Güncel Kilometre
              <input
                name="current_mileage"
                type="number"
                min="0"
                value={form.current_mileage}
                onChange={handleInputChange}
              />
            </label>

            <label>
              Sigorta Bitiş
              <input
                name="insurance_expiry_date"
                type="date"
                value={
                  form.insurance_expiry_date
                }
                onChange={handleInputChange}
              />
            </label>
          </div>

          <label className="vehicle-note-field">
            Not
            <textarea
              name="note"
              value={form.note}
              onChange={handleInputChange}
              rows="4"
              placeholder="Araçla ilgili notlar..."
            />
          </label>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="fleet-success">
              {successMessage}
            </div>
          )}

          <button
            className="vehicle-submit-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Kaydediliyor..."
              : "Aracı Kaydet"}
          </button>
        </form>

        <section className="vehicle-list-panel">
          <div className="fleet-section-heading">
            <div>
              <p>ARAÇLAR</p>
              <h2>Filo Listesi</h2>
            </div>

            <span>
              {vehicles.length} araç
            </span>
          </div>

          {loading && (
            <p className="dashboard-message">
              Filo bilgileri yükleniyor...
            </p>
          )}

          {!loading &&
            vehicles.length === 0 && (
              <p className="dashboard-message">
                Henüz araç eklenmedi.
              </p>
            )}

          <div className="vehicle-list">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                drivers={drivers}
                updatingVehicleId={
                  updatingVehicleId
                }
                uploadingVehicleId={
                  uploadingVehicleId
                }
                assigningVehicleId={
                  assigningVehicleId
                }
                onStatusChange={
                  handleStatusChange
                }
                onPhotoUpload={
                  handleExistingPhotoUpload
                }
                onDriverAssign={
                  handleDriverAssign
                }
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function getOperationalStatusLabel(status) {
  const labels = {
    active: "Aktif",
    service: "Serviste",
    faulty: "Arızalı",
    inactive: "Pasif",
  };

  return labels[status] || "Aktif";
}

function getVehicleOperationalStatus(vehicle) {
  if (vehicle?.operational_status) {
    return vehicle.operational_status;
  }

  return vehicle?.is_active
    ? "active"
    : "inactive";
}