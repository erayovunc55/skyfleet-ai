import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "skyfleet_language";

export const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
];

const phrases = {
  "Sürücü Girişi": { en: "Driver Login", ar: "تسجيل دخول السائق", es: "Acceso del conductor" },
  "Atanmış transferlerinizi yönetin ve canlı konum paylaşın.": { en: "Manage your assigned transfers and share live location.", ar: "أدر التحويلات المعيّنة لك وشارك موقعك المباشر.", es: "Gestiona tus traslados asignados y comparte tu ubicación en vivo." },
  "Telefon veya e-posta": { en: "Phone or email", ar: "الهاتف أو البريد الإلكتروني", es: "Teléfono o correo" },
  "Şifre": { en: "Password", ar: "كلمة المرور", es: "Contraseña" },
  "Giriş Yap": { en: "Sign In", ar: "تسجيل الدخول", es: "Iniciar sesión" },
  "Giriş yapılıyor...": { en: "Signing in...", ar: "جارٍ تسجيل الدخول...", es: "Iniciando sesión..." },
  "Giriş yapılamadı.": { en: "Unable to sign in.", ar: "تعذر تسجيل الدخول.", es: "No se pudo iniciar sesión." },
  "Merhaba": { en: "Hello", ar: "مرحباً", es: "Hola" },
  "Bildirimler": { en: "Notifications", ar: "الإشعارات", es: "Notificaciones" },
  "Çıkış": { en: "Logout", ar: "تسجيل الخروج", es: "Salir" },
  "Atanmış": { en: "Assigned", ar: "المعيّنة", es: "Asignados" },
  "Devam Eden": { en: "In Progress", ar: "قيد التنفيذ", es: "En curso" },
  "Bekleyen": { en: "Waiting", ar: "قيد الانتظار", es: "Pendientes" },
  "Tamamlanan": { en: "Completed", ar: "المكتملة", es: "Completados" },
  "Tamamlandı": { en: "Completed", ar: "مكتمل", es: "Completado" },
  "Bekliyor": { en: "Waiting", ar: "قيد الانتظار", es: "Pendiente" },
  "Kabul Edildi": { en: "Accepted", ar: "تم القبول", es: "Aceptado" },
  "Yola Çıkıldı": { en: "En Route", ar: "في الطريق", es: "En camino" },
  "Alış Noktasında": { en: "At Pickup", ar: "في نقطة الاستلام", es: "En recogida" },
  "Yolcu Arandı": { en: "Passenger Contacted", ar: "تم التواصل مع الراكب", es: "Pasajero contactado" },
  "Yolcu Geldi": { en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  "Yolculuk Başladı": { en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" },
  "İptal Edildi": { en: "Cancelled", ar: "ملغى", es: "Cancelado" },
  "Yenile": { en: "Refresh", ar: "تحديث", es: "Actualizar" },
  "Aktif Transferler": { en: "Active Transfers", ar: "التحويلات النشطة", es: "Traslados activos" },
  "Tamamlananlar": { en: "Completed", ar: "المكتملة", es: "Completados" },
  "Aktif transfer yok": { en: "No active transfers", ar: "لا توجد تحويلات نشطة", es: "No hay traslados activos" },
  "Tamamlanan transfer yok": { en: "No completed transfers", ar: "لا توجد تحويلات مكتملة", es: "No hay traslados completados" },
  "Yeni transfer atandığında burada görünecek.": { en: "Newly assigned transfers will appear here.", ar: "ستظهر التحويلات الجديدة المعيّنة هنا.", es: "Los nuevos traslados asignados aparecerán aquí." },
  "Tamamlanan işler burada arşivlenecek.": { en: "Completed jobs will be archived here.", ar: "ستتم أرشفة المهام المكتملة هنا.", es: "Los servicios completados se archivarán aquí." },
  "Transferler yükleniyor...": { en: "Loading transfers...", ar: "جارٍ تحميل التحويلات...", es: "Cargando traslados..." },
  "Transferleri Aç": { en: "Open Transfers", ar: "فتح التحويلات", es: "Abrir traslados" },
  "Transferi Aç": { en: "Open Transfer", ar: "فتح التحويل", es: "Abrir traslado" },
  "Transfer Detayı": { en: "Transfer Details", ar: "تفاصيل التحويل", es: "Detalles del traslado" },
  "Yolcu": { en: "Passenger", ar: "الراكب", es: "Pasajero" },
  "Ad Soyad": { en: "Full Name", ar: "الاسم الكامل", es: "Nombre completo" },
  "Telefon": { en: "Phone", ar: "الهاتف", es: "Teléfono" },
  "Bagaj": { en: "Luggage", ar: "الأمتعة", es: "Equipaje" },
  "Yolcuyu Ara": { en: "Call Passenger", ar: "اتصل بالراكب", es: "Llamar al pasajero" },
  "Uçuş": { en: "Flight", ar: "الرحلة", es: "Vuelo" },
  "Uçuş yok": { en: "No flight", ar: "لا توجد رحلة", es: "Sin vuelo" },
  "Havayolu": { en: "Airline", ar: "شركة الطيران", es: "Aerolínea" },
  "Terminal": { en: "Terminal", ar: "المبنى", es: "Terminal" },
  "Alış Saati": { en: "Pickup Time", ar: "وقت الاستلام", es: "Hora de recogida" },
  "Rezervasyon": { en: "Booking", ar: "الحجز", es: "Reserva" },
  "Referans": { en: "Reference", ar: "المرجع", es: "Referencia" },
  "Araç Tipi": { en: "Vehicle Type", ar: "نوع المركبة", es: "Tipo de vehículo" },
  "Buluşma Noktası": { en: "Meeting Point", ar: "نقطة الالتقاء", es: "Punto de encuentro" },
  "Notlar": { en: "Notes", ar: "ملاحظات", es: "Notas" },
  "Sürücü Notu": { en: "Driver Note", ar: "ملاحظة السائق", es: "Nota del conductor" },
  "Yolcu Notu": { en: "Passenger Note", ar: "ملاحظة الراكب", es: "Nota del pasajero" },
  "Belirtilmedi": { en: "Not Provided", ar: "غير محدد", es: "No indicado" },
  "Alış noktası": { en: "Pickup point", ar: "نقطة الاستلام", es: "Punto de recogida" },
  "Bırakış noktası": { en: "Dropoff point", ar: "نقطة الوصول", es: "Punto de destino" },
  "Tarih yok": { en: "No date", ar: "لا يوجد تاريخ", es: "Sin fecha" },
  "Pickup’a Git": { en: "Navigate to Pickup", ar: "اذهب إلى نقطة الاستلام", es: "Ir a recogida" },
  "Dropoff’a Git": { en: "Navigate to Dropoff", ar: "اذهب إلى نقطة الوصول", es: "Ir al destino" },
  "Sonraki Operasyon Adımı": { en: "Next Operation Step", ar: "خطوة التشغيل التالية", es: "Siguiente paso operativo" },
  "Yola Çık": { en: "Start Driving", ar: "ابدأ القيادة", es: "Iniciar trayecto" },
  "Alış Noktasındayım": { en: "I've Arrived at Pickup", ar: "وصلت إلى نقطة الاستلام", es: "He llegado al punto de recogida" },
  "Yolcuyu Aradım": { en: "Passenger Contacted", ar: "تم التواصل مع الراكب", es: "Pasajero contactado" },
  "Yolculuğu Başlat": { en: "Start Trip", ar: "ابدأ الرحلة", es: "Iniciar viaje" },
  "Transferi Tamamla": { en: "Complete Trip", ar: "إكمال الرحلة", es: "Completar viaje" },
  "Transfer Tamamlandı": { en: "Transfer Completed", ar: "اكتمل التحويل", es: "Traslado completado" },
  "No Show Kaydı": { en: "No Show Record", ar: "تسجيل عدم الحضور", es: "Registro de no show" },
  "Canlı Konum": { en: "Live Location", ar: "الموقع المباشر", es: "Ubicación en vivo" },
  "Konum paylaşımı aktif": { en: "Location sharing active", ar: "مشاركة الموقع مفعلة", es: "Ubicación en vivo activa" },
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

export function translate(value, language) {
  if (!value || language === "tr") {
    const canonical = canonicalFor(value);
    return canonical || value;
  }
  const canonical = canonicalFor(value);
  if (!canonical) return value;
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
      const next = translate(current, language);
      if (next !== current) element.setAttribute(attribute, next);
    });
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) return;
    const translated = translate(trimmed, language);
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

  const value = useMemo(() => ({ language, setLanguage, t: (value) => translate(value, language) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      dir="ltr"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 9px",
        border: "1px solid rgba(56,189,248,.28)",
        borderRadius: 12,
        background: "rgba(5,11,24,.92)",
        boxShadow: "0 10px 30px rgba(0,0,0,.24)",
      }}
    >
      <span aria-hidden="true">🌐</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label="Language"
        style={{
          border: 0,
          outline: 0,
          color: "#e5eefb",
          background: "transparent",
          fontWeight: 800,
        }}
      >
        {LANGUAGES.map((item) => <option key={item.code} value={item.code} style={{ color: "#0f172a" }}>{item.label}</option>)}
      </select>
    </div>
  );
}
