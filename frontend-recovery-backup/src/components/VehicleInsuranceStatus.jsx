export default function VehicleInsuranceStatus({
  expiryDate,
}) {
  const insurance = calculateInsuranceStatus(
    expiryDate,
  );

  return (
    <div
      className={`vehicle-insurance-status ${insurance.className}`}
    >
      <div>
        <span>Sigorta</span>

        <strong>{insurance.dateLabel}</strong>
      </div>

      <small>{insurance.message}</small>
    </div>
  );
}

function calculateInsuranceStatus(expiryDate) {
  if (!expiryDate) {
    return {
      className: "unknown",
      dateLabel: "Belirtilmedi",
      message: "Sigorta tarihi girilmedi",
    };
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return {
      className: "unknown",
      dateLabel: "Geçersiz tarih",
      message: "Tarih bilgisi kontrol edilmeli",
    };
  }

  expiry.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const differenceInMilliseconds =
    expiry.getTime() - today.getTime();

  const remainingDays = Math.ceil(
    differenceInMilliseconds /
      (1000 * 60 * 60 * 24),
  );

  const dateLabel = expiry.toLocaleDateString(
    "tr-TR",
  );

  if (remainingDays < 0) {
    return {
      className: "expired",
      dateLabel,
      message: `${Math.abs(
        remainingDays,
      )} gün önce süresi doldu`,
    };
  }

  if (remainingDays === 0) {
    return {
      className: "critical",
      dateLabel,
      message: "Sigorta bugün sona eriyor",
    };
  }

  if (remainingDays < 30) {
    return {
      className: "critical",
      dateLabel,
      message: `${remainingDays} gün kaldı`,
    };
  }

  if (remainingDays <= 60) {
    return {
      className: "warning",
      dateLabel,
      message: `${remainingDays} gün kaldı`,
    };
  }

  return {
    className: "safe",
    dateLabel,
    message: `${remainingDays} gün geçerli`,
  };
}