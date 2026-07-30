import "./avatar.css";

export default function Avatar({
  name = "",
  image = "",
  size = "md",
  className = "",
}) {
  const classes = [
    "sf-avatar",
    `sf-avatar-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (image) {
    return (
      <img
        className={classes}
        src={image}
        alt={name || "Kullanıcı avatarı"}
      />
    );
  }

  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div
      className={classes}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}