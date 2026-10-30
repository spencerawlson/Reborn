/**
 * Haiti's 10 departments (ISO 3166-2:HT codes): capital and nearest
 * company warehouse. Plain module (not "use client") so the server page
 * can validate ?dept= and the client map can render details.
 *
 * Nearest warehouse = straight-line distance from the department capital
 * to Port-au-Prince or Cap-Haïtien (geography, not a routing promise).
 */
export const DEPARTMENTS: Record<string, { capital: string; nearest: "PAP" | "CAP" }> = {
  "HT-NO": { capital: "Port-de-Paix", nearest: "CAP" },
  "HT-ND": { capital: "Cap-Haïtien", nearest: "CAP" },
  "HT-NE": { capital: "Fort-Liberté", nearest: "CAP" },
  "HT-AR": { capital: "Gonaïves", nearest: "CAP" },
  "HT-CE": { capital: "Hinche", nearest: "CAP" },
  "HT-OU": { capital: "Port-au-Prince", nearest: "PAP" },
  "HT-GA": { capital: "Jérémie", nearest: "PAP" },
  "HT-NI": { capital: "Miragoâne", nearest: "PAP" },
  "HT-SD": { capital: "Les Cayes", nearest: "PAP" },
  "HT-SE": { capital: "Jacmel", nearest: "PAP" },
};

export const WAREHOUSE_NAME = { PAP: "Port-au-Prince", CAP: "Cap-Haïtien" } as const;

export function isDepartmentCode(value: string | undefined): value is string {
  return value !== undefined && Object.hasOwn(DEPARTMENTS, value);
}
