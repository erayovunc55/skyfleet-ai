import LiveTransferSync from "../components/LiveTransferSync";
import LiveOperationMap from "../components/LiveOperationMap";
import TransferDetail from "../components/TransferDetail";
import { useEffect } from "react";
import TimelineCard from "../components/TimelineCard";
import {
  Button,
  Card,
  StatusBadge,
} from "../../../components/ui";

import TransferList from "../components/TransferList";
import useTransfer from "../hooks/useTransfer";
import useTransfers from "../hooks/useTransfers";

export default function TransferWorkspace() {
  const {
    transfers,
    loading,
    error,
    reload,
  } = useTransfers();

  const {
    selectedTransfer,
    selectTransfer,
  } = useTransfer();

  useEffect(() => {
    if (
      !selectedTransfer &&
      transfers.length > 0
    ) {
      selectTransfer(transfers[0]);
    }
  }, [
    selectedTransfer,
    transfers,
    selectTransfer,
  ]);

  return (
    <main className="transfer-workspace">
      <Card
        className="transfer-workspace-list"
        title="Günün Operasyonları"
        subtitle={`${transfers.length} transfer`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            loading={loading}
            onClick={reload}
          >
            Yenile
          </Button>
        }
      >
        <TransferList
          transfers={transfers}
          loading={loading}
          error={error}
        />
      </Card>

      <Card
        className="transfer-workspace-detail"
        title="Transfer Detayı"
        subtitle={
          selectedTransfer
            ? selectedTransfer.booking_reference
            : "Transfer seçilmedi"
        }
        actions={
          selectedTransfer ? (
            <StatusBadge
              status={selectedTransfer.status}
            />
          ) : null
        }
      >
        {selectedTransfer ? (
  <TransferDetail />
) : (
  <div className="transfer-detail-empty">
    Detayları görüntülemek için soldan bir
    transfer seçin.
  </div>
)}
      </Card>

 <Card
  className="transfer-workspace-map"
  title="Canlı Operasyon Haritası"
  subtitle="GPS, pickup ve dropoff bilgileri"
>
  <LiveTransferSync />

  <LiveOperationMap />
</Card>

<section className="transfer-workspace-timeline">
  <TimelineCard />
</section>
    </main>
  );
}
