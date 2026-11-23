export interface UserDisplay {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/** Up to two initials from the name, falling back to the email handle. */
export function initialsFor(user: UserDisplay): string {
  const source = user.name?.trim() || user.email?.split("@")[0] || "N";
  const letters = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "N";
}
