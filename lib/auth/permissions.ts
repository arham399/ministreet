import type { Role } from "@prisma/client";

const permissions: Record<string, Role[]> = {
  "products:read": ["OWNER", "ADMIN", "INVENTORY_MANAGER", "ORDER_MANAGER", "SUPPORT"],
  "products:write": ["OWNER", "ADMIN", "INVENTORY_MANAGER"],
  "orders:read": ["OWNER", "ADMIN", "ORDER_MANAGER", "SUPPORT"],
  "orders:write": ["OWNER", "ADMIN", "ORDER_MANAGER"],
  "customers:read": ["OWNER", "ADMIN", "ORDER_MANAGER", "SUPPORT"],
  "analytics:read": ["OWNER", "ADMIN"],
  "settings:write": ["OWNER", "ADMIN"],
  "users:write": ["OWNER"],
  "reviews:moderate": ["OWNER", "ADMIN", "SUPPORT"],
  "discounts:write": ["OWNER", "ADMIN"],
};

export function can(role: Role | undefined | null, action: string): boolean {
  if (!role) return false;
  if (role === "OWNER") return true;
  return permissions[action]?.includes(role) ?? false;
}
