import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n";

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

const TEXT = {
  tr: {
    loadError: "Sürücü bilgileri yüklenemedi.",
    updated: "Sürücü bilgileri güncellendi.",
    temporaryPasswordRequired:
      "Yeni sürücü için geçici şifre girmelisiniz.",
    created: "Sürücü başarıyla oluşturuldu.",
    saveError: "Sürücü kaydedilemedi.",
    vehicleAssigned: "Araç sürücüye atandı.",
    vehicleUnassigned: "Araç ataması kaldırıldı.",
    vehicleAssignmentError: "Araç ataması kaydedilemedi.",
    whatsappPhoneMissing:
      "Sürücünün WhatsApp için telefon numarası bulunmuyor.",
    whatsappLinkError: "WhatsApp bağlantısı oluşturulamadı.",
    resetReadySuffix:
      "için 60 dakikalık şifre sıfırlama bağlantısı hazırlandı.",
    resetError: "Şifre sıfırlama bağlantısı oluşturulamadı.",
    deactivateConfirmSuffix:
      "isimli sürücünün mobil erişimi kapatılsın mı?",
    deactivated: "Sürücü pasif duruma alındı.",
    deactivateError: "Sürücü pasif duruma alınamadı.",

    eyebrow: "EKİP YÖNETİMİ",
    title: "Sürücüler",
    description:
      "Sürücü hesaplarını oluşturun, araçlarını belirleyin ve mobil erişimlerini yönetin.",
    refresh: "Yenile",
    newDriver: "+ Yeni Sürücü",

    totalDrivers: "Toplam Sürücü",
    activeDrivers: "Aktif Sürücü",
    assignedVehicle: "Araç Atanmış",
    waitingVehicle: "Araç Bekleyen",

    driverTeam: "Sürücü Ekibi",
    records: "kayıt",
    loadingDrivers: "Sürücüler yükleniyor...",
    noDriversTitle: "Henüz sürücü eklenmedi",
    noDriversDescription: "İlk sürücü hesabınızı oluşturun.",

    contact: "İletişim",
    noEmail: "E-posta yok",
    status: "Durum",
    active: "Aktif",
    inactive: "Pasif",
    vehicleAssignment: "Araç ataması",
    vehicleNotAssigned: "Araç atanmadı",
    edit: "Düzenle",
    preparing: "Hazırlanıyor...",
    whatsappReset: "WhatsApp Şifre Sıfırla",
    deactivate: "Pasif Yap",

    modalEditAria: "Sürücü düzenle",
    modalCreateAria: "Yeni sürücü ekle",
    driverAccount: "SÜRÜCÜ HESABI",
    editDriver: "Sürücüyü Düzenle",
    addDriver: "Yeni Sürücü Ekle",
    modalDescription:
      "Sürücü bu bilgilerle mobil uygulamaya giriş yapacaktır.",

    fullName: "Ad Soyad",
    fullNamePlaceholder: "Sürücü adı soyadı",
    phone: "Telefon",
    email: "E-posta",
    newPasswordOptional: "Yeni şifre (isteğe bağlı)",
    temporaryPassword: "Geçici şifre",
    passwordPlaceholder: "En az 8 karakter",
    vehicle: "Araç",
    noVehicleForNow: "Şimdilik araç atama",
    accountActive: "Sürücü hesabı aktif olsun",

    mobileLogin: "Mobil uygulama girişi",
    mobileLoginDescription:
      "Sürücü telefon numarası veya e-posta adresi ile belirlediğiniz şifreyi kullanacaktır.",

    cancel: "Vazgeç",
    saving: "Kaydediliyor...",
    saveChanges: "Değişiklikleri Kaydet",
    saveDriver: "Sürücüyü Kaydet",
  },

  en: {
    loadError: "Driver information could not be loaded.",
    updated: "Driver information has been updated.",
    temporaryPasswordRequired:
      "You must enter a temporary password for the new driver.",
    created: "Driver created successfully.",
    saveError: "The driver could not be saved.",
    vehicleAssigned: "Vehicle assigned to the driver.",
    vehicleUnassigned: "Vehicle assignment removed.",
    vehicleAssignmentError: "Vehicle assignment could not be saved.",
    whatsappPhoneMissing:
      "The driver does not have a phone number for WhatsApp.",
    whatsappLinkError: "The WhatsApp link could not be created.",
    resetReadySuffix:
      "has a password reset link valid for 60 minutes.",
    resetError: "The password reset link could not be created.",
    deactivateConfirmSuffix:
      "will lose mobile access. Continue?",
    deactivated: "Driver has been deactivated.",
    deactivateError: "The driver could not be deactivated.",

    eyebrow: "TEAM MANAGEMENT",
    title: "Drivers",
    description:
      "Create driver accounts, assign vehicles and manage mobile access.",
    refresh: "Refresh",
    newDriver: "+ New Driver",

    totalDrivers: "Total Drivers",
    activeDrivers: "Active Drivers",
    assignedVehicle: "Vehicle Assigned",
    waitingVehicle: "Awaiting Vehicle",

    driverTeam: "Driver Team",
    records: "records",
    loadingDrivers: "Loading drivers...",
    noDriversTitle: "No drivers added yet",
    noDriversDescription: "Create your first driver account.",

    contact: "Contact",
    noEmail: "No email",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    vehicleAssignment: "Vehicle Assignment",
    vehicleNotAssigned: "No vehicle assigned",
    edit: "Edit",
    preparing: "Preparing...",
    whatsappReset: "Reset Password via WhatsApp",
    deactivate: "Deactivate",

    modalEditAria: "Edit driver",
    modalCreateAria: "Add new driver",
    driverAccount: "DRIVER ACCOUNT",
    editDriver: "Edit Driver",
    addDriver: "Add New Driver",
    modalDescription:
      "The driver will use these details to sign in to the mobile app.",

    fullName: "Full Name",
    fullNamePlaceholder: "Driver full name",
    phone: "Phone",
    email: "Email",
    newPasswordOptional: "New password (optional)",
    temporaryPassword: "Temporary password",
    passwordPlaceholder: "At least 8 characters",
    vehicle: "Vehicle",
    noVehicleForNow: "Do not assign a vehicle yet",
    accountActive: "Keep driver account active",

    mobileLogin: "Mobile App Login",
    mobileLoginDescription:
      "The driver will sign in with their phone number or email address and the password you set.",

    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save Changes",
    saveDriver: "Save Driver",
  },

  es: {
    loadError: "No se pudo cargar la información de los conductores.",
    updated: "La información del conductor ha sido actualizada.",
    temporaryPasswordRequired:
      "Debe introducir una contraseña temporal para el nuevo conductor.",
    created: "Conductor creado correctamente.",
    saveError: "No se pudo guardar el conductor.",
    vehicleAssigned: "Vehículo asignado al conductor.",
    vehicleUnassigned: "Asignación de vehículo eliminada.",
    vehicleAssignmentError: "No se pudo guardar la asignación del vehículo.",
    whatsappPhoneMissing:
      "El conductor no tiene un número de teléfono para WhatsApp.",
    whatsappLinkError: "No se pudo crear el enlace de WhatsApp.",
    resetReadySuffix:
      "tiene un enlace de restablecimiento de contraseña válido durante 60 minutos.",
    resetError: "No se pudo crear el enlace de restablecimiento de contraseña.",
    deactivateConfirmSuffix:
      "perderá el acceso móvil. ¿Continuar?",
    deactivated: "El conductor ha sido desactivado.",
    deactivateError: "No se pudo desactivar el conductor.",

    eyebrow: "GESTIÓN DEL EQUIPO",
    title: "Conductores",
    description:
      "Cree cuentas de conductores, asigne vehículos y gestione el acceso móvil.",
    refresh: "Actualizar",
    newDriver: "+ Nuevo Conductor",

    totalDrivers: "Total de Conductores",
    activeDrivers: "Conductores Activos",
    assignedVehicle: "Vehículo Asignado",
    waitingVehicle: "Pendiente de Vehículo",

    driverTeam: "Equipo de Conductores",
    records: "registros",
    loadingDrivers: "Cargando conductores...",
    noDriversTitle: "Aún no se han añadido conductores",
    noDriversDescription: "Cree su primera cuenta de conductor.",

    contact: "Contacto",
    noEmail: "Sin correo",
    status: "Estado",
    active: "Activo",
    inactive: "Inactivo",
    vehicleAssignment: "Asignación de Vehículo",
    vehicleNotAssigned: "Vehículo no asignado",
    edit: "Editar",
    preparing: "Preparando...",
    whatsappReset: "Restablecer Contraseña por WhatsApp",
    deactivate: "Desactivar",

    modalEditAria: "Editar conductor",
    modalCreateAria: "Añadir nuevo conductor",
    driverAccount: "CUENTA DEL CONDUCTOR",
    editDriver: "Editar Conductor",
    addDriver: "Añadir Nuevo Conductor",
    modalDescription:
      "El conductor utilizará estos datos para iniciar sesión en la aplicación móvil.",

    fullName: "Nombre Completo",
    fullNamePlaceholder: "Nombre completo del conductor",
    phone: "Teléfono",
    email: "Correo electrónico",
    newPasswordOptional: "Nueva contraseña (opcional)",
    temporaryPassword: "Contraseña temporal",
    passwordPlaceholder: "Al menos 8 caracteres",
    vehicle: "Vehículo",
    noVehicleForNow: "No asignar vehículo todavía",
    accountActive: "Mantener activa la cuenta del conductor",

    mobileLogin: "Acceso a la Aplicación Móvil",
    mobileLoginDescription:
      "El conductor iniciará sesión con su teléfono o correo electrónico y la contraseña establecida.",

    cancel: "Cancelar",
    saving: "Guardando...",
    saveChanges: "Guardar Cambios",
    saveDriver: "Guardar Conductor",
  },

  ar: {
    loadError: "تعذر تحميل معلومات السائقين.",
    updated: "تم تحديث معلومات السائق.",
    temporaryPasswordRequired:
      "يجب إدخال كلمة مرور مؤقتة للسائق الجديد.",
    created: "تم إنشاء السائق بنجاح.",
    saveError: "تعذر حفظ السائق.",
    vehicleAssigned: "تم تعيين المركبة للسائق.",
    vehicleUnassigned: "تمت إزالة تعيين المركبة.",
    vehicleAssignmentError: "تعذر حفظ تعيين المركبة.",
    whatsappPhoneMissing:
      "لا يوجد رقم هاتف للسائق لاستخدام واتساب.",
    whatsappLinkError: "تعذر إنشاء رابط واتساب.",
    resetReadySuffix:
      "لديه رابط لإعادة تعيين كلمة المرور صالح لمدة 60 دقيقة.",
    resetError: "تعذر إنشاء رابط إعادة تعيين كلمة المرور.",
    deactivateConfirmSuffix:
      "سيتم إيقاف وصوله إلى تطبيق الهاتف. هل تريد المتابعة؟",
    deactivated: "تم تعطيل السائق.",
    deactivateError: "تعذر تعطيل السائق.",

    eyebrow: "إدارة الفريق",
    title: "السائقون",
    description:
      "أنشئ حسابات السائقين وعيّن المركبات وأدر الوصول إلى تطبيق الهاتف.",
    refresh: "تحديث",
    newDriver: "+ سائق جديد",

    totalDrivers: "إجمالي السائقين",
    activeDrivers: "السائقون النشطون",
    assignedVehicle: "تم تعيين مركبة",
    waitingVehicle: "بانتظار مركبة",

    driverTeam: "فريق السائقين",
    records: "سجلات",
    loadingDrivers: "جارٍ تحميل السائقين...",
    noDriversTitle: "لم تتم إضافة سائقين بعد",
    noDriversDescription: "أنشئ أول حساب سائق.",

    contact: "التواصل",
    noEmail: "لا يوجد بريد إلكتروني",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    vehicleAssignment: "تعيين المركبة",
    vehicleNotAssigned: "لم يتم تعيين مركبة",
    edit: "تعديل",
    preparing: "جارٍ التحضير...",
    whatsappReset: "إعادة تعيين كلمة المرور عبر واتساب",
    deactivate: "تعطيل",

    modalEditAria: "تعديل السائق",
    modalCreateAria: "إضافة سائق جديد",
    driverAccount: "حساب السائق",
    editDriver: "تعديل السائق",
    addDriver: "إضافة سائق جديد",
    modalDescription:
      "سيستخدم السائق هذه البيانات لتسجيل الدخول إلى تطبيق الهاتف.",

    fullName: "الاسم الكامل",
    fullNamePlaceholder: "الاسم الكامل للسائق",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    newPasswordOptional: "كلمة مرور جديدة (اختياري)",
    temporaryPassword: "كلمة مرور مؤقتة",
    passwordPlaceholder: "8 أحرف على الأقل",
    vehicle: "المركبة",
    noVehicleForNow: "عدم تعيين مركبة الآن",
    accountActive: "إبقاء حساب السائق نشطاً",

    mobileLogin: "تسجيل الدخول إلى تطبيق الهاتف",
    mobileLoginDescription:
      "سيسجل السائق الدخول برقم الهاتف أو البريد الإلكتروني وكلمة المرور التي تحددها.",

    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    saveChanges: "حفظ التغييرات",
    saveDriver: "حفظ السائق",
  },
};

export default function SupplierDriversPage() {
  const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;

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
          t.loadError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

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
        setMessage(t.updated);
      } else {
        if (!payload.password) {
          throw new Error(
            t.temporaryPasswordRequired,
          );
        }

        await createSupplierDriver(payload);
        setMessage(t.created);
      }

      closeForm();
      await loadData();
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
          ? t.vehicleAssigned
          : t.vehicleUnassigned,
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.vehicleAssignmentError,
        ),
      );
    }
  }

  async function handlePasswordReset(driver) {
    if (!driver.phone) {
      setError(t.whatsappPhoneMissing);
      return;
    }

    setResettingDriverId(driver.id);
    setError("");
    setMessage("");

    try {
      const data = await createDriverPasswordResetLink(driver.id);

      if (!data?.whatsapp_url) {
        throw new Error(t.whatsappLinkError);
      }

      setMessage(
        `${driver.name} ${t.resetReadySuffix}`,
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
          t.resetError,
        ),
      );
    } finally {
      setResettingDriverId(null);
    }
  }

  async function handleDeactivate(driver) {
    const confirmed = window.confirm(
      `${driver.name} ${t.deactivateConfirmSuffix}`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deactivateSupplierDriver(driver.id);
      setMessage(t.deactivated);
      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          t.deactivateError,
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
            onClick={loadData}
          >
            {t.refresh}
          </button>

          <button
            className="supplier-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            {t.newDriver}
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
          label={t.totalDrivers}
          value={summary.total}
        />
        <SummaryCard
          label={t.activeDrivers}
          value={summary.active}
        />
        <SummaryCard
          label={t.assignedVehicle}
          value={summary.assigned}
        />
        <SummaryCard
          label={t.waitingVehicle}
          value={summary.waiting}
        />
      </section>

      <section className="supplier-management-card">
        <div className="supplier-section-heading">
          <div>
            <h2>{t.driverTeam}</h2>
            <p>
              {drivers.length} {t.records}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            {t.loadingDrivers}
          </div>
        ) : drivers.length === 0 ? (
          <div className="supplier-empty-state">
            <strong>{t.noDriversTitle}</strong>
            <p>{t.noDriversDescription}</p>
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
                  <span className="supplier-field-label">
                    {t.contact}
                  </span>
                  <strong>{driver.phone}</strong>
                  <small>
                    {driver.email || t.noEmail}
                  </small>
                </div>

                <div>
                  <span className="supplier-field-label">
                    {t.status}
                  </span>
                  <span
                    className={
                      driver.is_active
                        ? "supplier-driver-status active"
                        : "supplier-driver-status"
                    }
                  >
                    {driver.is_active
                      ? t.active
                      : t.inactive}
                  </span>
                </div>

                <label className="supplier-driver-vehicle-select">
                  <span className="supplier-field-label">
                    {t.vehicleAssignment}
                  </span>

                  <select
                    value={driver.vehicle_id || ""}
                    disabled={!driver.is_active}
                    onChange={(event) =>
                      handleVehicleChange(
                        driver,
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      {t.vehicleNotAssigned}
                    </option>

                    {activeVehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
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
                    {t.edit}
                  </button>

                  {driver.is_active && (
                    <button
                      className="supplier-row-button"
                      type="button"
                      disabled={resettingDriverId === driver.id}
                      onClick={() => handlePasswordReset(driver)}
                    >
                      {resettingDriverId === driver.id
                        ? t.preparing
                        : t.whatsappReset}
                    </button>
                  )}

                  {driver.is_active && (
                    <button
                      className="supplier-row-button danger"
                      type="button"
                      onClick={() => handleDeactivate(driver)}
                    >
                      {t.deactivate}
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
            aria-label={
              editingDriver
                ? t.modalEditAria
                : t.modalCreateAria
            }
          >
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">
                  {t.driverAccount}
                </span>

                <h2>
                  {editingDriver
                    ? t.editDriver
                    : t.addDriver}
                </h2>

                <p>{t.modalDescription}</p>
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
                <FormField label={t.fullName}>
                  <input
                    required
                    value={form.name}
                    placeholder={t.fullNamePlaceholder}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label={t.phone}>
                  <input
                    required
                    value={form.phone}
                    placeholder="+90 5XX XXX XX XX"
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label={t.email}>
                  <input
                    type="email"
                    value={form.email}
                    placeholder="driver@company.com"
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField
                  label={
                    editingDriver
                      ? t.newPasswordOptional
                      : t.temporaryPassword
                  }
                >
                  <input
                    type="password"
                    required={!editingDriver}
                    minLength="8"
                    value={form.password}
                    placeholder={t.passwordPlaceholder}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                <FormField label={t.vehicle}>
                  <select
                    value={form.vehicle_id}
                    onChange={(event) =>
                      updateField(
                        "vehicle_id",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      {t.noVehicleForNow}
                    </option>

                    {activeVehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
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
                      updateField(
                        "is_active",
                        event.target.checked,
                      )
                    }
                  />

                  <span>{t.accountActive}</span>
                </label>
              </div>

              <div className="supplier-driver-login-info">
                <strong>{t.mobileLogin}</strong>
                <p>{t.mobileLoginDescription}</p>
              </div>

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
                    : editingDriver
                      ? t.saveChanges
                      : t.saveDriver}
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

function getInitials(name) {
  return String(name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
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
