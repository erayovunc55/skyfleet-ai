import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import writeExcelFile from "write-excel-file/browser";

import SupplierTransferAssignment from "../components/SupplierTransferAssignment";
import SupplierTransferTable from "../components/SupplierTransferTable";
import { useLanguage } from "../i18n";
import {
  getSupplierProfile,
  getSupplierTransfer,
  getSupplierTransfers,
} from "../services/supplierService";

const STATUS_LABELS = {
  tr: {
    pending: "Bekliyor",
    accepted: "Kabul Edildi",
    on_the_way: "Yola Çıktı",
    arrived: "Alış Noktasında",
    passenger_called: "Yolcu Arandı",
    passenger_on_board: "Yolcu Araçta",
    trip_started: "Transfer Başladı",
    completed: "Tamamlandı",
    no_show: "No Show",
    cancelled: "İptal Edildi",
  },

  en: {
    pending: "Waiting",
    accepted: "Accepted",
    on_the_way: "On the Way",
    arrived: "At Pickup Point",
    passenger_called: "Passenger Called",
    passenger_on_board: "Passenger On Board",
    trip_started: "Transfer Started",
    completed: "Completed",
    no_show: "No Show",
    cancelled: "Cancelled",
  },

  es: {
    pending: "Pendiente",
    accepted: "Aceptado",
    on_the_way: "En camino",
    arrived: "En el punto de recogida",
    passenger_called: "Pasajero contactado",
    passenger_on_board: "Pasajero a bordo",
    trip_started: "Traslado iniciado",
    completed: "Completado",
    no_show: "No presentado",
    cancelled: "Cancelado",
  },

  ar: {
    pending: "قيد الانتظار",
    accepted: "تم القبول",
    on_the_way: "في الطريق",
    arrived: "في نقطة الاستلام",
    passenger_called: "تم الاتصال بالمسافر",
    passenger_on_board: "المسافر داخل المركبة",
    trip_started: "بدأت الرحلة",
    completed: "مكتمل",
    no_show: "عدم حضور",
    cancelled: "ملغي",
  },
};
const TEXT = {
  tr: {
    supplier: "Tedarikçi",
    logout: "Çıkış",
    operation: "OPERASYON",
    dashboardTitle: "Tedarikçi Paneli",
    dashboardDescription:
      "Atanan transferlerinizi, görevli sürücülerinizi ve net hakedişlerinizi yönetin.",

    exportExcel: "Excel’e Aktar",
    preparingExcel: "Excel hazırlanıyor...",
    refresh: "Yenile",

    totalTransfers: "Toplam Transfer",
    waiting: "Bekleyen",
    activeOperations: "Aktif Operasyon",
    completed: "Tamamlanan",
    netEarnings: "Net Hakediş",

    searchTransfers: "Transfer ara",
    searchPlaceholder:
      "SF numarası, yolcu, telefon veya uçuş...",
    status: "Durum",
    allStatuses: "Tüm durumlar",
    start: "Başlangıç",
    end: "Bitiş",
    clear: "Temizle",

    assignedTransfers: "Atanan Transferler",
    records: "kayıt",
    loadingTransfers: "Transferler yükleniyor...",
    noTransfers: "Atanmış transfer bulunmuyor.",
    passengerNotSpecified: "Yolcu belirtilmedi",

    transferDetail: "Transfer Detayı",
    selectTransfer:
      "Detayları görmek için bir transfer seçin.",
    loadingDetail: "Detay yükleniyor...",

    pickupTime: "Alış zamanı",
    vehicleType: "Araç tipi",
    flight: "Uçuş",
    noFlight: "Uçuş yok",
    passenger: "Yolcu",
    fullName: "Ad Soyad",
    phone: "Telefon",
    luggage: "Bagaj",

    route: "Güzergâh",
    pickup: "Alış",
    dropoff: "Bırakış",
    meetingPoint: "Buluşma noktası",

    assigned: "Görevli",
    driver: "Sürücü",
    driverPhone: "Sürücü telefonu",
    vehicle: "Araç",

    notSpecified: "Belirtilmedi",
    notAssignedYet: "Henüz atanmadı",
    vehicleNotAssigned: "Araç atanmadı",
    dateNotSpecified: "Tarih belirtilmedi",

    adults: "yetişkin",
    children: "çocuk",
    babies: "bebek",

    cancelledTitle: "Transfer iptal edildi",
    cancellationReasonMissing:
      "İptal nedeni belirtilmedi.",

    readiness: "OPERASYONA HAZIRLIK",
    readinessTitle: "Tedarikçi Kurulum Durumu",
    readinessDescription:
      "Operasyon öncesi temel hazırlık adımlarınızı tamamlayın.",
    ready: "hazır",
        companyApproval: "Şirket Onayı",
    companyApprovalDescription:
      "Tedarikçi başvurunuz Skyfleet tarafından onaylandı.",

    documents: "Belgeler",
    documentsDescription:
      "Zorunlu şirket, vergi ve sigorta belgeleri tamamlandı.",

    coverageArea: "Kapsama Alanı",
    coverageAreaDescription:
      "Hizmet verdiğiniz bölge ve havalimanlarını tanımlayın.",

    vehicles: "Araçlar",
    vehiclesDescription:
      "Operasyonda kullanacağınız en az bir araç ekleyin.",

    drivers: "Sürücüler",
    driversDescription:
      "Operasyonda görev alacak en az bir sürücü ekleyin.",

    loadError: "Tedarikçi bilgileri yüklenemedi.",
    detailError: "Transfer detayı yüklenemedi.",
    excelError: "Excel dosyası oluşturulamadı.",
  },

  en: {
    supplier: "Supplier",
    logout: "Logout",
    operation: "OPERATIONS",
    dashboardTitle: "Supplier Dashboard",
    dashboardDescription:
      "Manage your assigned transfers, drivers and net earnings.",

    exportExcel: "Export to Excel",
    preparingExcel: "Preparing Excel...",
    refresh: "Refresh",

    totalTransfers: "Total Transfers",
    waiting: "Waiting",
    activeOperations: "Active Operations",
    completed: "Completed",
    netEarnings: "Net Earnings",

    searchTransfers: "Search transfers",
    searchPlaceholder:
      "SF reference, passenger, phone or flight...",
    status: "Status",
    allStatuses: "All statuses",
    start: "Start",
    end: "End",
    clear: "Clear",

    assignedTransfers: "Assigned Transfers",
    records: "records",
    loadingTransfers: "Loading transfers...",
    noTransfers: "No assigned transfers found.",
    passengerNotSpecified: "Passenger not specified",

    transferDetail: "Transfer Details",
    selectTransfer:
      "Select a transfer to view its details.",
    loadingDetail: "Loading details...",

    pickupTime: "Pickup time",
    vehicleType: "Vehicle type",
    flight: "Flight",
    noFlight: "No flight",
    passenger: "Passenger",
    fullName: "Full name",
    phone: "Phone",
    luggage: "Luggage",

    route: "Route",
    pickup: "Pickup",
    dropoff: "Drop-off",
    meetingPoint: "Meeting point",

    assigned: "Assignment",
    driver: "Driver",
    driverPhone: "Driver phone",
    vehicle: "Vehicle",

    notSpecified: "Not specified",
    notAssignedYet: "Not assigned yet",
    vehicleNotAssigned: "Vehicle not assigned",
    dateNotSpecified: "Date not specified",

    adults: "adults",
    children: "children",
    babies: "infants",

    cancelledTitle: "Transfer cancelled",
    cancellationReasonMissing:
      "No cancellation reason provided.",

    readiness: "OPERATIONAL READINESS",
    readinessTitle: "Supplier Setup Status",
    readinessDescription:
      "Complete the essential steps before starting operations.",
    ready: "ready",

    loadError: "Supplier information could not be loaded.",
    detailError: "Transfer details could not be loaded.",
    excelError: "Excel file could not be created.",
    companyApproval: "Company Approval",
companyApprovalDescription:
  "Your supplier application has been approved by Skyfleet.",

documents: "Documents",
documentsDescription:
  "Required company, tax and insurance documents are complete.",

coverageArea: "Coverage Area",
coverageAreaDescription:
  "Define the regions and airports you serve.",

vehicles: "Vehicles",
vehiclesDescription:
  "Add at least one vehicle for your operations.",

drivers: "Drivers",
driversDescription:
  "Add at least one driver for your operations.",
  },

  es: {
    supplier: "Proveedor",
    logout: "Cerrar sesión",
    operation: "OPERACIONES",
    dashboardTitle: "Panel del Proveedor",
    dashboardDescription:
      "Gestiona tus traslados asignados, conductores y ganancias netas.",

    exportExcel: "Exportar a Excel",
    preparingExcel: "Preparando Excel...",
    refresh: "Actualizar",

    totalTransfers: "Traslados Totales",
    waiting: "Pendientes",
    activeOperations: "Operaciones Activas",
    completed: "Completados",
    netEarnings: "Ganancias Netas",

    searchTransfers: "Buscar traslados",
    searchPlaceholder:
      "Referencia SF, pasajero, teléfono o vuelo...",
    status: "Estado",
    allStatuses: "Todos los estados",
    start: "Inicio",
    end: "Fin",
    clear: "Limpiar",

    assignedTransfers: "Traslados Asignados",
    records: "registros",
    loadingTransfers: "Cargando traslados...",
    noTransfers: "No se encontraron traslados asignados.",
    passengerNotSpecified: "Pasajero no especificado",

    transferDetail: "Detalles del Traslado",
    selectTransfer:
      "Selecciona un traslado para ver los detalles.",
    loadingDetail: "Cargando detalles...",

    pickupTime: "Hora de recogida",
    vehicleType: "Tipo de vehículo",
    flight: "Vuelo",
    noFlight: "Sin vuelo",
    passenger: "Pasajero",
    fullName: "Nombre completo",
    phone: "Teléfono",
    luggage: "Equipaje",

    route: "Ruta",
    pickup: "Recogida",
    dropoff: "Destino",
    meetingPoint: "Punto de encuentro",

    assigned: "Asignación",
    driver: "Conductor",
    driverPhone: "Teléfono del conductor",
    vehicle: "Vehículo",

    notSpecified: "No especificado",
    notAssignedYet: "Aún no asignado",
    vehicleNotAssigned: "Vehículo no asignado",
    dateNotSpecified: "Fecha no especificada",

    adults: "adultos",
    children: "niños",
    babies: "bebés",

    cancelledTitle: "Traslado cancelado",
    cancellationReasonMissing:
      "No se indicó el motivo de cancelación.",

    readiness: "PREPARACIÓN OPERATIVA",
    readinessTitle: "Estado de Configuración",
    readinessDescription:
      "Completa los pasos esenciales antes de iniciar las operaciones.",
    ready: "listo",

    loadError: "No se pudo cargar la información del proveedor.",
    detailError: "No se pudieron cargar los detalles del traslado.",
    excelError: "No se pudo crear el archivo Excel.",
    companyApproval: "Aprobación de la Empresa",
companyApprovalDescription:
  "Su solicitud como proveedor ha sido aprobada por Skyfleet.",

documents: "Documentos",
documentsDescription:
  "Los documentos obligatorios de empresa, impuestos y seguros están completos.",

coverageArea: "Área de Cobertura",
coverageAreaDescription:
  "Defina las regiones y aeropuertos donde presta servicio.",

vehicles: "Vehículos",
vehiclesDescription:
  "Añada al menos un vehículo para sus operaciones.",

drivers: "Conductores",
driversDescription:
  "Añada al menos un conductor para sus operaciones.",
  },

  ar: {
    supplier: "المورد",
    logout: "تسجيل الخروج",
    operation: "العمليات",
    dashboardTitle: "لوحة المورد",
    dashboardDescription:
      "إدارة الرحلات المخصصة والسائقين وصافي المستحقات.",

    exportExcel: "تصدير إلى Excel",
    preparingExcel: "جارٍ إعداد Excel...",
    refresh: "تحديث",

    totalTransfers: "إجمالي الرحلات",
    waiting: "قيد الانتظار",
    activeOperations: "العمليات النشطة",
    completed: "المكتملة",
    netEarnings: "صافي المستحقات",

    searchTransfers: "البحث في الرحلات",
    searchPlaceholder:
      "مرجع SF أو المسافر أو الهاتف أو الرحلة...",
    status: "الحالة",
    allStatuses: "جميع الحالات",
    start: "البداية",
    end: "النهاية",
    clear: "مسح",

    assignedTransfers: "الرحلات المخصصة",
    records: "سجلات",
    loadingTransfers: "جارٍ تحميل الرحلات...",
    noTransfers: "لا توجد رحلات مخصصة.",
    passengerNotSpecified: "لم يتم تحديد المسافر",

    transferDetail: "تفاصيل الرحلة",
    selectTransfer:
      "اختر رحلة لعرض التفاصيل.",
    loadingDetail: "جارٍ تحميل التفاصيل...",

    pickupTime: "وقت الاستلام",
    vehicleType: "نوع المركبة",
    flight: "الرحلة",
    noFlight: "لا توجد رحلة",
    passenger: "المسافر",
    fullName: "الاسم الكامل",
    phone: "الهاتف",
    luggage: "الأمتعة",

    route: "المسار",
    pickup: "الاستلام",
    dropoff: "الوجهة",
    meetingPoint: "نقطة اللقاء",

    assigned: "التعيين",
    driver: "السائق",
    driverPhone: "هاتف السائق",
    vehicle: "المركبة",

    notSpecified: "غير محدد",
    notAssignedYet: "لم يتم التعيين بعد",
    vehicleNotAssigned: "لم يتم تعيين مركبة",
    dateNotSpecified: "لم يتم تحديد التاريخ",

    adults: "بالغ",
    children: "طفل",
    babies: "رضيع",

    cancelledTitle: "تم إلغاء الرحلة",
    cancellationReasonMissing:
      "لم يتم تحديد سبب الإلغاء.",

    readiness: "الجاهزية التشغيلية",
    readinessTitle: "حالة إعداد المورد",
    readinessDescription:
      "أكمل الخطوات الأساسية قبل بدء العمليات.",
    ready: "جاهز",

    loadError: "تعذر تحميل معلومات المورد.",
    detailError: "تعذر تحميل تفاصيل الرحلة.",
    excelError: "تعذر إنشاء ملف Excel.",
    companyApproval: "اعتماد الشركة",
companyApprovalDescription:
  "تمت الموافقة على طلب المورد الخاص بك من قبل Skyfleet.",

documents: "المستندات",
documentsDescription:
  "تم استكمال مستندات الشركة والضرائب والتأمين المطلوبة.",

coverageArea: "منطقة التغطية",
coverageAreaDescription:
  "حدد المناطق والمطارات التي تقدم فيها خدماتك.",

vehicles: "المركبات",
vehiclesDescription:
  "أضف مركبة واحدة على الأقل لعملياتك.",

drivers: "السائقون",
driversDescription:
  "أضف سائقاً واحداً على الأقل لعملياتك.",
  },
};
export default function SupplierDashboardPage({
  user,
  onLogout,
}) {
    const { language } = useLanguage();
  const t = TEXT[language] || TEXT.en;
  const statusLabels =
    STATUS_LABELS[language] ||
    STATUS_LABELS.en;

  const locale =
    {
      tr: "tr-TR",
      en: "en-GB",
      es: "es-ES",
      ar: "ar-SA",
    }[language] || "en-GB";
  const [profile, setProfile] =
    useState(null);

  const [transfers, setTransfers] =
    useState([]);

  const [
    selectedTransfer,
    setSelectedTransfer,
  ] = useState(null);

  const [filters, setFilters] =
    useState({
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });

    const [loading, setLoading] =
    useState(true);

  const [exporting, setExporting] =
    useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const loadData = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          profileData,
          transferData,
        ] = await Promise.all([
          getSupplierProfile(),

          getSupplierTransfers(
            filters,
          ),
        ]);

        const items = Array.isArray(
          transferData?.data,
        )
          ? transferData.data
          : [];

        setProfile(
          profileData,
        );

        setTransfers(
          items,
        );

        setSelectedTransfer(
          (current) => {
            if (!current) {
              return null;
            }

            return (
              items.find(
                (item) =>
                  Number(item.id) ===
                  Number(current.id),
              ) || null
            );
          },
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Tedarikçi bilgileri yüklenemedi.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total:
        transfers.length,

      waiting:
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "pending",
        ).length,

      active:
        transfers.filter(
          (transfer) =>
            [
              "accepted",
              "on_the_way",
              "arrived",
              "passenger_called",
              "passenger_on_board",
              "trip_started",
            ].includes(
              transfer.status,
            ),
        ).length,

      completed:
        transfers.filter(
          (transfer) =>
            transfer.status ===
            "completed",
        ).length,

      totalAmount:
        transfers.reduce(
          (total, transfer) =>
            total +
            Number(
              transfer
                .supplier_amount ||
                0,
            ),
          0,
        ),
    }),
    [transfers],
  );

  async function selectTransfer(
    transfer,
  ) {
    setSelectedTransfer(
      transfer,
    );

    setDetailLoading(true);
    setError("");

    try {
      const detail =
        await getSupplierTransfer(
          transfer.id,
        );

      setSelectedTransfer(
        detail,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer detayı yüklenemedi.",
        ),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function handleTransferAssigned(
    updatedTransfer,
  ) {
    if (!updatedTransfer) {
      return;
    }

    setSelectedTransfer(
      updatedTransfer,
    );

    setTransfers(
      (currentTransfers) =>
        currentTransfers.map(
          (transfer) =>
            Number(transfer.id) ===
            Number(
              updatedTransfer.id,
            )
              ? {
                  ...transfer,
                  ...updatedTransfer,
                }
              : transfer,
        ),
    );
  }

  function updateFilter(
    name,
    value,
  ) {
    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function clearFilters() {
    setFilters({
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  }

    async function handleExportToExcel() {
    if (transfers.length === 0 || exporting) {
      return;
    }

    setExporting(true);
    setError("");

    try {
      const headerStyle = {
        fontWeight: "bold",
        textColor: "#FFFFFF",
        backgroundColor: "#0F4C81",
        align: "center",
        wrap: true,
      };

      const headers = [
        "SF Referansı",
        "Alış Tarihi",
        "Yolcu",
        "Telefon",
        "Alış Adresi",
        "Bırakış Adresi",
        "Uçuş",
        "Araç Tipi",
        "Yetişkin",
        "Çocuk",
        "Bebek",
        "Bagaj",
        "Sürücü",
        "Sürücü Telefonu",
        "Araç / Plaka",
        "Durum",
        "Net Hakediş",
        "Para Birimi",
        "Tamamlanma Tarihi",
      ].map((value) => ({
        value,
        ...headerStyle,
      }));

      const rows = transfers.map((transfer) => [
        transfer.booking_reference || `#${transfer.id}`,
        makeExcelDateCell(transfer.pickup_time),
        transfer.passenger_name || "",
        String(transfer.passenger_phone || ""),
        transfer.pickup || "",
        transfer.dropoff || "",
        transfer.flight_number || "",
        transfer.vehicle_type || "",
        Number(transfer.adult || 0),
        Number(transfer.child || 0),
        Number(transfer.baby || 0),
        Number(transfer.luggage_count || 0),
        transfer.driver?.name || "",
        String(transfer.driver?.phone || ""),
        getAssignedVehicleLabel(transfer),
        statusLabels[transfer.status] || transfer.status || "",
        {
          value: Number(transfer.supplier_amount || 0),
          type: Number,
          format: "#,##0.00",
        },
        transfer.currency || "EUR",
        makeExcelDateCell(
          transfer.completed_at ||
          transfer.completion_time,
        ),
      ]);

      const companyName =
        company?.company_name ||
        user?.name ||
        "supplier";

      const dateLabel = [
        filters.dateFrom,
        filters.dateTo,
      ].filter(Boolean).join("_") ||
        new Date().toISOString().slice(0, 10);

      const fileName = `${sanitizeFileName(companyName)}_transferler_${dateLabel}.xlsx`;

      await writeExcelFile(
        [headers, ...rows],
      ).toFile(fileName);
    } catch (exportError) {
      setError(
        exportError?.message ||
        "Excel dosyası oluşturulamadı.",
      );
    } finally {
      setExporting(false);
    }
  }

  const company =
    profile?.supplier ||
    user?.supplier_company;

  return (
    <div className="supplier-app-shell">
      <header className="supplier-header">
        <div className="supplier-header-brand">
          <div className="supplier-brand-logo">
            SF
          </div>

          <div>
            <strong>
              SKYFLEET
              <span> AI</span>
            </strong>

            <small>
              Supplier Network
            </small>
          </div>
        </div>

        <div className="supplier-header-user">
          <div>
            <strong>
              {company
                ?.company_name ||
                user?.name}
            </strong>

            <small>
  {t.supplier}
</small>
          </div>

          <button
            type="button"
            onClick={
              onLogout
            }
          >
            {t.logout}
          </button>
        </div>
      </header>

      <main className="supplier-dashboard">
        <section className="supplier-page-heading">
          <div>
            <span className="supplier-eyebrow">
              {t.operation}
            </span>

            <h1>
              {t.dashboardTitle}
            </h1>

            <p>
              {t.dashboardDescription}
            </p>
          </div>

                    <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="supplier-secondary-button"
              type="button"
              disabled={loading || exporting || transfers.length === 0}
              onClick={handleExportToExcel}
            >
              {exporting ? t.preparingExcel : t.exportExcel}
            </button>

            <button
              className="supplier-secondary-button"
              type="button"
              disabled={loading}
              onClick={loadData}
            >
              {t.refresh}
            </button>
          </div>
        </section>

        {error && (
          <div className="supplier-message error">
            {error}
          </div>
        )}
        {company?.onboarding && (
  <SupplierReadinessCard
    onboarding={company.onboarding}
    t={t}
  />
)}

        <section className="supplier-summary-grid">
          <SummaryCard
            label={t.totalTransfers}
            value={summary.total}
          />

          <SummaryCard
            label={t.waiting}
            value={summary.waiting}
          />

          <SummaryCard
            label={t.activeOperations}
            value={summary.active}
          />

          <SummaryCard
            label={t.completed}
            value={summary.completed}
          />

          <SummaryCard
            label={t.netEarnings}
           value={formatMoney(
  summary.totalAmount,
  transfers[0]
    ?.currency ||
    company
      ?.default_currency ||
    "EUR",
  locale,
)}
            accent
          />
        </section>

        <section className="supplier-filter-card">
          <label>
            <span>
              {t.searchTransfers}
            </span>

            <input
              type="search"
              value={
                filters.search
              }
              placeholder={t.searchPlaceholder}
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>{t.status}</span>

            <select
              value={
                filters.status
              }
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value,
                )
              }
            >
              <option value="">
                {t.allStatuses}
              </option>

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

          <label>
            <span>{t.start}</span>

            <input
              type="date"
              value={
                filters.dateFrom
              }
              onChange={(event) =>
                updateFilter(
                  "dateFrom",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>{t.end}</span>

            <input
              type="date"
              value={
                filters.dateTo
              }
              onChange={(event) =>
                updateFilter(
                  "dateTo",
                  event.target.value,
                )
              }
            />
          </label>

          <button
            type="button"
            onClick={
              clearFilters
            }
          >
            {t.clear}
          </button>
        </section>

        <section className="supplier-content-grid">
          <div className="supplier-transfer-card">
            <div className="supplier-section-heading">
              <div>
                <h2>
                  {t.assignedTransfers}
                </h2>

                <p>
                  {transfers.length}
{" "}
{t.records}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="supplier-empty-state">
            {t.loadingTransfers}
              </div>
            ) : transfers.length ===
              0 ? (
              <div className="supplier-empty-state">
                {t.noTransfers}
              </div>
            ) : (
              <SupplierTransferTable
                transfers={transfers}
                selectedId={selectedTransfer?.id}
                onSelect={selectTransfer}
                onAssigned={handleTransferAssigned}
                statusLabels={statusLabels}
                locale={locale}
              />
            )}
          </div>

          <TransferDetailPanel
            transfer={
              selectedTransfer
            }
            loading={
              detailLoading
            }
            onAssigned={
              handleTransferAssigned
            }
            
              statusLabels={
    statusLabels
  }
  t={t}
locale={locale}
            onClose={() =>
              setSelectedTransfer(
                null,
              )
            }
          />
        </section>
      </main>
    </div>
  );
}

function SupplierReadinessCard({
  onboarding,
  t,
}) {
  const percentage = Number(
    onboarding?.readiness_percentage || 0,
  );

  const steps = [
  {
    label: t.companyApproval,
    description:
      t.companyApprovalDescription,
    complete:
      Boolean(
        onboarding?.company_approved,
      ),
  },
  {
    label: t.documents,
    description:
      t.documentsDescription,
    complete:
      Boolean(
        onboarding
          ?.required_documents_complete,
      ),
  },
  {
    label: t.coverageArea,
    description:
      t.coverageAreaDescription,
    complete:
      Number(
        onboarding?.coverages_count || 0,
      ) > 0,
  },
  {
    label: t.vehicles,
    description:
      t.vehiclesDescription,
    complete:
      Number(
        onboarding?.vehicles_count || 0,
      ) > 0,
  },
  {
    label: t.drivers,
    description:
      t.driversDescription,
    complete:
      Number(
        onboarding?.drivers_count || 0,
      ) > 0,
  },
];

  return (
    <section className="supplier-readiness-card">
      <div className="supplier-readiness-heading">
        <div>
          <span className="supplier-eyebrow">
            {t.readiness}
          </span>

          <h2>
            {t.readinessTitle}
          </h2>

          <p>
            {t.readinessDescription}
            
          </p>
        </div>

        <div className="supplier-readiness-score">
          <strong>
            %{percentage}
          </strong>

          <span>
            {t.ready}
          </span>
        </div>
      </div>

      <div className="supplier-readiness-progress">
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(0, percentage),
            )}%`,
          }}
        />
      </div>

      <div className="supplier-readiness-steps">
        {steps.map((step) => (
          <article
            key={step.label}
            className={
              step.complete
                ? "supplier-readiness-step complete"
                : "supplier-readiness-step"
            }
          >
            <span>
              {step.complete ? "✓" : "○"}
            </span>

            <div>
              <strong>
                {step.label}
              </strong>

              <p>
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function SummaryCard({
  label,
  value,
  accent = false,
}) {
  return (
    <article
      className={
        accent
          ? "supplier-summary-card accent"
          : "supplier-summary-card"
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function StatusBadge({
  status,
  statusLabels,
}) {
  return (
    <span
      className={`supplier-status supplier-status-${status}`}
    >
      {statusLabels?.[status] || status}
    </span>
  );
}

function TransferDetailPanel({
  transfer,
  loading,
  onAssigned,
  onClose,
  statusLabels,
  t,
  locale,
}) {
  if (!transfer) {
    return (
      <aside className="supplier-detail-card empty">
        <div>
          <h2>
            {t.transferDetail}
          </h2>

          <p>
            {t.selectTransfer}
            
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="supplier-detail-card">
      <div className="supplier-detail-header">
        <div>
          <span className="supplier-eyebrow">
            {t.transferDetail.toUpperCase()}
          </span>

          <h2>
            {
              transfer
                .booking_reference
            }
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="supplier-empty-state">
          {t.loadingDetail}
        </div>
      ) : (
        <>
          <div className="supplier-payment-box">
            <span>
              {t.netEarnings}
            </span>

            <strong>
              {formatMoney(
  transfer
    .supplier_amount,
  transfer.currency,
  locale,
)}
            </strong>
          </div>

          <SupplierTransferAssignment
            transfer={transfer}
            onAssigned={
              onAssigned
            }
          />

          <DetailSection title={t.operation}>
            <DetailRow
              label={t.status}
              value={
                statusLabels?.[
  transfer.status
] ||
transfer.status
              }
            />

            <DetailRow
              label={t.pickupTime}
              value={formatDateTime(
  transfer.pickup_time,
  locale,
  t.dateNotSpecified,
)}
            />

            <DetailRow
              label={t.vehicleType}
              value={
                transfer.vehicle_type ||
t.notSpecified
              }
              fallback={t.notSpecified}
            />

            <DetailRow
              label={t.flight}
              value={
                transfer
                  .flight_number ||
                t.noFlight
              }
            />
          </DetailSection>

          <DetailSection title={t.passenger}>
            <DetailRow
              label={t.fullName}
              value={
                transfer
                  .passenger_name ||
                t.notSpecified
              }
              fallback={t.notSpecified}
            />

            <DetailRow
  label={t.phone}
  value={
    transfer
      .passenger_phone
  }
  fallback={t.notSpecified}
/>

            <DetailRow
              label={t.passenger}
value={`${transfer.adult || 0} ${t.adults}, ${transfer.child || 0} ${t.children}, ${transfer.baby || 0} ${t.babies}`}
              
            />

            <DetailRow
              label={t.luggage}
              value={
                transfer
                  .luggage_count ??
                0
              }
              fallback={t.notSpecified}
            />
          </DetailSection>

          <DetailSection title={t.route}>
            <DetailRow
              label={t.pickup}
              value={
                transfer.pickup ||
                t.notSpecified
              }
              fallback={t.notSpecified}
            />

            <DetailRow
              label={t.dropoff}
              value={
                transfer.dropoff ||
                t.notSpecified
              }
              fallback={t.notSpecified}
            />

            <DetailRow
              label={t.meetingPoint}
              value={
                transfer
                  .meet_point ||
                t.notSpecified
              }
              fallback={t.notSpecified}
            />
          </DetailSection>

          <DetailSection title={t.assigned}>
            <DetailRow
              label={t.driver}
              value={
                transfer.driver
                  ?.name ||
                t.notAssignedYet
              }
              fallback={t.notSpecified}
            />

            <DetailRow
              label={t.driverPhone}
              value={
                transfer.driver
                  ?.phone ||
                t.notSpecified
              }
              fallback={t.notSpecified}
            />

            <DetailRow
  label={t.vehicle}
  value={getAssignedVehicleLabel(
    transfer,
    t.vehicleNotAssigned,
  )}
  fallback={t.notSpecified}
/>
          </DetailSection>

          {transfer.status ===
            "cancelled" && (
            <div className="supplier-cancellation-box">
              <strong>
                {t.cancelledTitle}
              </strong>

              <p>
                {transfer
                  .cancellation_reason ||
                  t.cancellationReasonMissing}
              </p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function DetailSection({
  title,
  children,
}) {
  return (
    <section className="supplier-detail-section">
      <h3>
        {title}
      </h3>

      <div>
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  fallback = "Not specified",
}) {
  return (
    <div className="supplier-detail-row">
      <span>
        {label}
      </span>

      <strong>
        {value ?? fallback}
        
      </strong>
    </div>
  );
}

function getAssignedVehicleLabel(
  transfer,
  fallback = "Vehicle not assigned",
) {
  const vehicle =
    transfer
      ?.assigned_vehicle ||
    transfer
      ?.driver?.vehicle;

  if (!vehicle) {
    return fallback;
  }

  const details = [
    vehicle.plate ||
      vehicle.license_plate,

    vehicle.brand,

    vehicle.model,
  ].filter(Boolean);

  return details.join(" — ");
}

function formatMoney(
  value,
  currency = "EUR",
  locale = "en-GB",
) {
  const amount = Number(
    value || 0,
  );

  try {
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDateTime(
  value,
  locale = "en-GB",
  emptyLabel = "Date not specified",
) {
  if (!value) {
    return emptyLabel;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    locale,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function makeExcelDateCell(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return {
    value: date,
    type: Date,
    format: "dd/mm/yyyy hh:mm",
  };
}

function sanitizeFileName(value) {
  return String(value || "supplier")
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "_");
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response?.data
      ?.errors;

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
    error?.response?.data
      ?.message ||
    error?.message ||
    fallback
  );
}