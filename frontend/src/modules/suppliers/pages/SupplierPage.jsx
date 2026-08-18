import {
  useState,
} from "react";

import {
  Button,
  Card,
} from "../../../components/ui";

import CreateSupplierModal from "../components/CreateSupplierModal";
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

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  function handleSelectSupplier(
    supplier,
  ) {
    console.log(
      "Seçilen tedarikçi:",
      supplier,
    );
  }

  async function handleSupplierCreated() {
    setSuccessMessage(
      "Tedarikçi ve portal hesabı başarıyla oluşturuldu.",
    );

    await reload();

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  }

  return (
    <main className="supplier-page">
      <header className="supplier-page-header">
        <div>
          <small>
            TEDARİKÇİ AĞI
          </small>

          <h1>
            Tedarikçi Yönetimi
          </h1>

          <span>
            Tedarikçileri, portal hesaplarını
            ve operasyon durumlarını yönetin.
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

          <Button
            variant="primary"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            + Yeni Tedarikçi
          </Button>
        </div>
      </header>

      {successMessage && (
        <div className="supplier-page-success">
          {successMessage}
        </div>
      )}

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

      {showCreateModal && (
        <CreateSupplierModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreated={
            handleSupplierCreated
          }
        />
      )}
    </main>
  );
}