import "./button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  type = "button",
  ...props
}) {
  const classes = [
    "sf-button",
    `sf-button-${variant}`,
    `sf-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <span className="sf-button-spinner" />
      )}

      <span>{children}</span>
    </button>
  );
}