import TransferListItem from "./TransferListItem";
import useTransfer from "../hooks/useTransfer";
import { useLanguage } from "../../../i18n";

const TEXT = {
  tr: {
    loading: "Transferler yükleniyor...",
    empty: "Henüz transfer bulunmuyor.",
  },
  en: {
    loading: "Loading transfers...",
    empty: "No transfers found yet.",
  },
  ar: {
    loading: "جارٍ تحميل التحويلات...",
    empty: "لا توجد تحويلات حتى الآن.",
  },
  es: {
    loading: "Cargando traslados...",
    empty: "Aún no hay traslados.",
  },
};

export default function TransferList({
  transfers = [],
  loading = false,
  error = "",
  selectedIds = [],
  onToggleSelect,
  isSelectable,
}) {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  const {
    selectedTransfer,
    selectTransfer,
  } = useTransfer();

  if (loading) {
    return (
      <div className="transfer-list-state">
        {text.loading}
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
        {text.empty}
      </div>
    );
  }

  return (
    <div className="transfer-list">
      {transfers.map((transfer) => {
        const selectable = typeof isSelectable === "function"
          ? isSelectable(transfer)
          : Boolean(onToggleSelect);

        return (
          <TransferListItem
            key={transfer.id}
            transfer={transfer}
            active={
              Number(selectedTransfer?.id) ===
              Number(transfer.id)
            }
            selected={selectedIds.some((id) => Number(id) === Number(transfer.id))}
            selectable={selectable}
            onToggleSelect={onToggleSelect}
            onClick={() =>
              selectTransfer(transfer)
            }
          />
        );
      })}
    </div>
  );
}
