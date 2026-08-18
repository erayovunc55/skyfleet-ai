import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "skyfleet_language";

export const LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
];

const phrases = {
  Transferler: { en: "Transfers", ar: "التحويلات", es: "Traslados" },
  Sürücüler: { en: "Drivers", ar: "السائقون", es: "Conductores" },
  Araçlar: { en: "Vehicles", ar: "المركبات", es: "Vehículos" },
  Hakedişlerim: { en: "Earnings", ar: "المستحقات", es: "Liquidaciones" },
  Faturalar: { en: "Invoices", ar: "الفواتير", es: "Facturas" },
  Tedarikçi: { en: "Supplier", ar: "المورّد", es: "Proveedor" },
  Çıkış: { en: "Logout", ar: "تسجيل الخروج", es: "Salir" },
  "Atanan Transferler": { en: "Assigned Transfers", ar: "التحويلات المعيّنة", es: "Traslados asignados" },
  "Transfer ara": { en: "Search transfers", ar: "بحث في التحويلات", es: "Buscar traslados" },
  Durum: { en: "Status", ar: "الحالة", es: "Estado" },
  Başlangıç: { en: "Start", ar: "البداية", es: "Inicio" },
  Bitiş: { en: "End", ar: "النهاية", es: "Fin" },
  Temizle: { en: "Clear", ar: "مسح", es: "Limpiar" },
  "TRANSFER DETAYI": { en: "TRANSFER DETAILS", ar: "تفاصيل التحويل", es: "DETALLES DEL TRASLADO" },
  "Net Hakediş": { en: "Net Earnings", ar: "صافي المستحقات", es: "Liquidación neta" },
  "OPERASYON ATAMASI": { en: "OPERATION ASSIGNMENT", ar: "تعيين العملية", es: "ASIGNACIÓN OPERATIVA" },
  "Sürücü ve Araç": { en: "Driver and Vehicle", ar: "السائق والمركبة", es: "Conductor y vehículo" },
  Atandı: { en: "Assigned", ar: "تم التعيين", es: "Asignado" },
  Atanmadı: { en: "Unassigned", ar: "غير معيّن", es: "Sin asignar" },
  "MEVCUT SÜRÜCÜ": { en: "CURRENT DRIVER", ar: "السائق الحالي", es: "CONDUCTOR ACTUAL" },
  "MEVCUT ARAÇ": { en: "CURRENT VEHICLE", ar: "المركبة الحالية", es: "VEHÍCULO ACTUAL" },
  Sürücü: { en: "Driver", ar: "السائق", es: "Conductor" },
  Araç: { en: "Vehicle", ar: "المركبة", es: "Vehículo" },
  "Sürücü seçin": { en: "Select driver", ar: "اختر السائق", es: "Seleccionar conductor" },
  "Araç seçin": { en: "Select vehicle", ar: "اختر المركبة", es: "Seleccionar vehículo" },
  "Transferi Ata": { en: "Assign Transfer", ar: "تعيين التحويل", es: "Asignar traslado" },
  "Atamayı Güncelle": { en: "Update Assignment", ar: "تحديث التعيين", es: "Actualizar asignación" },
  "Atamayı Kaldır": { en: "Remove Assignment", ar: "إلغاء التعيين", es: "Quitar asignación" },
  Operasyon: { en: "Operation", ar: "العملية", es: "Operación" },
  "Alış zamanı": { en: "Pickup time", ar: "وقت الاستلام", es: "Hora de recogida" },
  "Araç tipi": { en: "Vehicle type", ar: "نوع المركبة", es: "Tipo de vehículo" },
  Uçuş: { en: "Flight", ar: "الرحلة", es: "Vuelo" },
  Yolcu: { en: "Passenger", ar: "الراكب", es: "Pasajero" },
  "Ad Soyad": { en: "Full Name", ar: "الاسم الكامل", es: "Nombre completo" },
  Telefon: { en: "Phone", ar: "الهاتف", es: "Teléfono" },
  Bekliyor: { en: "Waiting", ar: "قيد الانتظار", es: "Pendiente" },
  "Uçuş yok": { en: "No flight", ar: "لا توجد رحلة", es: "Sin vuelo" },
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
      const next = translateValue(current, language);
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
    <div className="skyfleet-language-switcher" dir="ltr">
      <span>🌐</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
        {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
    </div>
  );
}
