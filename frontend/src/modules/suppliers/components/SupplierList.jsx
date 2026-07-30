import SupplierListItem from "./SupplierListItem";

export default function SupplierList({
  suppliers = [],
  loading = false,
  error = "",
  onSelectSupplier,
}) {
  if (loading) {
    return (
      <div className="supplier-list-state">
        Tedarikçiler yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="supplier-list-state error">
        {error}
      </div>
    );
  }

  if (
    !Array.isArray(suppliers) ||
    suppliers.length === 0
  ) {
    return (
      <div className="supplier-list-state">
        Henüz tedarikçi kaydı bulunmuyor.
      </div>
    );
  }

  return (
    <div className="supplier-list">
      {suppliers.map((supplier) => (
        <SupplierListItem
          key={supplier.id}
          supplier={supplier}
          onClick={() =>
            onSelectSupplier?.(supplier)
          }
        />
      ))}
    </div>
  );
}