import "./card.css";

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}) {
  const classes = [
    "sf-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {(title || subtitle || actions) && (
        <header className="sf-card-header">
          <div className="sf-card-heading">
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          {actions && (
            <div className="sf-card-actions">
              {actions}
            </div>
          )}
        </header>
      )}

      <div className="sf-card-body">
        {children}
      </div>
    </section>
  );
}