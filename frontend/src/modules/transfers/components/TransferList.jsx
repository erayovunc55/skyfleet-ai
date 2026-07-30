import TransferListItem from "./TransferListItem";
import useTransfer from "../hooks/useTransfer";

export default function TransferList({
  transfers = [],
  loading = false,
  error = "",
}) {
  const {
    selectedTransfer,
    selectTransfer,
  } = useTransfer();

  if (loading) {
    return (
      <div className="transfer-list-state">
        Transferler yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="transfer-list-state error">
        {error}
      </div>
    );
  }

  if (!Array.isArray(transfers) || transfers.length === 0) {
    return (
      <div className="transfer-list-state">
        Henüz transfer bulunmuyor.
      </div>
    );
  }

  return (
    <div className="transfer-list">
      {transfers.map((transfer) => (
        <TransferListItem
          key={transfer.id}
          transfer={transfer}
          active={
            Number(selectedTransfer?.id) ===
            Number(transfer.id)
          }
          onClick={() =>
            selectTransfer(transfer)
          }
        />
      ))}
    </div>
  );
}