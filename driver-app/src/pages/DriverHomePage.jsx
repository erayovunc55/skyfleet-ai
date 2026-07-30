import {
  useEffect,
  useState,
} from "react";
import LocationGate from "../components/LocationGate";
import DriverTransferCard from "../components/DriverTransferCard";
import DriverTransferDetailPage from "./DriverTransferDetailPage";
import transferService from "../services/transferService";

export default function DriverHomePage({
  user,
  onLogout,
}) {
  const [transfers, setTransfers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedTransfer,
    setSelectedTransfer,
  ] = useState(null);

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    setLoading(true);
    setError("");

    try {
      const items =
        await transferService
          .getAssignedTransfers();

      setTransfers(
        Array.isArray(items)
          ? items
          : [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Transferler yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleTransferUpdated(
    updatedTransfer,
  ) {
    setSelectedTransfer(
      updatedTransfer,
    );

    setTransfers(
      (currentTransfers) =>
        currentTransfers.map(
          (transfer) =>
            transfer.id ===
            updatedTransfer.id
              ? updatedTransfer
              : transfer,
        ),
    );
  }

if (selectedTransfer) {
  return (
    <LocationGate>
      <DriverTransferDetailPage
        initialTransfer={selectedTransfer}
        onBack={() =>
          setSelectedTransfer(null)
        }
        onTransferUpdated={
          handleTransferUpdated
        }
      />
    </LocationGate>
  );
}

  return (
    <main className="driver-home-page">
      <header>
        <div>
          <small>SKYFLEET AI</small>

          <h1>
            Merhaba, {user?.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={onLogout}
        >
          Çıkış
        </button>
      </header>

      <section className="driver-home-summary">
        <div>
          <span>
            Atanmış Transfer
          </span>

          <strong>
            {transfers.length}
          </strong>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadTransfers}
        >
          Yenile
        </button>
      </section>

      {loading && (
        <div className="driver-page-state">
          Transferler yükleniyor...
        </div>
      )}

      {error && (
        <div className="driver-page-state error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        transfers.length === 0 && (
          <div className="driver-empty-card">
            <strong>
              Atanmış transfer yok
            </strong>

            <p>
              Yeni transfer atandığında
              burada görünecek.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        transfers.length > 0 && (
          <section className="driver-transfer-list">
            {transfers.map(
              (transfer) => (
                <DriverTransferCard
                  key={transfer.id}
                  transfer={transfer}
                  onOpen={
                    setSelectedTransfer
                  }
                />
              ),
            )}
          </section>
        )}
    </main>
  );
}