import {
  useEffect,
  useState,
} from "react";

import supplierService from "../../suppliers/services/supplierService";
import transferService from "../services/transferService";

export default function TransferSupplierAssignment({
  transfer,
  onAssigned,
}) {
  const [suppliers, setSuppliers] =
    useState([]);

  const [
    selectedSupplierId,
    setSelectedSupplierId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const canAssign = [
    "pending",
    "accepted",
  ].includes(transfer?.status);

  useEffect(() => {
    setSelectedSupplierId(
      transfer?.supplier_id
        ? String(
            transfer.supplier_id,
          )
        : "",
    );

    setError("");
    setMessage("");
  }, [
    transfer?.id,
    transfer?.supplier_id,
  ]);

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      setLoading(true);
      setError("");

      try {
        const response =
          await supplierService
            .getSuppliers({
              status: "approved",
              is_active: 1,
              per_page: 100,
            });

        const items = Array.isArray(
          response?.data,
        )
          ? response.data
          : Array.isArray(
                response?.data?.data,
              )
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];

        if (active) {
          setSuppliers(items);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Tedarikçiler yüklenemedi.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSuppliers();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    if (
      !transfer?.id ||
      !canAssign
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedTransfer =
        await transferService
          .updateDispatcherTransfer(
            transfer.id,
            {
              supplier_id:
                selectedSupplierId
                  ? Number(
                      selectedSupplierId,
                    )
                  : null,
            },
          );

      setMessage(
        selectedSupplierId
          ? "Transfer tedarikçiye atandı."
          : "Tedarikçi ataması kaldırıldı.",
      );

      onAssigned?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        requestError?.response
          ?.data?.errors
          ?.supplier_id?.[0] ||
          requestError?.response
            ?.data?.message ||
          requestError?.message ||
          "Tedarikçi ataması kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!transfer) {
    return null;
  }

  return (
    <section className="transfer-supplier-assignment">
      <div className="transfer-supplier-assignment-header">
        <div>
          <span className="transfer-supplier-eyebrow">
            OPERASYON TEDARİKÇİSİ
          </span>

          <h3>
            Tedarikçi Ataması
          </h3>
        </div>

        <div
          className={
            transfer?.supplier_company
              ? "transfer-supplier-state assigned"
              : "transfer-supplier-state"
          }
        >
          {transfer?.supplier_company
            ? "Atandı"
            : "Atanmadı"}
        </div>
      </div>

      {transfer?.supplier_company && (
        <div className="transfer-current-supplier">
          <span>
            Mevcut tedarikçi
          </span>

          <strong>
            {
              transfer
                .supplier_company
                .company_name
            }
          </strong>

          <small>
            {transfer
              .supplier_company
              .city ||
              "Şehir belirtilmedi"}
          </small>
        </div>
      )}

      <div className="transfer-supplier-assignment-form">
        <label>
          <span>
            Tedarikçi
          </span>

          <select
            value={
              selectedSupplierId
            }
            disabled={
              loading ||
              saving ||
              !canAssign
            }
            onChange={(event) =>
              setSelectedSupplierId(
                event.target.value,
              )
            }
          >
            <option value="">
              Tedarikçi atamasını kaldır
            </option>

            {suppliers.map(
              (supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.company_name}
                  {supplier.city
                    ? ` — ${supplier.city}`
                    : ""}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          disabled={
            loading ||
            saving ||
            !canAssign
          }
          onClick={handleSave}
        >
          {saving
            ? "Kaydediliyor..."
            : "Atamayı Kaydet"}
        </button>
      </div>

      {loading && (
        <div className="transfer-supplier-info">
          Aktif tedarikçiler yükleniyor...
        </div>
      )}

      {!loading &&
        suppliers.length === 0 && (
          <div className="transfer-supplier-info">
            Onaylı ve aktif tedarikçi bulunamadı.
          </div>
        )}

      {!canAssign && (
        <div className="transfer-supplier-info warning">
          Operasyonu başlamış veya kapanmış transferin
          tedarikçi ataması değiştirilemez.
        </div>
      )}

      {error && (
        <div className="transfer-supplier-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="transfer-supplier-message success">
          {message}
        </div>
      )}
    </section>
  );
}