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
  navShipping: "Ship to Haiti",
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
  producerCardBody:
    "Boxes and barrels from Montréal and Miami to anywhere in Haiti — door to door or warehouse pickup. Coming in Phase 2.",
  foundationNotice:
    "Foundation build (Phase 1). Payments, bank transfers, and MonCash payouts are mock only until banking partners and legal advisers confirm the structure is permitted.",
};

export type Dictionary = typeof en;

const fr: Dictionary = {
  siteName: "Marché des producteurs haïtiens",
  siteTagline: "Des produits haïtiens pour le monde",
  navHome: "Accueil",
  navShops: "Boutiques",
  navAdmin: "Admin",
  navProducer: "Producteur",
  navShipping: "Expédier en Haïti",
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
  producerCardBody:
    "Boîtes et barils de Montréal et Miami partout en Haïti — livraison à domicile ou retrait en entrepôt. En phase 2.",
  foundationNotice:
    "Version de base (phase 1). Les paiements, virements bancaires et versements MonCash sont simulés jusqu'à ce que nos partenaires bancaires et conseillers juridiques confirment que la structure est autorisée.",
};

const ht: Dictionary = {
  siteName: "Mache Pwodiktè Ayisyen",
  siteTagline: "Pwodwi Ayiti pou tout mond lan",
  navHome: "Kay",
  navShops: "Boutik",
  navAdmin: "Admin",
  navProducer: "Pwodiktè",
  navShipping: "Voye bay Ayiti",
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
  producerCardBody:
    "Bwat ak barik soti Monreyal ak Miyami pou tout kote an Ayiti — livrezon lakay oswa pran nan depo. Ap vini nan faz 2.",
  foundationNotice:
    "Vèsyon fondasyon (faz 1). Peman, transfè labank ak peman MonCash yo se similasyon sèlman jiskaske patnè labank ak konseye jiridik yo konfime estrikti a pèmèt.",
};

const dictionaries: Record<Locale, Dictionary> = { en, fr, ht };

export function t(locale: Locale, key: keyof Dictionary): string {
  return dictionaries[locale][key] ?? en[key];
}

export function resolveLocale(input: string | null | undefined): Locale {
  if (input === "fr" || input === "ht") return input;
  return "en";
}
