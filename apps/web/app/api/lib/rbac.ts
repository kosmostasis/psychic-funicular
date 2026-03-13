/**
 * RBAC stub per Scope: viewer / operator / admin.
 * In M2 we use header or default role; later replace with real auth.
 */
export type Role = "viewer" | "operator" | "admin";

export function getRoleFromRequest(request: Request): Role {
  const role = request.headers.get("x-cdp-role") as Role | null;
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator"; // default for local dev
}

export function canEditTriage(role: Role): boolean {
  return role === "operator" || role === "admin";
}

export function canManageConnectors(role: Role): boolean {
  return role === "admin";
}
