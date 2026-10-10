/* eslint-disable react/only-export-components -- provider module intentionally exports helpers and its hook */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "skyfleet_language";

export const LANGUAGES = [
  {
    code: "tr",
    label: "Türkçe",
  },
  {
    code: "en",
    label: "English",
  },
  {
    code: "ar",
    label: "العربية",
  },
  {
    code: "es",
    label: "Español",
  },
];

const phrases = {
  /* --------------------------------------------------
   * GENERAL / NAVIGATION
   * -------------------------------------------------- */

  "Açık İşler": {
    en: "Open Jobs",
    ar: "الوظائف المتاحة",
    es: "Trabajos disponibles",
  },

  "Transferlerim": {
    en: "My Transfers",
    ar: "تحويلاتي",
    es: "Mis traslados",
  },

  Transferler: {
    en: "Transfers",
    ar: "التحويلات",
    es: "Traslados",
  },

  Geçmiş: {
    en: "History",
    ar: "السجل",
    es: "Historial",
  },

  "Geçmiş Transferler": {
    en: "Transfer History",
    ar: "سجل التحويلات",
    es: "Historial de traslados",
  },

  Sürücüler: {
    en: "Drivers",
    ar: "السائقون",
    es: "Conductores",
  },

  Araçlar: {
    en: "Vehicles",
    ar: "المركبات",
    es: "Vehículos",
  },

  "Kapsama Alanları": {
    en: "Coverage Areas",
    ar: "مناطق التغطية",
    es: "Áreas de cobertura",
  },

  Hakedişlerim: {
    en: "Earnings",
    ar: "المستحقات",
    es: "Liquidaciones",
  },

  Faturalar: {
    en: "Invoices",
    ar: "الفواتير",
    es: "Facturas",
  },

  Tedarikçi: {
    en: "Supplier",
    ar: "المورّد",
    es: "Proveedor",
  },

  Çıkış: {
    en: "Logout",
    ar: "تسجيل الخروج",
    es: "Salir",
  },

  Language: {
    en: "Language",
    ar: "اللغة",
    es: "Idioma",
  },

  /* --------------------------------------------------
   * JOB MARKET
   * -------------------------------------------------- */

  "SKYFLEET JOB MARKET": {
    en: "SKYFLEET JOB MARKET",
    ar: "سوق وظائف SKYFLEET",
    es: "MERCADO DE TRABAJOS SKYFLEET",
  },

  "Canlı Havuz": {
    en: "Live Pool",
    ar: "المجموعة المباشرة",
    es: "Bolsa en vivo",
  },

  "Havuzu Yenile": {
    en: "Refresh Pool",
    ar: "تحديث المجموعة",
    es: "Actualizar bolsa",
  },

  "Açık İş": {
    en: "Open Jobs",
    ar: "الوظائف المتاحة",
    es: "Trabajos disponibles",
  },

  "Potansiyel Hakediş": {
    en: "Potential Earnings",
    ar: "المستحقات المحتملة",
    es: "Ganancias potenciales",
  },

  "Atama Modeli": {
    en: "Assignment Model",
    ar: "نموذج التعيين",
    es: "Modelo de asignación",
  },

  "First Accept": {
    en: "First Accept",
    ar: "الأولوية لأول قبول",
    es: "Primera aceptación",
  },

  "İlk uygun kabul işlemi kazanır": {
    en: "First eligible acceptance wins",
    ar: "أول قبول مؤهل يفوز",
    es: "La primera aceptación válida gana",
  },

  "Şu an kabul edilebilir": {
    en: "Available for acceptance now",
    ar: "متاح للقبول الآن",
    es: "Disponible para aceptar ahora",
  },

  "Görünen açık işlerin toplamı": {
    en: "Total value of visible open jobs",
    ar: "إجمالي قيمة الوظائف المتاحة",
    es: "Valor total de los trabajos disponibles",
  },

  "İş kabul edildi": {
    en: "Job accepted",
    ar: "تم قبول المهمة",
    es: "Trabajo aceptado",
  },

  "İşlem tamamlanamadı": {
    en: "Operation could not be completed",
    ar: "تعذر إكمال العملية",
    es: "No se pudo completar la operación",
  },

  "Açık işler yükleniyor...": {
    en: "Loading open jobs...",
    ar: "جارٍ تحميل الوظائف المتاحة...",
    es: "Cargando trabajos disponibles...",
  },

  "Şu anda uygun açık iş yok": {
    en: "No suitable open jobs right now",
    ar: "لا توجد وظائف مناسبة حالياً",
    es: "No hay trabajos disponibles adecuados",
  },

  "NET HAKEDİŞ": {
    en: "NET EARNINGS",
    ar: "صافي المستحقات",
    es: "GANANCIA NETA",
  },

  "Net Hakediş": {
    en: "Net Earnings",
    ar: "صافي المستحقات",
    es: "Ganancia neta",
  },

  Uyum: {
    en: "Match",
    ar: "تطابق",
    es: "Compatibilidad",
  },

  "Önerilen araç": {
    en: "Recommended vehicle",
    ar: "المركبة المقترحة",
    es: "Vehículo recomendado",
  },

  "Operasyonel kapsama uyumu": {
    en: "Operational coverage match",
    ar: "توافق التغطية التشغيلية",
    es: "Compatibilidad de cobertura operativa",
  },

  "Transferi Kabul Et": {
    en: "Accept Transfer",
    ar: "قبول التحويل",
    es: "Aceptar traslado",
  },

  "Alış": {
    en: "Pickup",
    ar: "الاستلام",
    es: "Recogida",
  },

  "Bırakış": {
    en: "Drop-off",
    ar: "التوصيل",
    es: "Destino",
  },

  Flight: {
    en: "Flight",
    ar: "الرحلة",
    es: "Vuelo",
  },

  "Araç Tipi": {
    en: "Vehicle Type",
    ar: "نوع المركبة",
    es: "Tipo de vehículo",
  },

  Passenger: {
    en: "Passenger",
    ar: "الراكب",
    es: "Pasajero",
  },

  Bagaj: {
    en: "Luggage",
    ar: "الأمتعة",
    es: "Equipaje",
  },

  /* --------------------------------------------------
   * TRANSFERS / DASHBOARD
   * -------------------------------------------------- */

  "Atanan Transferler": {
    en: "Assigned Transfers",
    ar: "التحويلات المعيّنة",
    es: "Traslados asignados",
  },

  "Transfer ara": {
    en: "Search transfers",
    ar: "بحث في التحويلات",
    es: "Buscar traslados",
  },

  "SF numarası, yolcu, telefon veya uçuş...": {
    en: "SF number, passenger, phone or flight...",
    ar: "رقم SF أو الراكب أو الهاتف أو الرحلة...",
    es: "Número SF, pasajero, teléfono o vuelo...",
  },

  Durum: {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },

  Başlangıç: {
    en: "Start",
    ar: "البداية",
    es: "Inicio",
  },

  Bitiş: {
    en: "End",
    ar: "النهاية",
    es: "Fin",
  },

  Temizle: {
    en: "Clear",
    ar: "مسح",
    es: "Limpiar",
  },

  Filtrele: {
    en: "Filter",
    ar: "تصفية",
    es: "Filtrar",
  },

  "TRANSFER DETAYI": {
    en: "TRANSFER DETAILS",
    ar: "تفاصيل التحويل",
    es: "DETALLES DEL TRASLADO",
  },

  Operasyon: {
    en: "Operation",
    ar: "العملية",
    es: "Operación",
  },

  Yolcu: {
    en: "Passenger",
    ar: "الراكب",
    es: "Pasajero",
  },

  Güzergâh: {
    en: "Route",
    ar: "المسار",
    es: "Ruta",
  },

  Görevli: {
    en: "Assigned Staff",
    ar: "الموظف المكلّف",
    es: "Responsable",
  },

  "Alış zamanı": {
    en: "Pickup time",
    ar: "وقت الاستلام",
    es: "Hora de recogida",
  },

  "Araç tipi": {
    en: "Vehicle type",
    ar: "نوع المركبة",
    es: "Tipo de vehículo",
  },

  Uçuş: {
    en: "Flight",
    ar: "الرحلة",
    es: "Vuelo",
  },

  "Ad Soyad": {
    en: "Full Name",
    ar: "الاسم الكامل",
    es: "Nombre completo",
  },

  Telefon: {
    en: "Phone",
    ar: "الهاتف",
    es: "Teléfono",
  },

  Bekliyor: {
    en: "Waiting",
    ar: "قيد الانتظار",
    es: "Pendiente",
  },

  "Uçuş yok": {
    en: "No flight",
    ar: "لا توجد رحلة",
    es: "Sin vuelo",
  },

  /* --------------------------------------------------
   * DRIVER / VEHICLE ASSIGNMENT
   * -------------------------------------------------- */

  "OPERASYON ATAMASI": {
    en: "OPERATION ASSIGNMENT",
    ar: "تعيين العملية",
    es: "ASIGNACIÓN OPERATIVA",
  },

  "Sürücü ve Araç": {
    en: "Driver and Vehicle",
    ar: "السائق والمركبة",
    es: "Conductor y vehículo",
  },

  Atandı: {
    en: "Assigned",
    ar: "تم التعيين",
    es: "Asignado",
  },

  Atanmadı: {
    en: "Unassigned",
    ar: "غير معيّن",
    es: "Sin asignar",
  },

  "MEVCUT SÜRÜCÜ": {
    en: "CURRENT DRIVER",
    ar: "السائق الحالي",
    es: "CONDUCTOR ACTUAL",
  },

  "MEVCUT ARAÇ": {
    en: "CURRENT VEHICLE",
    ar: "المركبة الحالية",
    es: "VEHÍCULO ACTUAL",
  },

  Sürücü: {
    en: "Driver",
    ar: "السائق",
    es: "Conductor",
  },

  Araç: {
    en: "Vehicle",
    ar: "المركبة",
    es: "Vehículo",
  },

  "Sürücü seçin": {
    en: "Select driver",
    ar: "اختر السائق",
    es: "Seleccionar conductor",
  },

  "Araç seçin": {
    en: "Select vehicle",
    ar: "اختر المركبة",
    es: "Seleccionar vehículo",
  },

  "Transferi Ata": {
    en: "Assign Transfer",
    ar: "تعيين التحويل",
    es: "Asignar traslado",
  },

  "Atamayı Güncelle": {
    en: "Update Assignment",
    ar: "تحديث التعيين",
    es: "Actualizar asignación",
  },

  "Atamayı Kaldır": {
    en: "Remove Assignment",
    ar: "إلغاء التعيين",
    es: "Quitar asignación",
  },

  /* --------------------------------------------------
   * DRIVERS
   * -------------------------------------------------- */

  "EKİP YÖNETİMİ": {
    en: "TEAM MANAGEMENT",
    ar: "إدارة الفريق",
    es: "GESTIÓN DEL EQUIPO",
  },

  "Sürücü Ekibi": {
    en: "Driver Team",
    ar: "فريق السائقين",
    es: "Equipo de conductores",
  },

  "Henüz sürücü eklenmedi": {
    en: "No drivers added yet",
    ar: "لم تتم إضافة سائقين بعد",
    es: "Aún no se han añadido conductores",
  },

  "İlk sürücü hesabınızı oluşturun.": {
    en: "Create your first driver account.",
    ar: "أنشئ حساب السائق الأول.",
    es: "Cree su primera cuenta de conductor.",
  },

  İletişim: {
    en: "Contact",
    ar: "التواصل",
    es: "Contacto",
  },

  "Araç ataması": {
    en: "Vehicle Assignment",
    ar: "تعيين المركبة",
    es: "Asignación de vehículo",
  },

  "Araç atanmadı": {
    en: "No vehicle assigned",
    ar: "لم يتم تعيين مركبة",
    es: "Sin vehículo asignado",
  },

  "Sürücü düzenle": {
    en: "Edit driver",
    ar: "تعديل السائق",
    es: "Editar conductor",
  },

  "Yeni sürücü ekle": {
    en: "Add new driver",
    ar: "إضافة سائق جديد",
    es: "Añadir conductor",
  },

  "SÜRÜCÜ HESABI": {
    en: "DRIVER ACCOUNT",
    ar: "حساب السائق",
    es: "CUENTA DEL CONDUCTOR",
  },

  "Sürücü adı soyadı": {
    en: "Driver full name",
    ar: "اسم السائق الكامل",
    es: "Nombre completo del conductor",
  },

  "En az 8 karakter": {
    en: "At least 8 characters",
    ar: "8 أحرف على الأقل",
    es: "Al menos 8 caracteres",
  },

  "Şimdilik araç atama": {
    en: "Do not assign a vehicle yet",
    ar: "عدم تعيين مركبة الآن",
    es: "No asignar vehículo todavía",
  },

  "Sürücü hesabı aktif olsun": {
    en: "Keep driver account active",
    ar: "تفعيل حساب السائق",
    es: "Mantener activa la cuenta",
  },

  "Mobil uygulama girişi": {
    en: "Mobile app login",
    ar: "تسجيل دخول تطبيق الهاتف",
    es: "Acceso a la aplicación móvil",
  },

  /* --------------------------------------------------
   * VEHICLES
   * -------------------------------------------------- */

  "Araç Filosu": {
    en: "Vehicle Fleet",
    ar: "أسطول المركبات",
    es: "Flota de vehículos",
  },

  "Araç hakkında operasyon notu...": {
    en: "Operational note about the vehicle...",
    ar: "ملاحظة تشغيلية حول المركبة...",
    es: "Nota operativa sobre el vehículo...",
  },

  /* --------------------------------------------------
   * FINANCE
   * -------------------------------------------------- */

  "FİNANS MERKEZİ": {
    en: "FINANCE CENTER",
    ar: "المركز المالي",
    es: "CENTRO FINANCIERO",
  },

  "Onaylanan transferlerinizi, vadelerinizi ve ödeme geçmişinizi izleyin.": {
    en: "Track your approved transfers, due dates and payment history.",
    ar: "تابع التحويلات المعتمدة وتواريخ الاستحقاق وسجل المدفوعات.",
    es: "Controle sus traslados aprobados, vencimientos e historial de pagos.",
  },

  "Güncel finans verisi": {
    en: "Current financial data",
    ar: "البيانات المالية الحالية",
    es: "Datos financieros actuales",
  },

  "Hakediş ara": {
    en: "Search earnings",
    ar: "بحث في المستحقات",
    es: "Buscar liquidaciones",
  },

  "SF numarası, yolcu veya güzergâh...": {
    en: "SF number, passenger or route...",
    ar: "رقم SF أو الراكب أو المسار...",
    es: "Número SF, pasajero o ruta...",
  },

  "Hakediş Kayıtları": {
    en: "Earnings Records",
    ar: "سجلات المستحقات",
    es: "Registros de liquidaciones",
  },

  "Hakedişler yükleniyor...": {
    en: "Loading earnings...",
    ar: "جارٍ تحميل المستحقات...",
    es: "Cargando liquidaciones...",
  },

  "Filtrelere uygun hakediş bulunamadı.": {
    en: "No earnings matched the filters.",
    ar: "لا توجد مستحقات مطابقة للفلاتر.",
    es: "No se encontraron liquidaciones.",
  },

  Rezervasyon: {
    en: "Reservation",
    ar: "الحجز",
    es: "Reserva",
  },

  Tarih: {
    en: "Date",
    ar: "التاريخ",
    es: "Fecha",
  },

  Hakediş: {
    en: "Earnings",
    ar: "المستحقات",
    es: "Liquidación",
  },

  Vade: {
    en: "Due Date",
    ar: "تاريخ الاستحقاق",
    es: "Vencimiento",
  },

  Ödeme: {
    en: "Payment",
    ar: "الدفع",
    es: "Pago",
  },

  Önceki: {
    en: "Previous",
    ar: "السابق",
    es: "Anterior",
  },

  Sonraki: {
    en: "Next",
    ar: "التالي",
    es: "Siguiente",
  },

  Sayfa: {
    en: "Page",
    ar: "الصفحة",
    es: "Página",
  },

  /* --------------------------------------------------
   * HISTORY
   * -------------------------------------------------- */

  ARŞİV: {
    en: "ARCHIVE",
    ar: "الأرشيف",
    es: "ARCHIVO",
  },

  "Tamamlanan, No Show ve iptal edilen operasyonları burada görüntüleyin.": {
    en: "View completed, no-show and cancelled operations here.",
    ar: "اعرض العمليات المكتملة وعدم الحضور والملغاة هنا.",
    es: "Consulte aquí operaciones completadas, no-show y canceladas.",
  },

  "Geçmişte ara": {
    en: "Search history",
    ar: "بحث في السجل",
    es: "Buscar en historial",
  },

  "SF numarası, yolcu, uçuş veya adres...": {
    en: "SF number, passenger, flight or address...",
    ar: "رقم SF أو الراكب أو الرحلة أو العنوان...",
    es: "Número SF, pasajero, vuelo o dirección...",
  },

  "Tüm geçmiş": {
    en: "All history",
    ar: "كل السجل",
    es: "Todo el historial",
  },

  Tamamlandı: {
    en: "Completed",
    ar: "مكتمل",
    es: "Completado",
  },

  "İptal Edildi": {
    en: "Cancelled",
    ar: "ملغى",
    es: "Cancelado",
  },

  "Operasyon Geçmişi": {
    en: "Operation History",
    ar: "سجل العمليات",
    es: "Historial operativo",
  },

  "Geçmiş transferler yükleniyor...": {
    en: "Loading transfer history...",
    ar: "جارٍ تحميل سجل التحويلات...",
    es: "Cargando historial de traslados...",
  },

  "Bu filtrelere uygun geçmiş transfer bulunmuyor.": {
    en: "No historical transfers match these filters.",
    ar: "لا توجد تحويلات مطابقة لهذه الفلاتر.",
    es: "No hay traslados que coincidan con estos filtros.",
  },

  /* --------------------------------------------------
   * INVOICES
   * -------------------------------------------------- */

  "FİNANS BELGELERİ": {
    en: "FINANCIAL DOCUMENTS",
    ar: "المستندات المالية",
    es: "DOCUMENTOS FINANCIEROS",
  },

  "Onaylanan hakedişlerinizi seçin, faturanızı güvenli biçimde gönderin.": {
    en: "Select approved earnings and securely submit your invoice.",
    ar: "اختر المستحقات المعتمدة وأرسل فاتورتك بأمان.",
    es: "Seleccione liquidaciones aprobadas y envíe su factura de forma segura.",
  },

  "Verileri Yenile": {
    en: "Refresh Data",
    ar: "تحديث البيانات",
    es: "Actualizar datos",
  },

  "YENİ FATURA": {
    en: "NEW INVOICE",
    ar: "فاتورة جديدة",
    es: "NUEVA FACTURA",
  },

  "Hakediş Seçimi": {
    en: "Earnings Selection",
    ar: "اختيار المستحقات",
    es: "Selección de liquidaciones",
  },

  "Yalnızca yönetici tarafından onaylanan ve henüz faturalanmayan kayıtlar listelenir.": {
    en: "Only administrator-approved records that have not yet been invoiced are listed.",
    ar: "يتم عرض السجلات المعتمدة من الإدارة وغير المفوترة فقط.",
    es: "Solo se muestran registros aprobados y aún no facturados.",
  },

  "Faturalanmaya hazır onaylı hakediş bulunmuyor.": {
    en: "No approved earnings are ready for invoicing.",
    ar: "لا توجد مستحقات معتمدة جاهزة للفوترة.",
    es: "No hay liquidaciones aprobadas listas para facturar.",
  },

  "Fatura Numarası *": {
    en: "Invoice Number *",
    ar: "رقم الفاتورة *",
    es: "Número de factura *",
  },

  "Fatura Tarihi *": {
    en: "Invoice Date *",
    ar: "تاريخ الفاتورة *",
    es: "Fecha de factura *",
  },

  "Vade Tarihi": {
    en: "Due Date",
    ar: "تاريخ الاستحقاق",
    es: "Fecha de vencimiento",
  },

  "Para Birimi *": {
    en: "Currency *",
    ar: "العملة *",
    es: "Moneda *",
  },

  "Fatura Dosyası * (PDF/JPG/PNG, en fazla 10 MB)": {
    en: "Invoice File * (PDF/JPG/PNG, max 10 MB)",
    ar: "ملف الفاتورة * (PDF/JPG/PNG، بحد أقصى 10 MB)",
    es: "Archivo de factura * (PDF/JPG/PNG, máx. 10 MB)",
  },

  "Tedarikçi Notu": {
    en: "Supplier Note",
    ar: "ملاحظة المورد",
    es: "Nota del proveedor",
  },

  "FATURA GEÇMİŞİ": {
    en: "INVOICE HISTORY",
    ar: "سجل الفواتير",
    es: "HISTORIAL DE FACTURAS",
  },

  "Gönderilen Faturalar": {
    en: "Submitted Invoices",
    ar: "الفواتير المرسلة",
    es: "Facturas enviadas",
  },

  "Faturalar yükleniyor...": {
    en: "Loading invoices...",
    ar: "جارٍ تحميل الفواتير...",
    es: "Cargando facturas...",
  },

  "Henüz gönderilmiş fatura yok.": {
    en: "No invoices have been submitted yet.",
    ar: "لم يتم إرسال أي فاتورة بعد.",
    es: "Aún no se han enviado facturas.",
  },

  Kayıt: {
    en: "Records",
    ar: "السجلات",
    es: "Registros",
  },

  Dosya: {
    en: "File",
    ar: "الملف",
    es: "Archivo",
  },

  "Faturayı İndir": {
    en: "Download Invoice",
    ar: "تنزيل الفاتورة",
    es: "Descargar factura",
  },

  /* --------------------------------------------------
   * LOGIN / PASSWORD
   * -------------------------------------------------- */

  "TEDARİKÇİ PORTALI": {
    en: "SUPPLIER PORTAL",
    ar: "بوابة المورد",
    es: "PORTAL DEL PROVEEDOR",
  },

  Şifre: {
    en: "Password",
    ar: "كلمة المرور",
    es: "Contraseña",
  },

  Şifreniz: {
    en: "Your password",
    ar: "كلمة المرور الخاصة بك",
    es: "Su contraseña",
  },

  "ŞİFRE SIFIRLAMA": {
    en: "PASSWORD RESET",
    ar: "إعادة تعيين كلمة المرور",
    es: "RESTABLECER CONTRASEÑA",
  },

  "Yeni şifrenizi belirleyin": {
    en: "Set your new password",
    ar: "قم بتعيين كلمة المرور الجديدة",
    es: "Establezca su nueva contraseña",
  },

  "Yeni şifre": {
    en: "New password",
    ar: "كلمة المرور الجديدة",
    es: "Nueva contraseña",
  },

  "Yeni şifre tekrar": {
    en: "Confirm new password",
    ar: "تأكيد كلمة المرور الجديدة",
    es: "Confirmar nueva contraseña",
  },
};

const LanguageContext =
  createContext(null);

function canonicalFor(value) {
  const normalized =
    String(value || "").trim();

  if (phrases[normalized]) {
    return normalized;
  }

  for (
    const [canonical, variants]
    of Object.entries(phrases)
  ) {
    if (
      Object.values(variants)
        .includes(normalized)
    ) {
      return canonical;
    }
  }

  return null;
}

function translateValue(
  value,
  language,
) {
  if (!value) {
    return value;
  }

  const canonical =
    canonicalFor(value);

  if (!canonical) {
    return value;
  }

  if (language === "tr") {
    return canonical;
  }

  return (
    phrases[canonical]?.[
      language
    ] ||
    canonical
  );
}

function translateDocument(
  language,
) {
  const root =
    document.getElementById(
      "root",
    );

  if (!root) {
    return;
  }

  const translateElement = (
    element,
  ) => {
    if (
      !(
        element instanceof
        Element
      )
    ) {
      return;
    }

    [
      "placeholder",
      "title",
      "aria-label",
    ].forEach(
      (attribute) => {
        if (
          !element.hasAttribute(
            attribute,
          )
        ) {
          return;
        }

        const current =
          element.getAttribute(
            attribute,
          );

        const next =
          translateValue(
            current,
            language,
          );

        if (
          next !== current
        ) {
          element.setAttribute(
            attribute,
            next,
          );
        }
      },
    );
  };

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    );

  const textNodes = [];

  while (
    walker.nextNode()
  ) {
    textNodes.push(
      walker.currentNode,
    );
  }

  textNodes.forEach(
    (node) => {
      const raw =
        node.nodeValue || "";

      const trimmed =
        raw.trim();

      if (!trimmed) {
        return;
      }

      const translated =
        translateValue(
          trimmed,
          language,
        );

      if (
        translated ===
        trimmed
      ) {
        return;
      }

      node.nodeValue =
        raw.replace(
          trimmed,
          translated,
        );
    },
  );

  root
    .querySelectorAll("*")
    .forEach(
      translateElement,
    );
}

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(
    () =>
      localStorage.getItem(
        STORAGE_KEY,
      ) || "en",
  );

  const setLanguage = (
    nextLanguage,
  ) => {
    if (
      !LANGUAGES.some(
        (item) =>
          item.code ===
          nextLanguage,
      )
    ) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      nextLanguage,
    );

    setLanguageState(
      nextLanguage,
    );
  };

  useEffect(() => {
    document.documentElement.lang =
      language;

    document.documentElement.dir =
      language === "ar"
        ? "rtl"
        : "ltr";

    translateDocument(
      language,
    );

    const observer =
      new MutationObserver(
        () =>
          translateDocument(
            language,
          ),
      );

    const root =
      document.getElementById(
        "root",
      );

    if (root) {
      observer.observe(
        root,
        {
          childList: true,
          subtree: true,
          characterData: true,
        },
      );
    }

    return () =>
      observer.disconnect();
  }, [language]);

  const value =
    useMemo(
      () => ({
        language,
        setLanguage,
      }),
      [language],
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(
    LanguageContext,
  );
}

export function LanguageSwitcher() {
  const {
    language,
    setLanguage,
  } = useLanguage();

  return (
    <div
      className="skyfleet-language-switcher"
      dir="ltr"
    >
      <span>🌐</span>

      <select
        value={language}
        onChange={(event) =>
          setLanguage(
            event.target.value,
          )
        }
        aria-label="Language"
      >
        {LANGUAGES.map(
          (item) => (
            <option
              key={item.code}
              value={item.code}
            >
              {item.label}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
