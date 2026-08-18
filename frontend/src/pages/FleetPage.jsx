import { useEffect, useMemo, useState } from "react";

import VehicleCard from "../components/VehicleCard";
import { useLanguage } from "../i18n";

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

const TEXT = {
  tr: {
    eyebrow: "FİLO OPERASYONU",
    title: "Filo Kontrol Merkezi",
    subtitle: "Araç kapasitesi, sürücü atamaları ve uygunluk durumunu tek ekrandan yönetin.",
    back: "Dispatcher'a Dön",
    refresh: "Yenile",
    total: "Toplam Araç",
    active: "Operasyona Hazır",
    service: "Servis / Arıza",
    unassigned: "Sürücüsüz",
    insuranceRisk: "Sigorta Riski",
    newRecord: "YENİ ARAÇ",
    addVehicle: "Filoya Araç Ekle",
    addSubtitle: "Operasyona alınacak aracın temel, kapasite ve uygunluk bilgilerini kaydedin.",
    vehiclePhoto: "Araç Fotoğrafı",
    noPhoto: "Araç fotoğrafı seçilmedi",
    imageHint: "JPG, PNG veya WEBP — en fazla 5 MB",
    plate: "Plaka",
    brand: "Marka",
    model: "Model",
    year: "Model Yılı",
    type: "Araç Türü",
    color: "Renk",
    passengerCapacity: "Yolcu Kapasitesi",
    luggageCapacity: "Bagaj Kapasitesi",
    mileage: "Güncel Kilometre",
    insurance: "Sigorta Bitiş",
    note: "Operasyon Notu",
    notePlaceholder: "Araçla ilgili operasyon notları...",
    saving: "Kaydediliyor...",
    save: "Aracı Kaydet",
    fleet: "FİLO ENVANTERİ",
    fleetList: "Araçlar",
    fleetSubtitle: "Araçların durum, sürücü, sigorta ve kapasite bilgilerini izleyin.",
    search: "Araç ara",
    searchPlaceholder: "Plaka, marka, model veya araç türü...",
    allStatuses: "Tüm durumlar",
    statusActive: "Aktif",
    statusService: "Serviste",
    statusFaulty: "Arızalı",
    statusInactive: "Pasif",
    allAssignments: "Tüm atamalar",
    assigned: "Sürücü atanmış",
    notAssigned: "Sürücü atanmamış",
    vehicles: "araç",
    loading: "Filo bilgileri yükleniyor...",
    empty: "Filtrelere uyan araç bulunamadı.",
    loadError: "Filo bilgileri yüklenemedi.",
    invalidImage: "Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.",
    imageTooLarge: "Araç fotoğrafı en fazla 5 MB olabilir.",
    addSuccessPhoto: "Araç ve fotoğraf başarıyla eklendi.",
    addSuccess: "Araç başarıyla eklendi.",
    addError: "Araç eklenemedi.",
    photoUpdated: "araç fotoğrafı güncellendi.",
    photoError: "Araç fotoğrafı yüklenemedi.",
    statusUpdated: "araç durumu güncellendi.",
    statusError: "Araç durumu güncellenemedi.",
    driverAssigned: "aracına sürücü atandı.",
    driverRemoved: "aracındaki sürücü kaldırıldı.",
    assignError: "Sürücü ataması yapılamadı.",
    black: "Siyah",
  },
  en: {
    eyebrow: "FLEET OPERATIONS",
    title: "Fleet Control Center",
    subtitle: "Manage vehicle capacity, driver assignments and compliance from one screen.",
    back: "Back to Dispatcher",
    refresh: "Refresh",
    total: "Total Vehicles",
    active: "Ready for Service",
    service: "Service / Fault",
    unassigned: "No Driver",
    insuranceRisk: "Insurance Risk",
    newRecord: "NEW VEHICLE",
    addVehicle: "Add Vehicle to Fleet",
    addSubtitle: "Register the core, capacity and compliance details of a vehicle entering operations.",
    vehiclePhoto: "Vehicle Photo",
    noPhoto: "No vehicle photo selected",
    imageHint: "JPG, PNG or WEBP — max 5 MB",
    plate: "Plate",
    brand: "Brand",
    model: "Model",
    year: "Model Year",
    type: "Vehicle Type",
    color: "Color",
    passengerCapacity: "Passenger Capacity",
    luggageCapacity: "Luggage Capacity",
    mileage: "Current Mileage",
    insurance: "Insurance Expiry",
    note: "Operations Note",
    notePlaceholder: "Operational notes about the vehicle...",
    saving: "Saving...",
    save: "Save Vehicle",
    fleet: "FLEET INVENTORY",
    fleetList: "Vehicles",
    fleetSubtitle: "Monitor status, driver, insurance and capacity for every vehicle.",
    search: "Search vehicles",
    searchPlaceholder: "Plate, brand, model or vehicle type...",
    allStatuses: "All statuses",
    statusActive: "Active",
    statusService: "In Service",
    statusFaulty: "Faulty",
    statusInactive: "Inactive",
    allAssignments: "All assignments",
    assigned: "Driver assigned",
    notAssigned: "No driver assigned",
    vehicles: "vehicles",
    loading: "Loading fleet information...",
    empty: "No vehicles match these filters.",
    loadError: "Fleet information could not be loaded.",
    invalidImage: "Please select a JPG, PNG or WEBP image.",
    imageTooLarge: "Vehicle photo must be 5 MB or smaller.",
    addSuccessPhoto: "Vehicle and photo added successfully.",
    addSuccess: "Vehicle added successfully.",
    addError: "Vehicle could not be added.",
    photoUpdated: "vehicle photo updated.",
    photoError: "Vehicle photo could not be uploaded.",
    statusUpdated: "vehicle status updated.",
    statusError: "Vehicle status could not be updated.",
    driverAssigned: "was assigned a driver.",
    driverRemoved: "driver assignment was removed.",
    assignError: "Driver assignment could not be updated.",
    black: "Black",
  },
  ar: {
    eyebrow: "عمليات الأسطول",
    title: "مركز التحكم بالأسطول",
    subtitle: "إدارة سعة المركبات وتعيينات السائقين وحالة الامتثال من شاشة واحدة.",
    back: "العودة إلى المرسل",
    refresh: "تحديث",
    total: "إجمالي المركبات",
    active: "جاهزة للعمل",
    service: "صيانة / عطل",
    unassigned: "بدون سائق",
    insuranceRisk: "مخاطر التأمين",
    newRecord: "مركبة جديدة",
    addVehicle: "إضافة مركبة إلى الأسطول",
    addSubtitle: "سجل بيانات المركبة الأساسية والسعة والامتثال قبل دخولها التشغيل.",
    vehiclePhoto: "صورة المركبة",
    noPhoto: "لم يتم اختيار صورة",
    imageHint: "JPG أو PNG أو WEBP — بحد أقصى 5 MB",
    plate: "اللوحة",
    brand: "العلامة",
    model: "الموديل",
    year: "سنة الموديل",
    type: "نوع المركبة",
    color: "اللون",
    passengerCapacity: "سعة الركاب",
    luggageCapacity: "سعة الأمتعة",
    mileage: "المسافة الحالية",
    insurance: "انتهاء التأمين",
    note: "ملاحظة تشغيلية",
    notePlaceholder: "ملاحظات تشغيلية عن المركبة...",
    saving: "جارٍ الحفظ...",
    save: "حفظ المركبة",
    fleet: "مخزون الأسطول",
    fleetList: "المركبات",
    fleetSubtitle: "راقب حالة كل مركبة والسائق والتأمين والسعة.",
    search: "بحث عن مركبة",
    searchPlaceholder: "اللوحة أو العلامة أو الموديل أو النوع...",
    allStatuses: "كل الحالات",
    statusActive: "نشطة",
    statusService: "في الصيانة",
    statusFaulty: "معطلة",
    statusInactive: "غير نشطة",
    allAssignments: "كل التعيينات",
    assigned: "تم تعيين سائق",
    notAssigned: "بدون سائق",
    vehicles: "مركبة",
    loading: "جارٍ تحميل معلومات الأسطول...",
    empty: "لا توجد مركبات مطابقة للفلاتر.",
    loadError: "تعذر تحميل معلومات الأسطول.",
    invalidImage: "يرجى اختيار صورة JPG أو PNG أو WEBP.",
    imageTooLarge: "يجب ألا تتجاوز صورة المركبة 5 MB.",
    addSuccessPhoto: "تمت إضافة المركبة والصورة بنجاح.",
    addSuccess: "تمت إضافة المركبة بنجاح.",
    addError: "تعذر إضافة المركبة.",
    photoUpdated: "تم تحديث صورة المركبة.",
    photoError: "تعذر رفع صورة المركبة.",
    statusUpdated: "تم تحديث حالة المركبة.",
    statusError: "تعذر تحديث حالة المركبة.",
    driverAssigned: "تم تعيين سائق للمركبة.",
    driverRemoved: "تمت إزالة تعيين السائق.",
    assignError: "تعذر تحديث تعيين السائق.",
    black: "أسود",
  },
  es: {
    eyebrow: "OPERACIONES DE FLOTA",
    title: "Centro de Control de Flota",
    subtitle: "Gestiona capacidad, asignaciones de conductores y cumplimiento desde una sola pantalla.",
    back: "Volver a Dispatcher",
    refresh: "Actualizar",
    total: "Vehículos Totales",
    active: "Listos para Servicio",
    service: "Servicio / Avería",
    unassigned: "Sin Conductor",
    insuranceRisk: "Riesgo de Seguro",
    newRecord: "NUEVO VEHÍCULO",
    addVehicle: "Añadir Vehículo a la Flota",
    addSubtitle: "Registra los datos básicos, capacidad y cumplimiento del vehículo antes de operar.",
    vehiclePhoto: "Foto del Vehículo",
    noPhoto: "No se seleccionó foto",
    imageHint: "JPG, PNG o WEBP — máx. 5 MB",
    plate: "Matrícula",
    brand: "Marca",
    model: "Modelo",
    year: "Año",
    type: "Tipo de Vehículo",
    color: "Color",
    passengerCapacity: "Capacidad de Pasajeros",
    luggageCapacity: "Capacidad de Equipaje",
    mileage: "Kilometraje Actual",
    insurance: "Vencimiento del Seguro",
    note: "Nota Operativa",
    notePlaceholder: "Notas operativas sobre el vehículo...",
    saving: "Guardando...",
    save: "Guardar Vehículo",
    fleet: "INVENTARIO DE FLOTA",
    fleetList: "Vehículos",
    fleetSubtitle: "Supervisa estado, conductor, seguro y capacidad de cada vehículo.",
    search: "Buscar vehículos",
    searchPlaceholder: "Matrícula, marca, modelo o tipo...",
    allStatuses: "Todos los estados",
    statusActive: "Activo",
    statusService: "En Servicio",
    statusFaulty: "Averiado",
    statusInactive: "Inactivo",
    allAssignments: "Todas las asignaciones",
    assigned: "Con conductor",
    notAssigned: "Sin conductor",
    vehicles: "vehículos",
    loading: "Cargando información de flota...",
    empty: "No hay vehículos que coincidan con los filtros.",
    loadError: "No se pudo cargar la información de flota.",
    invalidImage: "Selecciona una imagen JPG, PNG o WEBP.",
    imageTooLarge: "La foto del vehículo debe ser de 5 MB o menos.",
    addSuccessPhoto: "Vehículo y foto añadidos correctamente.",
    addSuccess: "Vehículo añadido correctamente.",
    addError: "No se pudo añadir el vehículo.",
    photoUpdated: "foto del vehículo actualizada.",
    photoError: "No se pudo subir la foto del vehículo.",
    statusUpdated: "estado del vehículo actualizado.",
    statusError: "No se pudo actualizar el estado del vehículo.",
    driverAssigned: "recibió un conductor.",
    driverRemoved: "se eliminó la asignación del conductor.",
    assignError: "No se pudo actualizar la asignación del conductor.",
    black: "Negro",
  },
};

export default function FleetPage({ onBack }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingVehicleId, setUpdatingVehicleId] = useState(null);
  const [uploadingVehicleId, setUploadingVehicleId] = useState(null);
  const [assigningVehicleId, setAssigningVehicleId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  async function loadInitialData() {
    setLoading(true);
    setError("");
    try {
      const [vehicleData, driverData] = await Promise.all([
        getVehicles(),
        getDrivers(),
      ]);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
    } catch (requestError) {
      setError(requestError.message || text.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadVehicles() {
    const data = await getVehicles();
    setVehicles(Array.isArray(data) ? data : []);
  }

  async function loadDrivers() {
    const data = await getDrivers();
    setDrivers(Array.isArray(data) ? data : []);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function validatePhoto(file) {
    if (!file) return false;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(text.invalidImage);
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(text.imageTooLarge);
      return false;
    }
    return true;
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedPhoto(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview("");
      return;
    }
    if (!validatePhoto(file)) {
      event.target.value = "";
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setError("");
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
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
        year: form.year ? Number(form.year) : null,
        vehicle_type: form.vehicle_type,
        color: form.color || null,
        passenger_capacity: Number(form.passenger_capacity),
        luggage_capacity: Number(form.luggage_capacity),
        current_mileage: Number(form.current_mileage),
        insurance_expiry_date: form.insurance_expiry_date || null,
        note: form.note || null,
        operational_status: "active",
      });

      const createdVehicle = response.data;
      const hadSelectedPhoto = Boolean(selectedPhoto);
      if (selectedPhoto && createdVehicle?.id) {
        await uploadVehiclePhoto(createdVehicle.id, selectedPhoto);
      }
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setForm(initialForm);
      setSelectedPhoto(null);
      setPhotoPreview("");
      setSuccessMessage(hadSelectedPhoto ? text.addSuccessPhoto : text.addSuccess);
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.message || text.addError);
    } finally {
      setSaving(false);
    }
  }

  async function handleExistingPhotoUpload(vehicle, photoFile) {
    if (!photoFile || !validatePhoto(photoFile)) return;
    setUploadingVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");
    try {
      const response = await uploadVehiclePhoto(vehicle.id, photoFile);
      const updatedVehicle = response.data?.vehicle;
      if (updatedVehicle) {
        setVehicles((currentVehicles) => currentVehicles.map((item) =>
          item.id === vehicle.id ? updatedVehicle : item,
        ));
      } else {
        await loadVehicles();
      }
      setSuccessMessage(`${vehicle.plate} ${text.photoUpdated}`);
    } catch (requestError) {
      setError(requestError.message || text.photoError);
    } finally {
      setUploadingVehicleId(null);
    }
  }

  async function handleStatusChange(vehicle, operationalStatus) {
    setUpdatingVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");
    try {
      const response = await changeVehicleStatus(vehicle.id, operationalStatus);
      const updatedVehicle = response.data;
      setVehicles((currentVehicles) => currentVehicles.map((item) =>
        item.id === vehicle.id ? updatedVehicle : item,
      ));
      setSuccessMessage(`${vehicle.plate} ${text.statusUpdated}`);
    } catch (requestError) {
      setError(requestError.message || text.statusError);
    } finally {
      setUpdatingVehicleId(null);
    }
  }

  async function handleDriverAssign(vehicle, driverId) {
    setAssigningVehicleId(vehicle.id);
    setError("");
    setSuccessMessage("");
    try {
      const currentlyAssignedDriver = drivers.find(
        (driver) => Number(driver.vehicle_id) === Number(vehicle.id),
      );
      if (currentlyAssignedDriver && currentlyAssignedDriver.id !== driverId) {
        await assignVehicleToDriver(currentlyAssignedDriver.id, null);
      }
      if (driverId) {
        const driverWithAnotherVehicle = drivers.find(
          (driver) => driver.id === driverId && driver.vehicle_id &&
            Number(driver.vehicle_id) !== Number(vehicle.id),
        );
        if (driverWithAnotherVehicle) {
          await assignVehicleToDriver(driverWithAnotherVehicle.id, null);
        }
        await assignVehicleToDriver(driverId, vehicle.id);
      }
      await loadDrivers();
      setSuccessMessage(
        driverId
          ? `${vehicle.plate} ${text.driverAssigned}`
          : `${vehicle.plate} ${text.driverRemoved}`,
      );
    } catch (requestError) {
      setError(requestError.message || text.assignError);
    } finally {
      setAssigningVehicleId(null);
    }
  }

  const stats = useMemo(() => {
    const serviceCount = vehicles.filter((vehicle) =>
      ["service", "faulty"].includes(getVehicleOperationalStatus(vehicle)),
    ).length;
    const unassignedCount = vehicles.filter((vehicle) =>
      !drivers.some((driver) => Number(driver.vehicle_id) === Number(vehicle.id)),
    ).length;
    const insuranceRiskCount = vehicles.filter((vehicle) =>
      isInsuranceRisk(vehicle.insurance_expiry_date),
    ).length;
    return {
      total: vehicles.length,
      active: vehicles.filter((vehicle) => getVehicleOperationalStatus(vehicle) === "active").length,
      service: serviceCount,
      unassigned: unassignedCount,
      insuranceRisk: insuranceRiskCount,
    };
  }, [vehicles, drivers]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return vehicles.filter((vehicle) => {
      const operationalStatus = getVehicleOperationalStatus(vehicle);
      if (statusFilter !== "all" && operationalStatus !== statusFilter) return false;
      const assigned = drivers.some(
        (driver) => Number(driver.vehicle_id) === Number(vehicle.id),
      );
      if (assignmentFilter === "assigned" && !assigned) return false;
      if (assignmentFilter === "unassigned" && assigned) return false;
      if (!query) return true;
      return [vehicle.plate, vehicle.brand, vehicle.model, vehicle.vehicle_type, vehicle.color]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [vehicles, drivers, search, statusFilter, assignmentFilter]);

  return (
    <main className="fleet-page fleet-control-center">
      <header className="fleet-header fleet-control-header">
        <div>
          <p>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <span>{text.subtitle}</span>
        </div>
        <div className="fleet-header-actions">
          <button type="button" onClick={loadInitialData} disabled={loading}>
            ↻ {text.refresh}
          </button>
          {onBack && (
            <button type="button" onClick={onBack}>
              ← {text.back}
            </button>
          )}
        </div>
      </header>

      <section className="fleet-stats fleet-kpi-grid">
        <FleetKpi icon="🚐" label={text.total} value={stats.total} tone="blue" />
        <FleetKpi icon="✓" label={text.active} value={stats.active} tone="green" />
        <FleetKpi icon="🔧" label={text.service} value={stats.service} tone="orange" />
        <FleetKpi icon="👤" label={text.unassigned} value={stats.unassigned} tone="purple" />
        <FleetKpi icon="🛡" label={text.insuranceRisk} value={stats.insuranceRisk} tone="red" />
      </section>

      <section className="fleet-layout fleet-control-layout">
        <form className="vehicle-form fleet-create-panel" onSubmit={handleSubmit}>
          <div className="fleet-section-heading">
            <div>
              <p>{text.newRecord}</p>
              <h2>{text.addVehicle}</h2>
              <span>{text.addSubtitle}</span>
            </div>
          </div>

          <div className="vehicle-photo-uploader">
            <div className="vehicle-photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt={text.vehiclePhoto} />
              ) : (
                <div className="vehicle-photo-placeholder">
                  <span>🚐</span>
                  <small>{text.noPhoto}</small>
                </div>
              )}
            </div>
            <label className="vehicle-photo-input">
              {text.vehiclePhoto}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />
              <small>{text.imageHint}</small>
            </label>
          </div>

          <div className="vehicle-form-grid">
            <Field label={text.plate}><input name="plate" value={form.plate} onChange={handleInputChange} placeholder="34 TDR 001" required /></Field>
            <Field label={text.brand}><input name="brand" value={form.brand} onChange={handleInputChange} placeholder="Mercedes-Benz" required /></Field>
            <Field label={text.model}><input name="model" value={form.model} onChange={handleInputChange} placeholder="Vito 114 CDI" required /></Field>
            <Field label={text.year}><input name="year" type="number" min="1950" value={form.year} onChange={handleInputChange} placeholder="2024" /></Field>
            <Field label={text.type}>
              <select name="vehicle_type" value={form.vehicle_type} onChange={handleInputChange}>
                {['Minivan','Sedan','Business Sedan','Luxury Sedan','Van','Minibus','Bus'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <Field label={text.color}><input name="color" value={form.color} onChange={handleInputChange} placeholder={text.black} /></Field>
            <Field label={text.passengerCapacity}><input name="passenger_capacity" type="number" min="1" max="100" value={form.passenger_capacity} onChange={handleInputChange} required /></Field>
            <Field label={text.luggageCapacity}><input name="luggage_capacity" type="number" min="0" max="100" value={form.luggage_capacity} onChange={handleInputChange} /></Field>
            <Field label={text.mileage}><input name="current_mileage" type="number" min="0" value={form.current_mileage} onChange={handleInputChange} /></Field>
            <Field label={text.insurance}><input name="insurance_expiry_date" type="date" value={form.insurance_expiry_date} onChange={handleInputChange} /></Field>
          </div>

          <label className="vehicle-note-field">
            {text.note}
            <textarea name="note" value={form.note} onChange={handleInputChange} rows="3" placeholder={text.notePlaceholder} />
          </label>

          {error && <div className="dashboard-error fleet-feedback">{error}</div>}
          {successMessage && <div className="fleet-success fleet-feedback">{successMessage}</div>}

          <button className="vehicle-submit-button" type="submit" disabled={saving}>
            {saving ? text.saving : `＋ ${text.save}`}
          </button>
        </form>

        <section className="vehicle-list-panel fleet-inventory-panel">
          <div className="fleet-section-heading fleet-inventory-heading">
            <div>
              <p>{text.fleet}</p>
              <h2>{text.fleetList}</h2>
              <span>{text.fleetSubtitle}</span>
            </div>
            <strong>{filteredVehicles.length} {text.vehicles}</strong>
          </div>

          <div className="fleet-toolbar">
            <label className="fleet-search-field">
              <span>{text.search}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.searchPlaceholder}
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label={text.allStatuses}>
              <option value="all">{text.allStatuses}</option>
              <option value="active">{text.statusActive}</option>
              <option value="service">{text.statusService}</option>
              <option value="faulty">{text.statusFaulty}</option>
              <option value="inactive">{text.statusInactive}</option>
            </select>
            <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} aria-label={text.allAssignments}>
              <option value="all">{text.allAssignments}</option>
              <option value="assigned">{text.assigned}</option>
              <option value="unassigned">{text.notAssigned}</option>
            </select>
          </div>

          {loading && <p className="dashboard-message">{text.loading}</p>}
          {!loading && filteredVehicles.length === 0 && <div className="fleet-empty-state"><span>🚐</span><p>{text.empty}</p></div>}

          <div className="vehicle-list professional-vehicle-list">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                drivers={drivers}
                updatingVehicleId={updatingVehicleId}
                uploadingVehicleId={uploadingVehicleId}
                assigningVehicleId={assigningVehicleId}
                onStatusChange={handleStatusChange}
                onPhotoUpload={handleExistingPhotoUpload}
                onDriverAssign={handleDriverAssign}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return <label>{label}{children}</label>;
}

function FleetKpi({ icon, label, value, tone }) {
  return (
    <article className={`fleet-kpi fleet-kpi-${tone}`}>
      <span className="fleet-kpi-icon">{icon}</span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </article>
  );
}

function isInsuranceRisk(expiryDate) {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return true;
  const diff = expiry.getTime() - Date.now();
  return diff <= 60 * 24 * 60 * 60 * 1000;
}

function getVehicleOperationalStatus(vehicle) {
  if (vehicle?.operational_status) return vehicle.operational_status;
  return vehicle?.is_active ? "active" : "inactive";
}
