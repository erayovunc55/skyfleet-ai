import {
  Avatar,
  StatusBadge,
} from "../../../components/ui";

export default function SupplierListItem({
  supplier,
  onClick,
}) {
  return (
    <button
      className="supplier-list-item"
      type="button"
      onClick={onClick}
    >
      <div className="supplier-list-company">
        <Avatar
          name={supplier.company_name}
          size="md"
        />

        <div>
          <strong>
            {supplier.company_name}
          </strong>

          <span>
            {supplier.legal_name ||
              "Ticari unvan belirtilmedi"}
          </span>
        </div>
      </div>

      <div className="supplier-list-location">
        <span>Konum</span>

        <strong>
          {formatLocation(supplier)}
        </strong>
      </div>

      <div className="supplier-list-contact">
        <span>Yetkili</span>

        <strong>
          {supplier.contact_name ||
            "Belirtilmedi"}
        </strong>

        <small>
          {supplier.email ||
            supplier.phone ||
            "İletişim bilgisi yok"}
        </small>
      </div>

      <div className="supplier-list-branches">
        <span>Şubeler</span>

        <strong>
          {Number(
            supplier.branches_count || 0,
          )}
        </strong>
      </div>

      <div className="supplier-list-status">
        <StatusBadge
          status={supplier.status}
        />

        <small>
          {supplier.is_active
            ? "Operasyona açık"
            : "Operasyona kapalı"}
        </small>
      </div>

      <span className="supplier-list-arrow">
        →
      </span>
    </button>
  );
}

function formatLocation(supplier) {
  const parts = [
    supplier.city,
    supplier.country_name ||
      supplier.country_code,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : "Konum belirtilmedi";
}