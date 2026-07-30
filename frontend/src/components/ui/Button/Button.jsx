import "./button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled = false,
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
      type={type}
      className={classes}
      disabled={disabled || loading}
    >
      {loading && (
        <span
          className="sf-button-spinner"
          aria-hidden="true"
        />
      )}

      <span>{children}</span>
    </button>
  );
}