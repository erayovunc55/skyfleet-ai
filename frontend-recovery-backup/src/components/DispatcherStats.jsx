export default function DispatcherStats({
  active,
  completed,
  waiting,
}) {
  return (
    <section className="dispatcher-stats">
      <article className="dispatcher-stat-card">
        <span>Aktif Transfer</span>
        <strong>{active}</strong>
        <small>Devam eden operasyonlar</small>
      </article>

      <article className="dispatcher-stat-card">
        <span>Bekleyen</span>
        <strong>{waiting}</strong>
        <small>Henüz başlamayan işler</small>
      </article>

      <article className="dispatcher-stat-card">
        <span>Tamamlanan</span>
        <strong>{completed}</strong>
        <small>Bugün tamamlanan işler</small>
      </article>
    </section>
  );
}