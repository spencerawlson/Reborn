/**
 * Roles + authorization guards (framework-free).
 *
 * A session is { userId, roles }. Real session issuance (login, MFA,
 * cookies) wires up in Phase 2 with the database; these guards are the
 * rules every route and query must obey from day one.
 *
 * Tenant isolation rule: a producer-scoped query MUST include
 * producer_id = the caller's producer profile id. Admin queries are the
 * only exception, and admin-only routes must call requireRole('admin').
 */

export type Role = "admin" | "producer" | "customer";

export interface Session {
  userId: string;
  roles: Role[];
  producerProfileId?: string;
}

export function hasRole(session: Session | null, role: Role): boolean {
  return session?.roles.includes(role) ?? false;
}

/** Throws when the session lacks the role. Use at the top of protected routes. */
export function requireRole(session: Session | null, role: Role): Session {
  if (!session || !hasRole(session, role)) {
    throw new Error(`forbidden: requires role ${role}`);
  }
  return session;
}

/**
 * The producer filter for a query. Returns the producer id a producer
 * caller may see, or null when the caller is an admin (unfiltered).
 * Throws for anyone who is neither.
 */
export function producerScope(session: Session | null): string | null {
  if (hasRole(session, "admin")) return null;
  if (hasRole(session, "producer") && session?.producerProfileId) {
    return session.producerProfileId;
  }
  throw new Error("forbidden: producer scope requires a producer session");
}

/** Sensitive financial actions additionally require MFA on the session. */
export interface FinancialSession extends Session {
  mfaVerified: boolean;
}

export function requireFinancialAuth(session: FinancialSession | null): FinancialSession {
  const base = requireRole(session, "admin");
  if (!session?.mfaVerified) {
    throw new Error("forbidden: sensitive financial actions require MFA");
  }
  return { ...base, mfaVerified: true };
}
