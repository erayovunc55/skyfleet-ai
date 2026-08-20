import {
  useEffect,
  useState,
} from "react";

import supplierService from "../../suppliers/services/supplierService";
import transferService from "../services/transferService";
import "../../../styles/modules/transfer-supplier-suggestions.css";

const REASON_LABELS = {
  pickup_coverage: "Pickup coverage",
  dropoff_coverage: "Dropoff coverage",
  operational_vehicle_available: "Operasyonel araç mevcut",
  passenger_capacity_fit: "Yolcu kapasitesi uygun",
  luggage_capacity_fit: "Bagaj kapasitesi uygun",
  vehicle_type_fit: "Araç tipi uyumlu",
  active_driver_available: "Aktif sürücü mevcut",
};

const WARNING_LABELS = {
  no_operational_vehicle: "Operasyonel araç yok",
  passenger_capacity_unavailable: "Yolcu kapasitesi doğrulanamadı",
  luggage_capacity_unavailable: "Bagaj kapasitesi yetersiz",
  vehicle_type_not_confirmed: "Araç tipi doğrulanamadı",
  no_active_driver: "Aktif sürücü yok",
};

export default function TransferSupplierAssignment({
  transfer,
  onAssigned,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [autoSuggestedSupplierId, setAutoSuggestedSupplierId] = useState("");
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [matchError, setMatchError] = useState("");
  const [message, setMessage] = useState("");

  const canAssign = ["pending", "accepted"].includes(transfer?.status);

  useEffect(() => {
    setSelectedSupplierId(
      transfer?.supplier_id ? String(transfer.supplier_id) : "",
    );
    setAutoSuggestedSupplierId("");
    setError("");
    setMessage("");
  }, [transfer?.id, transfer?.supplier_id]);

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      setLoading(true);
      setError("");

      try {
        const response = await supplierService.getSuppliers({
          status: "approved",
          is_active: 1,
          per_page: 100,
        });

        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];

        if (active) setSuppliers(items);
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Tedarikçiler yüklenemedi.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSuppliers();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      if (!transfer?.id) return;

      setMatching(true);
      setMatchError("");

      try {
        const items = await transferService.getSupplierMatches(transfer.id);
        if (!active) return;

        setMatches(items);

        const bestMatch = Array.isArray(items)
          ? items.find((item) => item?.eligible)
          : null;

        if (
          bestMatch &&
          !transfer?.supplier_id &&
          canAssign
        ) {
          const bestSupplierId = String(bestMatch.supplier_id);
          setSelectedSupplierId(bestSupplierId);
          setAutoSuggestedSupplierId(bestSupplierId);
        }
      } catch (requestError) {
        if (active) {
          setMatches([]);
          setAutoSuggestedSupplierId("");
          setMatchError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Tedarikçi önerileri alınamadı.",
          );
        }
      } finally {
        if (active) setMatching(false);
      }
    }

    loadMatches();
    return () => { active = false; };
  }, [
    transfer?.id,
    transfer?.supplier_id,
    transfer?.pickup_location_id,
    transfer?.dropoff_location_id,
    canAssign,
  ]);

  async function handleSave() {
    if (!transfer?.id || !canAssign) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedTransfer = await transferService.updateDispatcherTransfer(
        transfer.id,
        {
          supplier_id: selectedSupplierId ? Number(selectedSupplierId) : null,
        },
      );

      setAutoSuggestedSupplierId("");
      setMessage(
        selectedSupplierId
          ? "Transfer tedarikçiye atandı."
          : "Tedarikçi ataması kaldırıldı.",
      );

      onAssigned?.(updatedTransfer);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.errors?.supplier_id?.[0] ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Tedarikçi ataması kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!transfer) return null;

  const bestEligibleMatch = matches.find((match) => match?.eligible);
  const autoSuggestionPending =
    !transfer.supplier_id &&
    autoSuggestedSupplierId &&
    String(selectedSupplierId) === String(autoSuggestedSupplierId);

  return (
    <section className="transfer-supplier-assignment">
      <div className="transfer-supplier-assignment-header">
        <div>
          <span className="transfer-supplier-eyebrow">OPERASYON TEDARİKÇİSİ</span>
          <h3>Tedarikçi Ataması</h3>
        </div>

        <div className={transfer?.supplier_company ? "transfer-supplier-state assigned" : "transfer-supplier-state"}>
          {transfer?.supplier_company ? "Atandı" : "Atanmadı"}
        </div>
      </div>

      <div className="transfer-supplier-suggestions">
        <div className="transfer-supplier-suggestions-header">
          <div>
            <span>SKYFLEET MATCHING</span>
            <strong>Akıllı Tedarikçi Sıralaması</strong>
          </div>
          {bestEligibleMatch && <b>{bestEligibleMatch.score}% en iyi uygun eşleşme</b>}
        </div>

        {matching && <div className="transfer-supplier-suggestion-state">Coverage, araç ve sürücü uygunluğu hesaplanıyor...</div>}

        {!matching && matchError && (
          <div className="transfer-supplier-suggestion-state warning">{matchError}</div>
        )}

        {!matching && !matchError && matches.length === 0 && (
          <div className="transfer-supplier-suggestion-state">
            {transfer.pickup_location_id || transfer.dropoff_location_id
              ? "Bu transfer için aktif coverage eşleşmesi bulunamadı."
              : "Öneri için transferin pickup veya dropoff lokasyonu Location Control Center ile eşleşmelidir."}
          </div>
        )}

        {autoSuggestionPending && (
          <div className="transfer-supplier-suggestion-state auto-ready">
            En iyi uygun tedarikçi otomatik ön-seçildi. Atama henüz yapılmadı; onaylamak için “Atamayı Kaydet” düğmesine basın.
          </div>
        )}

        {!matching && matches.length > 0 && !bestEligibleMatch && (
          <div className="transfer-supplier-suggestion-state warning">
            Coverage eşleşmesi var ancak araç/sürücü uygunluğu doğrulanamadı. Otomatik ön-seçim yapılmadı.
          </div>
        )}

        {!matching && matches.length > 0 && (
          <div className="transfer-supplier-suggestion-list">
            {matches.slice(0, 5).map((match, index) => (
              <article
                className={`${index === 0 ? "is-best" : ""} ${match.eligible ? "is-eligible" : "needs-review"}`.trim()}
                key={match.supplier_id}
              >
                <div className="transfer-supplier-suggestion-rank">#{index + 1}</div>
                <div className="transfer-supplier-suggestion-main">
                  <strong>{match.company_name}</strong>
                  <span>{[match.city, match.country_code].filter(Boolean).join(", ") || "Konum belirtilmedi"}</span>

                  <div className="transfer-supplier-suggestion-reasons">
                    {(match.reasons || []).map((reason) => (
                      <small key={reason}>{REASON_LABELS[reason] || reason}</small>
                    ))}
                  </div>

                  {(match.warnings || []).length > 0 && (
                    <div className="transfer-supplier-suggestion-reasons warning-tags">
                      {match.warnings.map((warning) => (
                        <small key={warning}>{WARNING_LABELS[warning] || warning}</small>
                      ))}
                    </div>
                  )}

                  {match.best_vehicle && (
                    <span className="transfer-supplier-best-vehicle">
                      En uygun araç: {[match.best_vehicle.brand, match.best_vehicle.model, match.best_vehicle.plate]
                        .filter(Boolean)
                        .join(" · ")}
                      {match.best_vehicle.passenger_capacity
                        ? ` · ${match.best_vehicle.passenger_capacity} pax`
                        : ""}
                    </span>
                  )}
                </div>

                <div className="transfer-supplier-suggestion-side">
                  <b className={`match-score match-${match.match_level}`}>{match.score}%</b>
                  <small>
                    {match.match_level === "full"
                      ? "Operational Match"
                      : match.match_level === "review"
                        ? "Manual Review"
                        : "Partial Match"}
                  </small>
                  <span>{match.vehicles_count} uygun araç · {match.drivers_count} aktif sürücü</span>
                  <button
                    type="button"
                    disabled={!canAssign || saving || !match.eligible}
                    onClick={() => {
                      setSelectedSupplierId(String(match.supplier_id));
                      setAutoSuggestedSupplierId("");
                    }}
                  >
                    {!match.eligible
                      ? "Kontrol gerekli"
                      : String(selectedSupplierId) === String(match.supplier_id)
                        ? "Seçildi"
                        : "Bu tedarikçiyi seç"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {transfer?.supplier_company && (
        <div className="transfer-current-supplier">
          <span>Mevcut tedarikçi</span>
          <strong>{transfer.supplier_company.company_name}</strong>
          <small>{transfer.supplier_company.city || "Şehir belirtilmedi"}</small>
        </div>
      )}

      <div className="transfer-supplier-assignment-form">
        <label>
          <span>Tedarikçi</span>
          <select
            value={selectedSupplierId}
            disabled={loading || saving || !canAssign}
            onChange={(event) => {
              setSelectedSupplierId(event.target.value);
              setAutoSuggestedSupplierId("");
            }}
          >
            <option value="">Tedarikçi atamasını kaldır</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.company_name}{supplier.city ? ` — ${supplier.city}` : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={loading || saving || !canAssign}
          onClick={handleSave}
        >
          {saving ? "Kaydediliyor..." : "Atamayı Kaydet"}
        </button>
      </div>

      {loading && <div className="transfer-supplier-info">Aktif tedarikçiler yükleniyor...</div>}
      {!loading && suppliers.length === 0 && <div className="transfer-supplier-info">Onaylı ve aktif tedarikçi bulunamadı.</div>}
      {!canAssign && <div className="transfer-supplier-info warning">Operasyonu başlamış veya kapanmış transferin tedarikçi ataması değiştirilemez.</div>}
      {error && <div className="transfer-supplier-message error">{error}</div>}
      {message && <div className="transfer-supplier-message success">{message}</div>}
    </section>
  );
}
