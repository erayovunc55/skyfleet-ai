import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n";

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

const TEXT = {
  tr: {
    loadError: "Araçlar yüklenemedi.",
    updated: "Araç bilgileri güncellendi.",
    created: "Araç başarıyla oluşturuldu.",
    saveError: "Araç kaydedilemedi.",
    statusUpdated: "Araç durumu güncellendi.",
    statusUpdateError: "Araç durumu güncellenemedi.",

    eyebrow: "FİLO YÖNETİMİ",
    title: "Araçlar",
    description:
      "Operasyonlarda kullanacağınız araçları ekleyin ve yönetin.",
    refresh: "Yenile",
    newVehicle: "+ Yeni Araç",

    totalVehicles: "Toplam Araç",
    activeVehicles: "Aktif Araç",
    inService: "Serviste",
    unavailable: "Kullanılamaz",

    vehicleFleet: "Araç Filosu",
    records: "kayıt",
    loadingVehicles: "Araçlar yükleniyor...",
    noVehiclesTitle: "Henüz araç eklenmedi",
    noVehiclesDescription:
      "İlk aracınızı ekleyerek filonuzu oluşturmaya başlayın.",

    vehicleType: "Araç tipi",
    capacity: "Kapasite",
    passengerUnit: "yolcu",
    luggageUnit: "bagaj",
    driver: "Sürücü",
    notAssigned: "Atanmadı",
    status: "Durum",
    edit: "Düzenle",

    modalEditAria: "Araç düzenle",
    modalCreateAria: "Yeni araç ekle",
    fleetRecord: "FİLO KAYDI",
    editVehicle: "Aracı Düzenle",
    addVehicle: "Yeni Araç Ekle",

    plate: "Plaka",
    brand: "Marka",
    model: "Model",
    modelYear: "Model yılı",
    color: "Renk",
    colorPlaceholder: "Siyah",
    passengerCapacity: "Yolcu kapasitesi",
    luggageCapacity: "Bagaj kapasitesi",
    insuranceExpiry: "Sigorta bitiş tarihi",
    inspectionExpiry: "Muayene bitiş tarihi",
    operationalStatus: "Operasyon durumu",
    note: "Not",
    notePlaceholder: "Araç hakkında operasyon notu...",

    sedan: "Sedan",
    minivan: "Minivan",
    minibus: "Minibüs",
    bus: "Otobüs",
    vip: "VIP",

    cancel: "Vazgeç",
    saving: "Kaydediliyor...",
    saveChanges: "Değişiklikleri Kaydet",
    saveVehicle: "Aracı Kaydet",
  },

  en: {
    loadError: "Vehicles could not be loaded.",
    updated: "Vehicle information has been updated.",
    created: "Vehicle created successfully.",
    saveError: "The vehicle could not be saved.",
    statusUpdated: "Vehicle status has been updated.",
    statusUpdateError: "Vehicle status could not be updated.",

    eyebrow: "FLEET MANAGEMENT",
    title: "Vehicles",
    description:
      "Add and manage the vehicles you use in your operations.",
    refresh: "Refresh",
    newVehicle: "+ New Vehicle",

    totalVehicles: "Total Vehicles",
    activeVehicles: "Active Vehicles",
    inService: "In Service",
    unavailable: "Unavailable",

    vehicleFleet: "Vehicle Fleet",
    records: "records",
    loadingVehicles: "Loading vehicles...",
    noVehiclesTitle: "No vehicles added yet",
    noVehiclesDescription:
      "Add your first vehicle to start building your fleet.",

    vehicleType: "Vehicle Type",
    capacity: "Capacity",
    passengerUnit: "passengers",
    luggageUnit: "bags",
    driver: "Driver",
    notAssigned: "Unassigned",
    status: "Status",
    edit: "Edit",

    modalEditAria: "Edit vehicle",
    modalCreateAria: "Add new vehicle",
    fleetRecord: "FLEET RECORD",
    editVehicle: "Edit Vehicle",
    addVehicle: "Add New Vehicle",

    plate: "Plate",
    brand: "Brand",
    model: "Model",
    modelYear: "Model Year",
    color: "Color",
    colorPlaceholder: "Black",
    passengerCapacity: "Passenger Capacity",
    luggageCapacity: "Luggage Capacity",
    insuranceExpiry: "Insurance Expiry Date",
    inspectionExpiry: "Inspection Expiry Date",
    operationalStatus: "Operational Status",
    note: "Note",
    notePlaceholder: "Operational note about the vehicle...",

    sedan: "Sedan",
    minivan: "Minivan",
    minibus: "Minibus",
    bus: "Bus",
    vip: "VIP",

    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save Changes",
    saveVehicle: "Save Vehicle",
  },

  es: {
    loadError: "No se pudieron cargar los vehículos.",
    updated: "La información del vehículo ha sido actualizada.",
    created: "Vehículo creado correctamente.",
    saveError: "No se pudo guardar el vehículo.",
    statusUpdated: "El estado del vehículo ha sido actualizado.",
    statusUpdateError: "No se pudo actualizar el estado del vehículo.",

    eyebrow: "GESTIÓN DE FLOTA",
    title: "Vehículos",
    description:
      "Añada y gestione los vehículos que utiliza en sus operaciones.",
    refresh: "Actualizar",
    newVehicle: "+ Nuevo Vehículo",

    totalVehicles: "Total de Vehículos",
    activeVehicles: "Vehículos Activos",
    inService: "En Servicio",
    unavailable: "No Disponibles",

    vehicleFleet: "Flota de Vehículos",
    records: "registros",
    loadingVehicles: "Cargando vehículos...",
    noVehiclesTitle: "Aún no se han añadido vehículos",
    noVehiclesDescription:
      "Añada su primer vehículo para empezar a crear su flota.",

    vehicleType: "Tipo de Vehículo",
    capacity: "Capacidad",
    passengerUnit: "pasajeros",
    luggageUnit: "maletas",
    driver: "Conductor",
    notAssigned: "Sin asignar",
    status: "Estado",
    edit: "Editar",

    modalEditAria: "Editar vehículo",
    modalCreateAria: "Añadir nuevo vehículo",
    fleetRecord: "REGISTRO DE FLOTA",
    editVehicle: "Editar Vehículo",
    addVehicle: "Añadir Nuevo Vehículo",

    plate: "Matrícula",
    brand: "Marca",
    model: "Modelo",
    modelYear: "Año del Modelo",
    color: "Color",
    colorPlaceholder: "Negro",
    passengerCapacity: "Capacidad de Pasajeros",
    luggageCapacity: "Capacidad de Equipaje",
    insuranceExpiry: "Vencimiento del Seguro",
    inspectionExpiry: "Vencimiento de la Inspección",
    operationalStatus: "Estado Operativo",
    note: "Nota",
    notePlaceholder: "Nota operativa sobre el vehículo...",

    sedan: "Sedán",
    minivan: "Minivan",
    minibus: "Minibús",
    bus: "Autobús",
    vip: "VIP",

    cancel: "Cancelar",
    saving: "Guardando...",
    saveChanges: "Guardar Cambios",
    saveVehicle: "Guardar Vehículo",
  },

  ar: {
    loadError: "تعذر تحميل المركبات.",
    updated: "تم تحديث معلومات المركبة.",
    created: "تم إنشاء المركبة بنجاح.",
    saveError: "تعذر حفظ المركبة.",
    statusUpdated: "تم تحديث حالة المركبة.",
    statusUpdateError: "تعذر تحديث حالة المركبة.",

    eyebrow: "إدارة الأسطول",
    title: "المركبات",
    description:
      "أضف المركبات المستخدمة في العمليات وقم بإدارتها.",
    refresh: "تحديث",
    newVehicle: "+ مركبة جديدة",

    totalVehicles: "إجمالي المركبات",
    activeVehicles: "المركبات النشطة",
    inService: "في الصيانة",
    unavailable: "غير متاحة",

    vehicleFleet: "أسطول المركبات",
    records: "سجلات",
    loadingVehicles: "جارٍ تحميل المركبات...",
    noVehiclesTitle: "لم تتم إضافة مركبات بعد",
    noVehiclesDescription:
      "أضف أول مركبة للبدء في إنشاء أسطولك.",

    vehicleType: "نوع المركبة",
    capacity: "السعة",
    passengerUnit: "ركاب",
    luggageUnit: "حقائب",
    driver: "السائق",
    notAssigned: "غير معين",
    status: "الحالة",
    edit: "تعديل",

    modalEditAria: "تعديل المركبة",
    modalCreateAria: "إضافة مركبة جديدة",
    fleetRecord: "سجل الأسطول",
    editVehicle: "تعديل المركبة",
    addVehicle: "إضافة مركبة جديدة",

    plate: "رقم اللوحة",
    brand: "العلامة التجارية",
    model: "الطراز",
    modelYear: "سنة الموديل",
    color: "اللون",
    colorPlaceholder: "أسود",
    passengerCapacity: "سعة الركاب",
    luggageCapacity: "سعة الأمتعة",
    insuranceExpiry: "تاريخ انتهاء التأمين",
    inspectionExpiry: "تاريخ انتهاء الفحص",
    operationalStatus: "الحالة التشغيلية",
    note: "ملاحظة",
    notePlaceholder: "ملاحظة تشغيلية عن المركبة...",

    sedan: "سيدان",
    minivan: "ميني فان",
    minibus: "ميني باص",
    bus: "حافلة",
    vip: "VIP",

    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    saveChanges: "حفظ التغييرات",
    saveVehicle: "حفظ المركبة",
  },
};

const STATUS_LABELS = {
  tr: {
    active: "Aktif",
    service: "Serviste",
    faulty: "Arızalı",
    inactive: "Pasif",
  },
  en: {
    active: "Active",
    service: "In Service",
    faulty: "Faulty",
    inactive: "Inactive",
  },
  es: {
    active: "Activo",
    service: "En Servicio",
    faulty: "Averiado",
    inactive: "Inactivo",
  },
  ar: {
    active: "نشط",
    service: "في الصيانة",
    faulty: "معطل",
    inactive: "غير نشط",
  },
};

export default function SupplierVehiclesPage() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;
  const statusLabels =
    STATUS_LABELS[language] || STATUS_LABELS.en;

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
            t.loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [t.loadError],
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

        setMessage(t.updated);
      } else {
        await createSupplierVehicle(
          payload,
        );

        setMessage(t.created);
      }

      closeForm();
      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.saveError,
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
        t.statusUpdated,
      );

      await loadVehicles();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.statusUpdateError,
        ),
      );
    }
  }

  return (
    <main className="supplier-dashboard supplier-management-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">
            {t.eyebrow}
          </span>

          <h1>{t.title}</h1>

          <p>{t.description}</p>
        </div>

        <div className="supplier-heading-actions">
          <button
            className="supplier-secondary-button"
            type="button"
            disabled={loading}
            onClick={loadVehicles}
          >
            {t.refresh}
          </button>

          <button
            className="supplier-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            {t.newVehicle}
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
          label={t.totalVehicles}
          value={summary.total}
        />

        <SummaryCard
          label={t.activeVehicles}
          value={summary.active}
        />

        <SummaryCard
          label={t.inService}
          value={summary.service}
        />

        <SummaryCard
          label={t.unavailable}
          value={summary.unavailable}
        />
      </section>

      <section className="supplier-management-card">
        <div className="supplier-section-heading">
          <div>
            <h2>
              {t.vehicleFleet}
            </h2>

            <p>
              {vehicles.length}
              {" "}
              {t.records}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            {t.loadingVehicles}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="supplier-empty-state">
            <strong>
              {t.noVehiclesTitle}
            </strong>

            <p>
              {t.noVehiclesDescription}
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
                      {t.vehicleType}
                    </span>

                    <strong>
                      {vehicle.vehicle_type}
                    </strong>
                  </div>

                  <div>
                    <span className="supplier-field-label">
                      {t.capacity}
                    </span>

                    <strong>
                      {vehicle.passenger_capacity}
                      {" "}
                      {t.passengerUnit}
                      {" / "}
                      {vehicle.luggage_capacity}
                      {" "}
                      {t.luggageUnit}
                    </strong>
                  </div>

                  <div>
                    <span className="supplier-field-label">
                      {t.driver}
                    </span>

                    <strong>
                      {vehicle.driver?.name ||
                        t.notAssigned}
                    </strong>
                  </div>

                  <label className="supplier-status-select">
                    <span className="supplier-field-label">
                      {t.status}
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
                        statusLabels,
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
                    {t.edit}
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
                ? t.modalEditAria
                : t.modalCreateAria
            }
          >
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">
                  {t.fleetRecord}
                </span>

                <h2>
                  {editingVehicle
                    ? t.editVehicle
                    : t.addVehicle}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form
              className="supplier-management-form"
              onSubmit={handleSubmit}
            >
              <div className="supplier-form-grid">
                <FormField label={t.plate}>
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

                <FormField label={t.brand}>
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

                <FormField label={t.model}>
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

                <FormField label={t.modelYear}>
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

                <FormField label={t.vehicleType}>
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
                      {t.sedan}
                    </option>

                    <option value="Minivan">
                      {t.minivan}
                    </option>

                    <option value="Minibus">
                      {t.minibus}
                    </option>

                    <option value="Bus">
                      {t.bus}
                    </option>

                    <option value="VIP">
                      {t.vip}
                    </option>
                  </select>
                </FormField>

                <FormField label={t.color}>
                  <input
                    value={form.color}
                    placeholder={
                      t.colorPlaceholder
                    }
                    onChange={(event) =>
                      updateField(
                        "color",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField
                  label={
                    t.passengerCapacity
                  }
                >
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

                <FormField
                  label={
                    t.luggageCapacity
                  }
                >
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

                <FormField
                  label={
                    t.insuranceExpiry
                  }
                >
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

                <FormField
                  label={
                    t.inspectionExpiry
                  }
                >
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

                <FormField
                  label={
                    t.operationalStatus
                  }
                >
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
                      statusLabels,
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

              <FormField label={t.note}>
                <textarea
                  rows="3"
                  value={form.note}
                  placeholder={
                    t.notePlaceholder
                  }
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
                  {t.cancel}
                </button>

                <button
                  className="supplier-primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? t.saving
                    : editingVehicle
                      ? t.saveChanges
                      : t.saveVehicle}
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
