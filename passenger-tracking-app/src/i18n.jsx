import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "skyfleet_language";

export const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
];

const phrases = {
  "Canlı Takip Aktif": { en: "Live Tracking Active", ar: "التتبع المباشر نشط", es: "Seguimiento en vivo activo" },
  "Takip Tamamlandı": { en: "Tracking Completed", ar: "اكتمل التتبع", es: "Seguimiento completado" },
  "TRANSFER DURUMU": { en: "TRANSFER STATUS", ar: "حالة التحويل", es: "ESTADO DEL TRASLADO" },
  "Rezervasyonunuz güvenli şekilde takip ediliyor.": { en: "Your booking is being tracked securely.", ar: "يتم تتبع حجزك بأمان.", es: "Tu reserva se está siguiendo de forma segura." },
  "SF REZERVASYON": { en: "SF BOOKING", ar: "حجز SF", es: "RESERVA SF" },
  "Güncelleniyor...": { en: "Updating...", ar: "جارٍ التحديث...", es: "Actualizando..." },
  "Konumu Yenile": { en: "Refresh Location", ar: "تحديث الموقع", es: "Actualizar ubicación" },
  "ALIŞ NOKTASI": { en: "PICKUP POINT", ar: "نقطة الاستلام", es: "PUNTO DE RECOGIDA" },
  "BIRAKIŞ NOKTASI": { en: "DROPOFF POINT", ar: "نقطة الوصول", es: "PUNTO DE DESTINO" },
  "Alış Zamanı": { en: "Pickup Time", ar: "وقت الاستلام", es: "Hora de recogida" },
  "Uçuş Numarası": { en: "Flight Number", ar: "رقم الرحلة", es: "Número de vuelo" },
  "Son Konum": { en: "Last Location", ar: "آخر موقع", es: "Última ubicación" },
  "Belirtilmedi": { en: "Not Provided", ar: "غير محدد", es: "No indicado" },
  "Son güncelleme alınamadı. Mevcut konum gösteriliyor.": { en: "The latest update could not be received. Showing the current available location.", ar: "تعذر استلام آخر تحديث. يتم عرض آخر موقع متاح.", es: "No se pudo recibir la última actualización. Se muestra la ubicación disponible." },
  "Güvenli yolcu bağlantısı": { en: "Secure passenger link", ar: "رابط راكب آمن", es: "Enlace seguro para pasajeros" },
  "CANLI OPERASYON": { en: "LIVE OPERATION", ar: "العملية المباشرة", es: "OPERACIÓN EN VIVO" },
  "Yolculuk Akışı": { en: "Journey Progress", ar: "مراحل الرحلة", es: "Progreso del viaje" },
  "Sürücü yola çıktı": { en: "Driver is on the way", ar: "السائق في الطريق", es: "El conductor está en camino" },
  "Alış noktasına ulaştı": { en: "Driver arrived at pickup", ar: "وصل السائق إلى نقطة الاستلام", es: "El conductor llegó al punto de recogida" },
  "Yolcu araçta": { en: "Passenger on board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  "Transfer tamamlandı": { en: "Transfer completed", ar: "اكتمل التحويل", es: "Traslado completado" },
  "SİZİN İÇİN YOLDA": { en: "ON THE WAY FOR YOU", ar: "في الطريق إليك", es: "EN CAMINO PARA TI" },
  "Sürücü ve Araç": { en: "Driver & Vehicle", ar: "السائق والمركبة", es: "Conductor y vehículo" },
  "SÜRÜCÜ": { en: "DRIVER", ar: "السائق", es: "CONDUCTOR" },
  "Atanıyor": { en: "Assigning", ar: "جارٍ التعيين", es: "Asignando" },
  "Plaka": { en: "Plate", ar: "لوحة المركبة", es: "Matrícula" },
  "Araç": { en: "Vehicle", ar: "المركبة", es: "Vehículo" },
  "Renk": { en: "Color", ar: "اللون", es: "Color" },
  "Tip": { en: "Type", ar: "النوع", es: "Tipo" },
  "Adres belirtilmedi": { en: "Address not provided", ar: "العنوان غير محدد", es: "Dirección no indicada" },
  "Transferiniz hazırlanıyor": { en: "Your transfer is being prepared", ar: "يتم تجهيز نقلك", es: "Tu traslado se está preparando" },
  "Canlı yolculuk bilgileri güvenli şekilde yükleniyor.": { en: "Live journey information is loading securely.", ar: "يتم تحميل معلومات الرحلة المباشرة بأمان.", es: "La información del viaje en vivo se está cargando de forma segura." },
  "Takip bağlantısı açılamadı": { en: "Tracking link could not be opened", ar: "تعذر فتح رابط التتبع", es: "No se pudo abrir el enlace de seguimiento" },
  "Tekrar Dene": { en: "Try Again", ar: "حاول مرة أخرى", es: "Intentar de nuevo" },
  "Geçerli bir takip bağlantısı bulunamadı.": { en: "A valid tracking link could not be found.", ar: "لم يتم العثور على رابط تتبع صالح.", es: "No se encontró un enlace de seguimiento válido." },
  "Takip bilgileri alınamadı.": { en: "Tracking information could not be retrieved.", ar: "تعذر جلب معلومات التتبع.", es: "No se pudo obtener la información de seguimiento." },
  "Sürücü Hazırlanıyor": { en: "Driver Preparing", ar: "السائق يستعد", es: "Conductor preparándose" },
  "Sürücü Yolda": { en: "Driver En Route", ar: "السائق في الطريق", es: "Conductor en camino" },
  "Sürücü Alış Noktasında": { en: "Driver at Pickup", ar: "السائق في نقطة الاستلام", es: "Conductor en recogida" },
  "Sürücü Sizi Aradı": { en: "Driver Contacted You", ar: "اتصل بك السائق", es: "El conductor te contactó" },
  "Yolcu Araçta": { en: "Passenger On Board", ar: "الراكب في المركبة", es: "Pasajero a bordo" },
  "Yolculuk Başladı": { en: "Trip Started", ar: "بدأت الرحلة", es: "Viaje iniciado" },
  "Transfer Tamamlandı": { en: "Transfer Completed", ar: "اكتمل التحويل", es: "Traslado completado" },
  "Operasyon Sonlandırıldı": { en: "Operation Closed", ar: "تم إنهاء العملية", es: "Operación finalizada" },
  "Transfer İptal Edildi": { en: "Transfer Cancelled", ar: "تم إلغاء التحويل", es: "Traslado cancelado" },
  "Transfer Takibi": { en: "Transfer Tracking", ar: "تتبع التحويل", es: "Seguimiento del traslado" },
  "Sürücü konumu bekleniyor": { en: "Waiting for driver location", ar: "بانتظار موقع السائق", es: "Esperando la ubicación del conductor" },
  "Henüz alınmadı": { en: "Not received yet", ar: "لم يتم الاستلام بعد", es: "Aún no recibido" },
  "Şimdi": { en: "Now", ar: "الآن", es: "Ahora" },
  "Buluşma": { en: "Meeting point", ar: "نقطة الالتقاء", es: "Punto de encuentro" },
  "Son güncelleme": { en: "Last update", ar: "آخر تحديث", es: "Última actualización" },
};

const monthMap = {
  Ocak: { en: "January", ar: "يناير", es: "enero" },
  Şubat: { en: "February", ar: "فبراير", es: "febrero" },
  Mart: { en: "March", ar: "مارس", es: "marzo" },
  Nisan: { en: "April", ar: "أبريل", es: "abril" },
  Mayıs: { en: "May", ar: "مايو", es: "mayo" },
  Haziran: { en: "June", ar: "يونيو", es: "junio" },
  Temmuz: { en: "July", ar: "يوليو", es: "julio" },
  Ağustos: { en: "August", ar: "أغسطس", es: "agosto" },
  Eylül: { en: "September", ar: "سبتمبر", es: "septiembre" },
  Ekim: { en: "October", ar: "أكتوبر", es: "octubre" },
  Kasım: { en: "November", ar: "نوفمبر", es: "noviembre" },
  Aralık: { en: "December", ar: "ديسمبر", es: "diciembre" },
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

function translateDynamic(value, language) {
  if (language === "tr") return value;
  let text = String(value || "");

  const secondsMatch = text.match(/^(\d+) saniye önce$/);
  if (secondsMatch) {
    const n = secondsMatch[1];
    return language === "en" ? `${n} seconds ago` : language === "ar" ? `قبل ${n} ثانية` : `hace ${n} segundos`;
  }

  const minutesMatch = text.match(/^(\d+) dakika önce$/);
  if (minutesMatch) {
    const n = minutesMatch[1];
    return language === "en" ? `${n} minutes ago` : language === "ar" ? `قبل ${n} دقيقة` : `hace ${n} minutos`;
  }

  const locationMatch = text.match(/^Konum (.+) güncellendi$/);
  if (locationMatch) {
    const when = translateValue(locationMatch[1], language);
    return language === "en" ? `Location updated ${when}` : language === "ar" ? `تم تحديث الموقع ${when}` : `Ubicación actualizada ${when}`;
  }

  const meetingMatch = text.match(/^Buluşma:\s*(.+)$/);
  if (meetingMatch) {
    return `${phrases["Buluşma"][language]}: ${meetingMatch[1]}`;
  }

  const footerMatch = text.match(/^Son güncelleme:\s*(.+) · Güvenli yolcu bağlantısı$/);
  if (footerMatch) {
    return `${phrases["Son güncelleme"][language]}: ${footerMatch[1]} · ${phrases["Güvenli yolcu bağlantısı"][language]}`;
  }

  for (const [month, translations] of Object.entries(monthMap)) {
    if (text.includes(month)) text = text.replace(month, translations[language]);
  }

  return text;
}

function translateValue(value, language) {
  const canonical = canonicalFor(value);
  if (canonical) {
    if (language === "tr") return canonical;
    return phrases[canonical]?.[language] || canonical;
  }
  return translateDynamic(value, language);
}

function translateDocument(language) {
  const root = document.getElementById("root");
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (node.parentElement?.closest(".skyfleet-language-switcher")) return;
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) return;
    const translated = translateValue(trimmed, language);
    if (translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
  });

  root.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const next = translateValue(current, language);
      if (next !== current) element.setAttribute(attribute, next);
    });
  });
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
    const root = document.getElementById("root");
    if (!root) return undefined;
    const observer = new MutationObserver(() => translateDocument(language));
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageSwitcher />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="skyfleet-language-switcher"
      dir="ltr"
      style={{
        position: "fixed",
        top: 14,
        right: 16,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 9px",
        border: "1px solid rgba(148,163,184,.25)",
        borderRadius: 12,
        background: "rgba(5,11,24,.92)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 30px rgba(0,0,0,.22)",
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
          fontWeight: 700,
        }}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code} style={{ color: "#111827" }}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
