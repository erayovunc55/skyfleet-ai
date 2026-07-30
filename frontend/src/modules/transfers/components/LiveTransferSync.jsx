import useLiveTransfer from "../hooks/useLiveTransfer";
import useTransfer from "../hooks/useTransfer";

const TRACKABLE_STATUSES = [
  "accepted",
  "on_the_way",
  "arrived",
  "passenger_called",
  "passenger_on_board",
  "trip_started",
];

export default function LiveTransferSync() {
  const {
    selectedTransfer,
    updateSelectedTransfer,
  } = useTransfer();

  const enabled =
    Boolean(selectedTransfer?.id) &&
    TRACKABLE_STATUSES.includes(
      selectedTransfer?.status,
    );

  const {
    refreshing,
    error,
    lastUpdatedAt,
    refresh,
  } = useLiveTransfer({
    transferId: selectedTransfer?.id,
    enabled,
    interval: 10000,
    onUpdate: updateSelectedTransfer,
  });

  if (!selectedTransfer) {
    return null;
  }

  return (
    <div className="live-transfer-sync">
      <div
        className={
          enabled
            ? "live-transfer-sync-status active"
            : "live-transfer-sync-status"
        }
      >
        <span />

        <div>
          <strong>
            {enabled
              ? "Canlı Takip Aktif"
              : "Canlı Takip Beklemede"}
          </strong>

          <small>
            {lastUpdatedAt
              ? `Son yenileme: ${formatTime(
                  lastUpdatedAt,
                )}`
              : "Henüz yenilenmedi"}
          </small>
        </div>
      </div>

      <button
        type="button"
        disabled={refreshing}
        onClick={refresh}
      >
        {refreshing
          ? "Yenileniyor..."
          : "Şimdi Yenile"}
      </button>

      {error && (
        <p className="live-transfer-sync-error">
          {error}
        </p>
      )}
    </div>
  );
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Bilinmiyor";
  }

  return date.toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}