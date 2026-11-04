export function isRestricted(user) {
  return (
    user?.role === "dispatcher" &&
    user?.permissions &&
    Array.isArray(user.permissions.modules)
  );
}

export function canAccessPage(user, page) {
  if (page === "users") {
    return user?.role === "admin" || user?.role === "super_admin";
  }

  if (page === "settings" || !isRestricted(user)) {
    return true;
  }

  return user.permissions.modules.includes(page);
}

export function firstAllowedPage(user, pages) {
  return pages.find((page) => canAccessPage(user, page)) || "settings";
}