import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../i18n";
import { assignVehicleToDriver, getDrivers } from "../services/driverService";
import {
  changeVehicleStatus,
  createVehicle,
  getVehicles,
  uploadVehiclePhoto,
} from "../services/vehicleService";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const initialForm = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  vehicle_type: "Minivan",
  color: "",
  passenger_capacity: 7,
  luggage_capacity: 6,
  insurance_expiry_date: "",
  note: "",
};

const TEXT = {
  tr: {
    eyebrow: "FİLO OPERASYONU", title: "Filo Kontrol Merkezi",
    subtitle: "Araç, sürücü, kapasite ve uygunluk durumunu ölçeklenebilir tek ekrandan yönetin.",
    back: "Dispatcher'a Dön", refresh: "Yenile", add: "+ Araç Ekle", close: "Kapat",
    total: "Toplam Araç", active: "Operasyona Hazır", service: "Servis / Arıza", unassigned: "Sürücüsüz", insuranceRisk: "Sigorta Riski",
    filters: "Filo Filtreleri", searchPlaceholder: "Plaka, marka, model, sürücü veya tedarikçi ara...",
    allStatuses: "Tüm durumlar", allAssignments: "Tüm atamalar", assigned: "Sürücü atanmış", notAssigned: "Sürücü atanmamış",
    inventory: "FİLO ENVANTERİ", vehicles: "Araçlar", showing: "Gösterilen", of: "/", perPage: "sayfa başına",
    previous: "Önceki", next: "Sonraki", page: "Sayfa",
    vehicle: "Araç", status: "Durum", driver: "Sürücü", supplier: "Tedarikçi", capacity: "Kapasite", luggage: "Bagaj", insurance: "Sigorta", actions: "İşlemler",
    activeStatus: "Aktif", serviceStatus: "Serviste", faultyStatus: "Arızalı", inactiveStatus: "Pasif",
    selectDriver: "Sürücü seç", noDriver: "Atanmamış", uploadPhoto: "Fotoğraf", changing: "Güncelleniyor...", noSupplier: "—",
    valid: "Geçerli", expiresSoon: "Yakında Bitiyor", expired: "Süresi Doldu", notProvided: "Belirtilmedi",
    loading: "Filo bilgileri yükleniyor...", empty: "Filtrelere uyan araç bulunamadı.",
    newVehicle: "YENİ ARAÇ", addVehicle: "Filoya Araç Ekle", addSubtitle: "Yeni aracı operasyona hazır şekilde kaydedin.",
    vehiclePhoto: "Araç Fotoğrafı", noPhoto: "Fotoğraf seçilmedi", imageHint: "JPG, PNG veya WEBP — en fazla 5 MB",
    plate: "Plaka", brand: "Marka", model: "Model", year: "Model Yılı", type: "Araç Türü", color: "Renk", passengerCapacity: "Yolcu Kapasitesi", luggageCapacity: "Bagaj Kapasitesi", insuranceExpiry: "Sigorta Bitiş", note: "Operasyon Notu", notePlaceholder: "Araçla ilgili operasyon notları...", save: "Aracı Kaydet", saving: "Kaydediliyor...",
    invalidImage: "Lütfen JPG, PNG veya WEBP formatında bir görsel seçin.", imageTooLarge: "Araç fotoğrafı en fazla 5 MB olabilir.", addSuccess: "Araç başarıyla eklendi.", addSuccessPhoto: "Araç ve fotoğraf başarıyla eklendi.", addError: "Araç eklenemedi.", photoError: "Araç fotoğrafı yüklenemedi.", statusError: "Araç durumu güncellenemedi.", assignError: "Sürücü ataması yapılamadı.", loadError: "Filo bilgileri yüklenemedi.", black: "Siyah",
  },
  en: {
    eyebrow: "FLEET OPERATIONS", title: "Fleet Control Center",
    subtitle: "Manage vehicles, drivers, capacity and compliance from one scalable workspace.",
    back: "Back to Dispatcher", refresh: "Refresh", add: "+ Add Vehicle", close: "Close",
    total: "Total Vehicles", active: "Ready for Service", service: "Service / Fault", unassigned: "No Driver", insuranceRisk: "Insurance Risk",
    filters: "Fleet Filters", searchPlaceholder: "Search plate, brand, model, driver or supplier...",
    allStatuses: "All statuses", allAssignments: "All assignments", assigned: "Driver assigned", notAssigned: "No driver assigned",
    inventory: "FLEET INVENTORY", vehicles: "Vehicles", showing: "Showing", of: "of", perPage: "per page",
    previous: "Previous", next: "Next", page: "Page",
    vehicle: "Vehicle", status: "Status", driver: "Driver", supplier: "Supplier", capacity: "Capacity", luggage: "Luggage", insurance: "Insurance", actions: "Actions",
    activeStatus: "Active", serviceStatus: "In Service", faultyStatus: "Faulty", inactiveStatus: "Inactive",
    selectDriver: "Select driver", noDriver: "Unassigned", uploadPhoto: "Photo", changing: "Updating...", noSupplier: "—",
    valid: "Valid", expiresSoon: "Expires Soon", expired: "Expired", notProvided: "Not Provided",
    loading: "Loading fleet information...", empty: "No vehicles match these filters.",
    newVehicle: "NEW VEHICLE", addVehicle: "Add Vehicle to Fleet", addSubtitle: "Register a new vehicle ready for operations.",
    vehiclePhoto: "Vehicle Photo", noPhoto: "No photo selected", imageHint: "JPG, PNG or WEBP — max 5 MB",
    plate: "Plate", brand: "Brand", model: "Model", year: "Model Year", type: "Vehicle Type", color: "Color", passengerCapacity: "Passenger Capacity", luggageCapacity: "Luggage Capacity", insuranceExpiry: "Insurance Expiry", note: "Operations Note", notePlaceholder: "Operational notes about the vehicle...", save: "Save Vehicle", saving: "Saving...",
    invalidImage: "Please select a JPG, PNG or WEBP image.", imageTooLarge: "Vehicle photo must be 5 MB or smaller.", addSuccess: "Vehicle added successfully.", addSuccessPhoto: "Vehicle and photo added successfully.", addError: "Vehicle could not be added.", photoError: "Vehicle photo could not be uploaded.", statusError: "Vehicle status could not be updated.", assignError: "Driver assignment could not be updated.", loadError: "Fleet information could not be loaded.", black: "Black",
  },
  ar: {
    eyebrow: "عمليات الأسطول", title: "مركز التحكم بالأسطول", subtitle: "إدارة المركبات والسائقين والسعة والامتثال من مساحة عمل قابلة للتوسع.",
    back: "العودة إلى المرسل", refresh: "تحديث", add: "+ إضافة مركبة", close: "إغلاق",
    total: "إجمالي المركبات", active: "جاهزة للعمل", service: "صيانة / عطل", unassigned: "بدون سائق", insuranceRisk: "مخاطر التأمين",
    filters: "فلاتر الأسطول", searchPlaceholder: "ابحث باللوحة أو العلامة أو الموديل أو السائق أو المورد...",
    allStatuses: "كل الحالات", allAssignments: "كل التعيينات", assigned: "تم تعيين سائق", notAssigned: "بدون سائق",
    inventory: "مخزون الأسطول", vehicles: "المركبات", showing: "عرض", of: "من", perPage: "لكل صفحة",
    previous: "السابق", next: "التالي", page: "صفحة",
    vehicle: "المركبة", status: "الحالة", driver: "السائق", supplier: "المورد", capacity: "السعة", luggage: "الأمتعة", insurance: "التأمين", actions: "الإجراءات",
    activeStatus: "نشطة", serviceStatus: "في الصيانة", faultyStatus: "معطلة", inactiveStatus: "غير نشطة",
    selectDriver: "اختر السائق", noDriver: "غير معين", uploadPhoto: "صورة", changing: "جارٍ التحديث...", noSupplier: "—",
    valid: "ساري", expiresSoon: "ينتهي قريباً", expired: "منتهي", notProvided: "غير محدد",
    loading: "جارٍ تحميل معلومات الأسطول...", empty: "لا توجد مركبات مطابقة للفلاتر.",
    newVehicle: "مركبة جديدة", addVehicle: "إضافة مركبة إلى الأسطول", addSubtitle: "سجل مركبة جديدة جاهزة للتشغيل.",
    vehiclePhoto: "صورة المركبة", noPhoto: "لم يتم اختيار صورة", imageHint: "JPG أو PNG أو WEBP — بحد أقصى 5 MB",
    plate: "اللوحة", brand: "العلامة", model: "الموديل", year: "سنة الموديل", type: "نوع المركبة", color: "اللون", passengerCapacity: "سعة الركاب", luggageCapacity: "سعة الأمتعة", insuranceExpiry: "انتهاء التأمين", note: "ملاحظة تشغيلية", notePlaceholder: "ملاحظات تشغيلية عن المركبة...", save: "حفظ المركبة", saving: "جارٍ الحفظ...",
    invalidImage: "يرجى اختيار صورة JPG أو PNG أو WEBP.", imageTooLarge: "يجب ألا تتجاوز صورة المركبة 5 MB.", addSuccess: "تمت إضافة المركبة بنجاح.", addSuccessPhoto: "تمت إضافة المركبة والصورة بنجاح.", addError: "تعذر إضافة المركبة.", photoError: "تعذر رفع صورة المركبة.", statusError: "تعذر تحديث حالة المركبة.", assignError: "تعذر تحديث تعيين السائق.", loadError: "تعذر تحميل معلومات الأسطول.", black: "أسود",
  },
  es: {
    eyebrow: "OPERACIONES DE FLOTA", title: "Centro de Control de Flota", subtitle: "Gestiona vehículos, conductores, capacidad y cumplimiento desde un espacio escalable.",
    back: "Volver a Dispatcher", refresh: "Actualizar", add: "+ Añadir Vehículo", close: "Cerrar",
    total: "Vehículos Totales", active: "Listos para Servicio", service: "Servicio / Avería", unassigned: "Sin Conductor", insuranceRisk: "Riesgo de Seguro",
    filters: "Filtros de Flota", searchPlaceholder: "Buscar matrícula, marca, modelo, conductor o proveedor...",
    allStatuses: "Todos los estados", allAssignments: "Todas las asignaciones", assigned: "Con conductor", notAssigned: "Sin conductor",
    inventory: "INVENTARIO DE FLOTA", vehicles: "Vehículos", showing: "Mostrando", of: "de", perPage: "por página",
    previous: "Anterior", next: "Siguiente", page: "Página",
    vehicle: "Vehículo", status: "Estado", driver: "Conductor", supplier: "Proveedor", capacity: "Capacidad", luggage: "Equipaje", insurance: "Seguro", actions: "Acciones",
    activeStatus: "Activo", serviceStatus: "En servicio", faultyStatus: "Averiado", inactiveStatus: "Inactivo",
    selectDriver: "Seleccionar conductor", noDriver: "Sin asignar", uploadPhoto: "Foto", changing: "Actualizando...", noSupplier: "—",
    valid: "Válido", expiresSoon: "Vence pronto", expired: "Vencido", notProvided: "No indicado",
    loading: "Cargando información de flota...", empty: "No hay vehículos que coincidan con los filtros.",
    newVehicle: "NUEVO VEHÍCULO", addVehicle: "Añadir Vehículo a la Flota", addSubtitle: "Registra un nuevo vehículo listo para operar.",
    vehiclePhoto: "Foto del Vehículo", noPhoto: "No se seleccionó foto", imageHint: "JPG, PNG o WEBP — máx. 5 MB",
    plate: "Matrícula", brand: "Marca", model: "Modelo", year: "Año", type: "Tipo de Vehículo", color: "Color", passengerCapacity: "Capacidad de Pasajeros", luggageCapacity: "Capacidad de Equipaje", insuranceExpiry: "Vencimiento del Seguro", note: "Nota Operativa", notePlaceholder: "Notas operativas sobre el vehículo...", save: "Guardar Vehículo", saving: "Guardando...",
    invalidImage: "Selecciona una imagen JPG, PNG o WEBP.", imageTooLarge: "La foto del vehículo debe ser de 5 MB o menos.", addSuccess: "Vehículo añadido correctamente.", addSuccessPhoto: "Vehículo y foto añadidos correctamente.", addError: "No se pudo añadir el vehículo.", photoError: "No se pudo subir la foto del vehículo.", statusError: "No se pudo actualizar el estado del vehículo.", assignError: "No se pudo actualizar la asignación del conductor.", loadError: "No se pudo cargar la información de flota.", black: "Negro",
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
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  async function loadInitialData() {
    setLoading(true);
    setError("");
    try {
      const [vehicleData, driverData] = await Promise.all([getVehicles(), getDrivers()]);
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
    setForm((current) => ({ ...current, [name]: value }));
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
    if (!file) return;
    if (!validatePhoto(file)) { event.target.value = ""; return; }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
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
        insurance_expiry_date: form.insurance_expiry_date || null,
        note: form.note || null,
        operational_status: "active",
      });
      const createdVehicle = response.data;
      const hadPhoto = Boolean(selectedPhoto);
      if (selectedPhoto && createdVehicle?.id) await uploadVehiclePhoto(createdVehicle.id, selectedPhoto);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setForm(initialForm);
      setSelectedPhoto(null);
      setPhotoPreview("");
      setShowAddVehicle(false);
      setSuccessMessage(hadPhoto ? text.addSuccessPhoto : text.addSuccess);
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.message || text.addError);
    } finally {
      setSaving(false);
    }
  }

  async function handleExistingPhotoUpload(vehicle, file) {
    if (!file || !validatePhoto(file)) return;
    setUploadingVehicleId(vehicle.id);
    setError("");
    try {
      const response = await uploadVehiclePhoto(vehicle.id, file);
      const updated = response.data?.vehicle;
      if (updated) setVehicles((items) => items.map((item) => item.id === vehicle.id ? updated : item));
      else await loadVehicles();
    } catch (requestError) {
      setError(requestError.message || text.photoError);
    } finally {
      setUploadingVehicleId(null);
    }
  }

  async function handleStatusChange(vehicle, status) {
    setUpdatingVehicleId(vehicle.id);
    setError("");
    try {
      const response = await changeVehicleStatus(vehicle.id, status);
      setVehicles((items) => items.map((item) => item.id === vehicle.id ? response.data : item));
    } catch (requestError) {
      setError(requestError.message || text.statusError);
    } finally {
      setUpdatingVehicleId(null);
    }
  }

  async function handleDriverAssign(vehicle, driverId) {
    setAssigningVehicleId(vehicle.id);
    setError("");
    try {
      const currentDriver = drivers.find((driver) => Number(driver.vehicle_id) === Number(vehicle.id));
      if (currentDriver && currentDriver.id !== driverId) await assignVehicleToDriver(currentDriver.id, null);
      if (driverId) {
        const driverWithVehicle = drivers.find((driver) => driver.id === driverId && driver.vehicle_id && Number(driver.vehicle_id) !== Number(vehicle.id));
        if (driverWithVehicle) await assignVehicleToDriver(driverWithVehicle.id, null);
        await assignVehicleToDriver(driverId, vehicle.id);
      }
      await loadDrivers();
    } catch (requestError) {
      setError(requestError.message || text.assignError);
    } finally {
      setAssigningVehicleId(null);
    }
  }

  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((v) => getVehicleOperationalStatus(v) === "active").length,
    service: vehicles.filter((v) => ["service", "faulty"].includes(getVehicleOperationalStatus(v))).length,
    unassigned: vehicles.filter((v) => !drivers.some((d) => Number(d.vehicle_id) === Number(v.id))).length,
    insuranceRisk: vehicles.filter((v) => getInsuranceState(v.insurance_expiry_date).risk).length,
  }), [vehicles, drivers]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return vehicles.filter((vehicle) => {
      const status = getVehicleOperationalStatus(vehicle);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      const driver = drivers.find((d) => Number(d.vehicle_id) === Number(vehicle.id));
      if (assignmentFilter === "assigned" && !driver) return false;
      if (assignmentFilter === "unassigned" && driver) return false;
      if (!query) return true;
      const supplier = getSupplierLabel(vehicle);
      return [vehicle.plate, vehicle.brand, vehicle.model, vehicle.vehicle_type, vehicle.color, driver?.name, supplier]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(query);
    });
  }, [vehicles, drivers, search, statusFilter, assignmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, assignmentFilter, pageSize]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const firstVisible = filteredVehicles.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(currentPage * pageSize, filteredVehicles.length);

  return (
    <main className="fleet-page fleet-scale-page">
      <header className="fleet-header fleet-scale-header">
        <div>
          <p>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <span>{text.subtitle}</span>
        </div>
        <div className="fleet-header-actions">
          <button type="button" onClick={loadInitialData} disabled={loading}>↻ {text.refresh}</button>
          <button type="button" className="fleet-primary-action" onClick={() => setShowAddVehicle((value) => !value)}>{showAddVehicle ? text.close : text.add}</button>
          {onBack && <button type="button" onClick={onBack}>← {text.back}</button>}
        </div>
      </header>

      <section className="fleet-kpi-grid">
        <FleetKpi icon="🚐" label={text.total} value={stats.total} tone="blue" />
        <FleetKpi icon="✓" label={text.active} value={stats.active} tone="green" />
        <FleetKpi icon="🔧" label={text.service} value={stats.service} tone="orange" />
        <FleetKpi icon="👤" label={text.unassigned} value={stats.unassigned} tone="purple" />
        <FleetKpi icon="🛡" label={text.insuranceRisk} value={stats.insuranceRisk} tone="red" />
      </section>

      {showAddVehicle && (
        <form className="fleet-add-panel" onSubmit={handleSubmit}>
          <div className="fleet-section-heading">
            <div><p>{text.newVehicle}</p><h2>{text.addVehicle}</h2><span>{text.addSubtitle}</span></div>
          </div>
          <div className="fleet-add-content">
            <div className="vehicle-photo-uploader">
              <div className="vehicle-photo-preview">
                {photoPreview ? <img src={photoPreview} alt={text.vehiclePhoto} /> : <div className="vehicle-photo-placeholder"><span>🚐</span><small>{text.noPhoto}</small></div>}
              </div>
              <label className="vehicle-photo-input">{text.vehiclePhoto}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} /><small>{text.imageHint}</small></label>
            </div>
            <div className="fleet-add-fields">
              <Field label={text.plate}><input name="plate" value={form.plate} onChange={handleInputChange} placeholder="34 TDR 001" required /></Field>
              <Field label={text.brand}><input name="brand" value={form.brand} onChange={handleInputChange} placeholder="Mercedes-Benz" required /></Field>
              <Field label={text.model}><input name="model" value={form.model} onChange={handleInputChange} placeholder="Vito 114 CDI" required /></Field>
              <Field label={text.year}><input name="year" type="number" min="1950" value={form.year} onChange={handleInputChange} placeholder="2024" /></Field>
              <Field label={text.type}><select name="vehicle_type" value={form.vehicle_type} onChange={handleInputChange}>{["Minivan","Sedan","Business Sedan","Luxury Sedan","Van","Minibus","Bus"].map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label={text.color}><input name="color" value={form.color} onChange={handleInputChange} placeholder={text.black} /></Field>
              <Field label={text.passengerCapacity}><input name="passenger_capacity" type="number" min="1" max="100" value={form.passenger_capacity} onChange={handleInputChange} required /></Field>
              <Field label={text.luggageCapacity}><input name="luggage_capacity" type="number" min="0" max="100" value={form.luggage_capacity} onChange={handleInputChange} /></Field>
              <Field label={text.insuranceExpiry}><input name="insurance_expiry_date" type="date" value={form.insurance_expiry_date} onChange={handleInputChange} /></Field>
              <Field label={text.note} wide><textarea name="note" value={form.note} onChange={handleInputChange} rows="2" placeholder={text.notePlaceholder} /></Field>
            </div>
          </div>
          <div className="fleet-add-footer">
            {error && <div className="dashboard-error">{error}</div>}
            <button className="vehicle-submit-button" type="submit" disabled={saving}>{saving ? text.saving : text.save}</button>
          </div>
        </form>
      )}

      {successMessage && <div className="fleet-success fleet-global-message">{successMessage}</div>}
      {!showAddVehicle && error && <div className="dashboard-error fleet-global-message">{error}</div>}

      <section className="fleet-inventory-panel fleet-table-panel">
        <div className="fleet-section-heading fleet-table-heading">
          <div><p>{text.inventory}</p><h2>{text.vehicles}</h2></div>
          <strong>{filteredVehicles.length}</strong>
        </div>

        <div className="fleet-toolbar fleet-scale-toolbar">
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.searchPlaceholder} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{text.allStatuses}</option><option value="active">{text.activeStatus}</option><option value="service">{text.serviceStatus}</option><option value="faulty">{text.faultyStatus}</option><option value="inactive">{text.inactiveStatus}</option>
          </select>
          <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)}>
            <option value="all">{text.allAssignments}</option><option value="assigned">{text.assigned}</option><option value="unassigned">{text.notAssigned}</option>
          </select>
        </div>

        {loading ? <p className="dashboard-message">{text.loading}</p> : (
          <div className="fleet-table-wrap">
            <table className="fleet-vehicle-table">
              <thead><tr><th>{text.vehicle}</th><th>{text.status}</th><th>{text.driver}</th><th>{text.supplier}</th><th>{text.capacity}</th><th>{text.luggage}</th><th>{text.insurance}</th><th>{text.actions}</th></tr></thead>
              <tbody>
                {paginatedVehicles.map((vehicle) => {
                  const driver = drivers.find((d) => Number(d.vehicle_id) === Number(vehicle.id));
                  const status = getVehicleOperationalStatus(vehicle);
                  const insurance = getInsuranceState(vehicle.insurance_expiry_date);
                  return (
                    <tr key={vehicle.id}>
                      <td><div className="fleet-vehicle-cell"><div className="fleet-thumb">{vehicle.photo_url ? <img src={vehicle.photo_url} alt="" /> : "🚐"}</div><div><strong>{vehicle.plate}</strong><span>{vehicle.brand} {vehicle.model}</span><small>{vehicle.vehicle_type || "—"}{vehicle.year ? ` · ${vehicle.year}` : ""}</small></div></div></td>
                      <td><select className={`fleet-inline-select status-${status}`} value={status} disabled={updatingVehicleId === vehicle.id} onChange={(event) => handleStatusChange(vehicle, event.target.value)}><option value="active">{text.activeStatus}</option><option value="service">{text.serviceStatus}</option><option value="faulty">{text.faultyStatus}</option><option value="inactive">{text.inactiveStatus}</option></select></td>
                      <td><select className="fleet-inline-select" value={driver?.id || ""} disabled={assigningVehicleId === vehicle.id} onChange={(event) => handleDriverAssign(vehicle, event.target.value ? Number(event.target.value) : null)}><option value="">{text.noDriver}</option>{drivers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{driver?.phone && <small className="fleet-cell-sub">{driver.phone}</small>}</td>
                      <td><strong className="fleet-supplier-name">{getSupplierLabel(vehicle) || text.noSupplier}</strong></td>
                      <td><strong>{Number(vehicle.passenger_capacity || 0)}</strong><small className="fleet-cell-sub">pax</small></td>
                      <td><strong>{Number(vehicle.luggage_capacity || 0)}</strong><small className="fleet-cell-sub">pcs</small></td>
                      <td><div className={`fleet-insurance-pill ${insurance.className}`}><strong>{text[insurance.labelKey]}</strong><span>{formatDate(vehicle.insurance_expiry_date, language) || text.notProvided}</span></div></td>
                      <td><label className="fleet-photo-action">{uploadingVehicleId === vehicle.id ? text.changing : text.uploadPhoto}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingVehicleId === vehicle.id} onChange={(event) => { const file = event.target.files?.[0]; handleExistingPhotoUpload(vehicle, file); event.target.value = ""; }} /></label></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!paginatedVehicles.length && <div className="fleet-empty-state">🚐 <span>{text.empty}</span></div>}
          </div>
        )}

        <div className="fleet-pagination">
          <div>{text.showing} <strong>{firstVisible}-{lastVisible}</strong> {text.of} <strong>{filteredVehicles.length}</strong></div>
          <div className="fleet-page-controls"><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹ {text.previous}</button><span>{text.page} <strong>{currentPage}</strong> / {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>{text.next} ›</button></div>
          <label><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select><span>{text.perPage}</span></label>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children, wide = false }) { return <label className={wide ? "fleet-field-wide" : ""}>{label}{children}</label>; }
function FleetKpi({ icon, label, value, tone }) { return <article className={`fleet-kpi fleet-kpi-${tone}`}><span className="fleet-kpi-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function getVehicleOperationalStatus(vehicle) { return vehicle?.operational_status || (vehicle?.is_active ? "active" : "inactive"); }
function getSupplierLabel(vehicle) { return vehicle?.supplier_company?.company_name || vehicle?.supplier?.company_name || vehicle?.supplier_name || vehicle?.supplier?.name || ""; }
function getInsuranceState(value) {
  if (!value) return { risk: true, className: "unknown", labelKey: "notProvided" };
  const expiry = new Date(value); if (Number.isNaN(expiry.getTime())) return { risk: true, className: "unknown", labelKey: "notProvided" };
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (days < 0) return { risk: true, className: "expired", labelKey: "expired" };
  if (days <= 60) return { risk: true, className: "warning", labelKey: "expiresSoon" };
  return { risk: false, className: "valid", labelKey: "valid" };
}
function formatDate(value, language) {
  if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return value;
  const locale = language === "tr" ? "tr-TR" : language === "ar" ? "ar-SA" : language === "es" ? "es-ES" : "en-GB";
  return date.toLocaleDateString(locale);
}
