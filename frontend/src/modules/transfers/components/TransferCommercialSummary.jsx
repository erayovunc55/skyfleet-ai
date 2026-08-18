export default function TransferCommercialSummary({
  transfer,
}) {
  if (!transfer) {
    return null;
  }

  return (
    <section className="transfer-commercial-summary">
      <div className="transfer-commercial-summary-heading">
        <span>TİCARİ BİLGİLER</span>

        <h3>Rezervasyon ve Fiyat Özeti</h3>
      </div>

      <div className="transfer-commercial-summary-grid">
        <CommercialItem
          label="Satış Fiyatı"
          value={formatPrice(
            transfer.price,
            transfer.currency,
          )}
          highlight
        />

        <CommercialItem
          label="Para Birimi"
          value={
            transfer.currency ||
            "Belirtilmedi"
          }
        />

        <CommercialItem
          label="Tedarikçi"
          value={
            transfer.supplier ||
            "Belirtilmedi"
          }
        />

        <CommercialItem
          label="Rezervasyon Kaynağı"
          value={
            transfer.ota_source ||
            "Manuel"
          }
        />

        <CommercialItem
          label="Araç Tipi"
          value={
            transfer.vehicle_type ||
            "Belirtilmedi"
          }
        />

        <CommercialItem
          label="SF Rezervasyon No"
          value={
            transfer.booking_reference ||
            `#${transfer.id}`
          }
        />

        {transfer.ota_booking_reference && (
          <CommercialItem
            label="OTA Sipariş No"
            value={
              transfer.ota_booking_reference
            }
          />
        )}
      </div>
    </section>
  );
}

function CommercialItem({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="transfer-commercial-summary-item">
      <span>{label}</span>

      <strong
        className={
          highlight
            ? "highlight"
            : undefined
        }
      >
        {value}
      </strong>
    </div>
  );
}

function formatPrice(
  value,
  currency,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Fiyat girilmedi";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} ${currency || ""}`.trim();
  }

  try {
    return new Intl.NumberFormat(
      "tr-TR",
      {
        style: "currency",
        currency:
          currency || "EUR",
        minimumFractionDigits: 2,
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${
      currency || ""
    }`.trim();
  }
}