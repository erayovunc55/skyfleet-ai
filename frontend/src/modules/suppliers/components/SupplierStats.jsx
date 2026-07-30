import { Card } from "../../../components/ui";

export default function SupplierStats({
  suppliers = [],
}) {
  const stats = {
    total: suppliers.length,

    pending: suppliers.filter((supplier) =>
      [
        "pending",
        "under_review",
      ].includes(supplier.status),
    ).length,

    approved: suppliers.filter(
      (supplier) =>
        supplier.status === "approved",
    ).length,

    revisionRequested: suppliers.filter(
      (supplier) =>
        supplier.status ===
        "revision_requested",
    ).length,

    suspended: suppliers.filter(
      (supplier) =>
        supplier.status === "suspended",
    ).length,
  };

  return (
    <section className="supplier-stats-grid">
      <StatCard
        label="Toplam Tedarikçi"
        value={stats.total}
        tone="info"
      />

      <StatCard
        label="Onay Bekleyen"
        value={stats.pending}
        tone="warning"
      />

      <StatCard
        label="Onaylanan"
        value={stats.approved}
        tone="success"
      />

      <StatCard
        label="Revizyon İstenen"
        value={stats.revisionRequested}
        tone="purple"
      />

      <StatCard
        label="Askıya Alınan"
        value={stats.suspended}
        tone="danger"
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}) {
  return (
    <Card
      className={`supplier-stat-card supplier-stat-${tone}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}