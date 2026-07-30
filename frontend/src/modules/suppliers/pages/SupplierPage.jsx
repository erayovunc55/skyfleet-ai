import {
  Button,
  Card,
} from "../../../components/ui";

import SupplierList from "../components/SupplierList";
import SupplierStats from "../components/SupplierStats";
import useSuppliers from "../hooks/useSuppliers";

export default function SupplierPage() {
  const {
    suppliers,
    loading,
    error,
    reload,
  } = useSuppliers();

  function handleSelectSupplier(supplier) {
    console.log(
      "Seçilen tedarikçi:",
      supplier,
    );
  }

  return (
    <main className="supplier-page">
      <header className="supplier-page-header">
        <div>
          <p>TEDARİKÇİ AĞI</p>

          <h1>Supplier Management</h1>

          <span>
            Tedarikçi başvurularını, şubeleri ve
            operasyon durumlarını yönetin.
          </span>
        </div>

        <div className="supplier-page-actions">
          <Button
            variant="ghost"
            loading={loading}
            onClick={reload}
          >
            Yenile
          </Button>

          <Button variant="primary">
            Yeni Tedarikçi
          </Button>
        </div>
      </header>

      <SupplierStats
        suppliers={suppliers}
      />

      <Card
        title="Tedarikçiler"
        subtitle={`${suppliers.length} kayıt görüntüleniyor`}
      >
        <SupplierList
          suppliers={suppliers}
          loading={loading}
          error={error}
          onSelectSupplier={
            handleSelectSupplier
          }
        />
      </Card>
    </main>
  );
}