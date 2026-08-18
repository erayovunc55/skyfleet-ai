import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "skyfleet_language";

export const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
];

const phrases = {
  "Çıkış": { en: "Logout", ar: "تسجيل الخروج", es: "Salir" },
  "Yardım": { en: "Help", ar: "مساعدة", es: "Ayuda" },
  "Menüyü aç": { en: "Open menu", ar: "فتح القائمة", es: "Abrir menú" },
  "Transfer, sürücü, plaka veya tedarikçi ara...": { en: "Search transfer, driver, plate or supplier...", ar: "ابحث عن التحويل أو السائق أو اللوحة أو المورد...", es: "Buscar traslado, conductor, matrícula o proveedor..." },
  "CANLI OPERASYON": { en: "LIVE OPERATIONS", ar: "العمليات المباشرة", es: "OPERACIONES EN VIVO" },
  "Bildirim Merkezi": { en: "Notification Center", ar: "مركز الإشعارات", es: "Centro de notificaciones" },
  "Tümünü Okundu Yap": { en: "Mark All Read", ar: "تحديد الكل كمقروء", es: "Marcar todo como leído" },
  "Tümü": { en: "All", ar: "الكل", es: "Todos" },
  "Okunmamış": { en: "Unread", ar: "غير المقروءة", es: "No leídos" },
  "Bildirimler yükleniyor...": { en: "Loading notifications...", ar: "جارٍ تحميل الإشعارات...", es: "Cargando notificaciones..." },
  "Okunmamış bildiriminiz yok.": { en: "No unread notifications.", ar: "لا توجد إشعارات غير مقروءة.", es: "No hay notificaciones sin leer." },
  "Aktif operasyon bildirimi yok.": { en: "No active operation alerts.", ar: "لا توجد تنبيهات تشغيل نشطة.", es: "No hay alertas operativas activas." },
  "Her 30 saniyede otomatik güncellenir": { en: "Updates automatically every 30 seconds", ar: "يتم التحديث تلقائياً كل 30 ثانية", es: "Se actualiza automáticamente cada 30 segundos" },
  "Transferleri Aç →": { en: "Open Transfers →", ar: "فتح التحويلات ←", es: "Abrir traslados →" },
  "Şimdi": { en: "Now", ar: "الآن", es: "Ahora" },
  "Transfer Yönetimi": { en: "Transfer Management", ar: "إدارة التحويلات", es: "Gestión de traslados" },
  "Geçmiş ve ileri tarihli bütün rezervasyonları tek ekrandan yönetin.": { en: "Manage all past and upcoming bookings from one screen.", ar: "أدر جميع الحجوزات السابقة والقادمة من شاشة واحدة.", es: "Gestiona todas las reservas pasadas y futuras desde una sola pantalla." },
  "+ Yeni Transfer": { en: "+ New Transfer", ar: "+ تحويل جديد", es: "+ Nuevo traslado" },
  "Yenile": { en: "Refresh", ar: "تحديث", es: "Actualizar" },
  "Toplam Transfer": { en: "Total Transfers", ar: "إجمالي التحويلات", es: "Traslados totales" },
  "Bekleyen": { en: "Waiting", ar: "قيد الانتظار", es: "Pendientes" },
  "Aktif Operasyon": { en: "Active Operations", ar: "العمليات النشطة", es: "Operaciones activas" },
  "Tamamlanan": { en: "Completed", ar: "المكتملة", es: "Completados" },
  "Transfer ara": { en: "Search transfers", ar: "بحث التحويلات", es: "Buscar traslados" },
  "Tedarikçi": { en: "Supplier", ar: "المورد", es: "Proveedor" },
  "Durum": { en: "Status", ar: "الحالة", es: "Estado" },
  "Başlangıç": { en: "Start", ar: "البداية", es: "Inicio" },
  "Bitiş": { en: "End", ar: "النهاية", es: "Fin" },
  "Filtreleri Temizle": { en: "Clear Filters", ar: "مسح عوامل التصفية", es: "Limpiar filtros" },
  "Rezervasyonlar": { en: "Bookings", ar: "الحجوزات", es: "Reservas" },
  "Tedarikçi seçin": { en: "Select supplier", ar: "اختر المورد", es: "Seleccionar proveedor" },
  "Toplu Ata": { en: "Bulk Assign", ar: "تعيين جماعي", es: "Asignación masiva" },
  "Seçimi Temizle": { en: "Clear Selection", ar: "مسح التحديد", es: "Limpiar selección" },
  "Ref. No": { en: "Ref. No", ar: "المرجع", es: "Ref. No" },
  "Tür": { en: "Type", ar: "النوع", es: "Tipo" },
  "Tarih": { en: "Date", ar: "التاريخ", es: "Fecha" },
  "Saat": { en: "Time", ar: "الوقت", es: "Hora" },
  "Uçuş": { en: "Flight", ar: "الرحلة", es: "Vuelo" },
  "Nereden": { en: "From", ar: "من", es: "Desde" },
  "Nereye": { en: "To", ar: "إلى", es: "Hasta" },
  "Yolcu": { en: "Passenger", ar: "الراكب", es: "Pasajero" },
  "Telefon": { en: "Phone", ar: "الهاتف", es: "Teléfono" },
  "Çocuk": { en: "Child", ar: "طفل", es: "Niño" },
  "Araç Tipi": { en: "Vehicle Type", ar: "نوع المركبة", es: "Tipo de vehículo" },
  "Fiyat": { en: "Price", ar: "السعر", es: "Precio" },
  "Para Birimi": { en: "Currency", ar: "العملة", es: "Moneda" },
  "Araç": { en: "Vehicle", ar: "المركبة", es: "Vehículo" },
  "Sürücü": { en: "Driver", ar: "السائق", es: "Conductor" },
  "Atama": { en: "Assignment", ar: "التعيين", es: "Asignación" },
  "Atama tamam": { en: "Assignment complete", ar: "اكتمل التعيين", es: "Asignación completa" },
  "Tedarikçi bekleniyor": { en: "Awaiting supplier", ar: "بانتظار المورد", es: "Esperando proveedor" },
  "Araç / sürücü bekleniyor": { en: "Awaiting vehicle / driver", ar: "بانتظار المركبة / السائق", es: "Esperando vehículo / conductor" },
  "Kabul Edildi": { en: "Accepted", ar: "تم القبول", es: "Aceptado" },
  "Yolda": { en: "En Route", ar: "في الطريق", es: "En camino" },
  "Alış Noktasında": { en: "At Pickup", ar: "في نقطة الاستلام", es: "En recogida" },
  "Yolcu Arandı": { en: "Passenger Contacted", ar: "تم الاتصال بالراكب", es: "Pasajero contactado" },
  "Yolcu Araçta": { en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  "Transfer Başladı": { en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" },
  "Tamamlandı": { en: "Completed", ar: "مكتمل", es: "Completado" },
  "İptal": { en: "Cancelled", ar: "ملغى", es: "Cancelado" },
  "Sayfa başına": { en: "Per page", ar: "لكل صفحة", es: "Por página" },
  "transfer": { en: "transfers", ar: "تحويل", es: "traslados" },
  "Önceki": { en: "Previous", ar: "السابق", es: "Anterior" },
  "Sonraki": { en: "Next", ar: "التالي", es: "Siguiente" },
  "Sayfa": { en: "Page", ar: "صفحة", es: "Página" },
  "TRANSFER DETAYI": { en: "TRANSFER DETAILS", ar: "تفاصيل التحويل", es: "DETALLES DEL TRASLADO" },
  "Düzenle": { en: "Edit", ar: "تعديل", es: "Editar" },
  "İptal Et": { en: "Cancel", ar: "إلغاء", es: "Cancelar" },

  "GPS Durumu": { en: "GPS Status", ar: "حالة GPS", es: "Estado GPS" },
  "Konum alındı": { en: "Location received", ar: "تم استلام الموقع", es: "Ubicación recibida" },
  "Konum bekleniyor": { en: "Waiting for location", ar: "بانتظار الموقع", es: "Esperando ubicación" },
  "Son Güncelleme": { en: "Last Update", ar: "آخر تحديث", es: "Última actualización" },
  "Hassasiyet": { en: "Accuracy", ar: "الدقة", es: "Precisión" },
  "Hız": { en: "Speed", ar: "السرعة", es: "Velocidad" },
  "Yol Rotası": { en: "Road Route", ar: "مسار الطريق", es: "Ruta por carretera" },
  "Bilinmiyor": { en: "Unknown", ar: "غير معروف", es: "Desconocido" },
  "GPS verisi bekleniyor": { en: "Waiting for GPS data", ar: "بانتظار بيانات GPS", es: "Esperando datos GPS" },
  "Sürücü henüz konum göndermedi.": { en: "The driver has not sent a location yet.", ar: "لم يرسل السائق موقعه بعد.", es: "El conductor aún no ha enviado su ubicación." },
  "GPS zamanı bilinmiyor": { en: "GPS time unknown", ar: "وقت GPS غير معروف", es: "Hora GPS desconocida" },
  "Konum mevcut ancak kayıt zamanı bulunamadı.": { en: "Location is available but its timestamp is missing.", ar: "الموقع متاح لكن وقت التسجيل غير موجود.", es: "La ubicación está disponible, pero falta la hora de registro." },
  "Sürücü canlı": { en: "Driver online", ar: "السائق متصل", es: "Conductor conectado" },
  "GPS gecikiyor": { en: "GPS delayed", ar: "تأخر GPS", es: "GPS retrasado" },
  "Sürücü çevrimdışı olabilir": { en: "Driver may be offline", ar: "قد يكون السائق غير متصل", es: "El conductor puede estar desconectado" },
  "Koordinat bekleniyor": { en: "Waiting for coordinates", ar: "بانتظار الإحداثيات", es: "Esperando coordenadas" },
  "Hesaplanıyor": { en: "Calculating", ar: "جارٍ الحساب", es: "Calculando" },
  "Karayolu rotası hazır": { en: "Road route ready", ar: "مسار الطريق جاهز", es: "Ruta por carretera lista" },
  "Rota servisine ulaşılamadı": { en: "Routing service unavailable", ar: "خدمة المسار غير متاحة", es: "Servicio de rutas no disponible" },
  "Henüz GPS yok": { en: "No GPS yet", ar: "لا يوجد GPS بعد", es: "Aún no hay GPS" },
  "Pickup noktası": { en: "Pickup point", ar: "نقطة الاستلام", es: "Punto de recogida" },
  "Dropoff noktası": { en: "Dropoff point", ar: "نقطة الوصول", es: "Punto de destino" },
  "Son GPS:": { en: "Last GPS:", ar: "آخر GPS:", es: "Último GPS:" },

  "Operasyon Zaman Çizelgesi": { en: "Operation Timeline", ar: "الخط الزمني للعملية", es: "Cronología de la operación" },
  "Henüz operasyon kaydı bulunmuyor.": { en: "No operation records yet.", ar: "لا توجد سجلات تشغيل حتى الآن.", es: "Aún no hay registros de operación." },
  "İşlemi yapan sürücü:": { en: "Driver who performed the action:", ar: "السائق الذي نفذ الإجراء:", es: "Conductor que realizó la acción:" },
  "Transfer Beklemede": { en: "Transfer Waiting", ar: "التحويل قيد الانتظار", es: "Traslado pendiente" },
  "Sürücü Atandı": { en: "Driver Assigned", ar: "تم تعيين السائق", es: "Conductor asignado" },
  "Sürücü Ataması Kaldırıldı": { en: "Driver Unassigned", ar: "تم إلغاء تعيين السائق", es: "Conductor desasignado" },
  "Transfer Kabul Edildi": { en: "Transfer Accepted", ar: "تم قبول التحويل", es: "Traslado aceptado" },
  "Sürücü Yola Çıktı": { en: "Driver Started Driving", ar: "انطلق السائق", es: "El conductor inició el trayecto" },
  "Sürücü Alış Noktasına Ulaştı": { en: "Driver Arrived at Pickup", ar: "وصل السائق إلى نقطة الاستلام", es: "El conductor llegó a la recogida" },
  "Yolcu Geldi": { en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  "Yolculuk Başladı": { en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" },
  "Yolculuk Tamamlandı": { en: "Trip Completed", ar: "اكتملت الرحلة", es: "Viaje completado" },
  "Yolcu Gelmedi — No Show": { en: "Passenger No Show", ar: "عدم حضور الراكب", es: "Pasajero no presentado" },
  "Transfer İptal Edildi": { en: "Transfer Cancelled", ar: "تم إلغاء التحويل", es: "Traslado cancelado" },
  "Operasyon Kaydı": { en: "Operation Record", ar: "سجل العملية", es: "Registro de operación" },
  "Zaman bilgisi yok": { en: "No time information", ar: "لا توجد معلومات زمنية", es: "Sin información de hora" },
};

const LanguageContext = createContext(null);

function canonicalFor(value) {
  const normalized = String(value || "").trim();
  if (phrases[normalized]) return normalized;
  for (const [canonical, variants] of Object.entries(phrases)) {
    if (Object.values(variants).includes(normalized)) return canonical;
  }
  return null;
}

function translateValue(value, language) {
  const canonical = canonicalFor(value);
  if (!canonical) return value;
  if (language === "tr") return canonical;
  return phrases[canonical]?.[language] || canonical;
}

function translateDocument(language) {
  const root = document.getElementById("root");
  if (!root) return;

  const translateElement = (element) => {
    if (!(element instanceof Element)) return;
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const next = translateValue(current, language);
      if (next !== current) element.setAttribute(attribute, next);
    });
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) return;
    const translated = translateValue(trimmed, language);
    if (translated === trimmed) return;
    node.nodeValue = raw.replace(trimmed, translated);
  });

  root.querySelectorAll("*").forEach(translateElement);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || "en");

  const setLanguage = (nextLanguage) => {
    if (!LANGUAGES.some((item) => item.code === nextLanguage)) return;
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    translateDocument(language);

    const observer = new MutationObserver(() => translateDocument(language));
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="skyfleet-language-switcher" dir="ltr" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span>🌐</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label="Language"
        style={{ minHeight: 36, borderRadius: 8, padding: "0 8px" }}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}
