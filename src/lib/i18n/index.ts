/**
 * Multilingual dictionaries (EN / FR / HT).
 * Creole copy here is a first draft — it needs native review before launch.
 * Keys are shared across locales; missing keys fall back to English.
 */

export type Locale = "en" | "fr" | "ht";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ht", label: "Kreyòl" },
];

const en = {
  siteName: "Haitian Producer Marketplace",
  siteTagline: "Haitian products for the world",
  navHome: "Home",
  navShops: "Shops",
  navAdmin: "Admin",
  navProducer: "Producer",
  adminTitle: "Administrator dashboard",
  adminSubtitle: "The whole business, in one place",
  statTotalSales: "Total sales",
  statCommission: "Commission revenue",
  statProducerOwed: "Owed to producers",
  statPendingWithdrawals: "Pending withdrawals",
  statActiveOrders: "Active orders",
  statProducers: "Producers",
  statRefunds: "Refunds and disputes",
  balancePending: "Pending",
  balanceAvailable: "Available",
  balancePaid: "Paid",
  mockNotice: "Demo data — connected to real figures in a later phase.",
};

export type Dictionary = typeof en;

const fr: Dictionary = {
  siteName: "Marché des producteurs haïtiens",
  siteTagline: "Des produits haïtiens pour le monde",
  navHome: "Accueil",
  navShops: "Boutiques",
  navAdmin: "Admin",
  navProducer: "Producteur",
  adminTitle: "Tableau de bord administrateur",
  adminSubtitle: "Toute l'entreprise, en un seul endroit",
  statTotalSales: "Ventes totales",
  statCommission: "Revenus de commission",
  statProducerOwed: "Dû aux producteurs",
  statPendingWithdrawals: "Retraits en attente",
  statActiveOrders: "Commandes actives",
  statProducers: "Producteurs",
  statRefunds: "Remboursements et litiges",
  balancePending: "En attente",
  balanceAvailable: "Disponible",
  balancePaid: "Payé",
  mockNotice: "Données de démonstration — chiffres réels dans une phase ultérieure.",
};

const ht: Dictionary = {
  siteName: "Mache Pwodiktè Ayisyen",
  siteTagline: "Pwodwi Ayiti pou tout mond lan",
  navHome: "Kay",
  navShops: "Boutik",
  navAdmin: "Admin",
  navProducer: "Pwodiktè",
  adminTitle: "Tablo kontwòl administratè",
  adminSubtitle: "Tout biznis la, nan yon sèl kote",
  statTotalSales: "Vant total",
  statCommission: "Revni komisyon",
  statProducerOwed: "Dwe pwodiktè yo",
  statPendingWithdrawals: "Retrè k ap tann",
  statActiveOrders: "Kòmann aktif",
  statProducers: "Pwodiktè",
  statRefunds: "Ranbousman ak diskisyon",
  balancePending: "Ap tann",
  balanceAvailable: "Disponib",
  balancePaid: "Peye",
  mockNotice: "Done demonstrasyon — chif reyèl nan yon faz pita.",
};

const dictionaries: Record<Locale, Dictionary> = { en, fr, ht };

export function t(locale: Locale, key: keyof Dictionary): string {
  return dictionaries[locale][key] ?? en[key];
}

export function resolveLocale(input: string | null | undefined): Locale {
  if (input === "fr" || input === "ht") return input;
  return "en";
}
