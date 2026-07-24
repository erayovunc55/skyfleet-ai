export default function ModulePlaceholderPage({
  eyebrow = "SKYFLEET AI",
  title,
  description,
}) {
  return (
    <main className="module-placeholder-page">
      <section className="module-placeholder-card">
        <p>{eyebrow}</p>
        <h1>{title}</h1>

        <span>
          {description ||
            "Bu modülün geliştirme altyapısı hazırlandı."}
        </span>
      </section>
    </main>
  );
}