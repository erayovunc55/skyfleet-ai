import { useLanguage } from "../i18n";

const TEXT = {
  tr: { insurance: "Sigorta", notProvided: "Belirtilmedi", noDate: "Sigorta tarihi girilmedi", invalid: "Geçersiz tarih", check: "Tarih bilgisi kontrol edilmeli", expired: (d) => `${d} gün önce süresi doldu`, today: "Sigorta bugün sona eriyor", left: (d) => `${d} gün kaldı`, valid: (d) => `${d} gün geçerli` },
  en: { insurance: "Insurance", notProvided: "Not provided", noDate: "Insurance expiry not entered", invalid: "Invalid date", check: "Date information should be checked", expired: (d) => `Expired ${d} days ago`, today: "Insurance expires today", left: (d) => `${d} days remaining`, valid: (d) => `Valid for ${d} days` },
  ar: { insurance: "التأمين", notProvided: "غير محدد", noDate: "لم يتم إدخال تاريخ انتهاء التأمين", invalid: "تاريخ غير صالح", check: "يجب التحقق من التاريخ", expired: (d) => `انتهى منذ ${d} يوم`, today: "ينتهي التأمين اليوم", left: (d) => `متبقي ${d} يوم`, valid: (d) => `صالح لمدة ${d} يوم` },
  es: { insurance: "Seguro", notProvided: "No indicado", noDate: "No se indicó vencimiento del seguro", invalid: "Fecha no válida", check: "Debe revisarse la fecha", expired: (d) => `Venció hace ${d} días`, today: "El seguro vence hoy", left: (d) => `Quedan ${d} días`, valid: (d) => `Válido por ${d} días` },
};

export default function VehicleInsuranceStatus({ expiryDate }) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const insurance = calculateInsuranceStatus(expiryDate, language, text);

  return (
    <div className={`vehicle-insurance-status ${insurance.className}`}>
      <div>
        <span>{text.insurance}</span>
        <strong>{insurance.dateLabel}</strong>
      </div>
      <small>{insurance.message}</small>
    </div>
  );
}

function calculateInsuranceStatus(expiryDate, language, text) {
  if (!expiryDate) return { className: "unknown", dateLabel: text.notProvided, message: text.noDate };
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return { className: "unknown", dateLabel: text.invalid, message: text.check };
  expiry.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remainingDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const locales = { tr: "tr-TR", en: "en-GB", ar: "ar-SA", es: "es-ES" };
  const dateLabel = expiry.toLocaleDateString(locales[language] || "en-GB");
  if (remainingDays < 0) return { className: "expired", dateLabel, message: text.expired(Math.abs(remainingDays)) };
  if (remainingDays === 0) return { className: "critical", dateLabel, message: text.today };
  if (remainingDays < 30) return { className: "critical", dateLabel, message: text.left(remainingDays) };
  if (remainingDays <= 60) return { className: "warning", dateLabel, message: text.left(remainingDays) };
  return { className: "safe", dateLabel, message: text.valid(remainingDays) };
}
