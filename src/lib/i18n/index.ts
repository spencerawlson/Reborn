/**
 * Multilingual dictionaries (EN / FR / HT).
 * Creole and French copy here is a first draft — it needs native review
 * before launch. Every locale must define every key (enforced by the
 * Dictionary type).
 */

export type Locale = "en" | "fr" | "ht";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ht", label: "Kreyòl" },
];

const en = {
  siteName: "ShipItAyiti",
  siteTagline: "Haiti and the world, door to door",
  navShip: "Ship",
  navTrack: "Track",
  navMarketplace: "Marketplace",
  soon: "Soon",
  haiti: "Haiti",

  heroTitle: "Ship to Haiti",
  heroBody: "Boxes, barrels, and your Amazon orders — delivered anywhere in Haiti.",
  tabShop: "Shop",
  shopTitle: "Shop on Amazon, receive in Haiti",
  shopStep1: "Get your free personal address in Miami or Montréal.",
  shopStep2: "Shop on Amazon or any store and ship to that address.",
  shopStep3: "We bring it to Haiti. Pay by MonCash or cash at our warehouse.",
  shopAddressLabel: "Your address (example)",
  shopWeight: "Package weight (lb)",
  shopPerLb: "per lb",
  shopSignupSoon: "Sign-up opens soon",
  heroCheck1: "Door to door, or pickup at our warehouse",
  heroCheck3: "WhatsApp updates in Creole for your family",
  tabHome: "Home",
  tabHelp: "Help",
  bookingSoon: "Online booking opens soon",

  estimateTitle: "Estimate your price",
  estimateFrom: "From",
  estimateTo: "To",
  estimateSize: "Size",
  estimateDelivery: "In Haiti",
  estimateDoor: "Delivered to the door",
  estimatePickup: "Pickup at our warehouse",
  estimateZone: "Delivery area",
  estimateTotal: "Estimated price",
  estimateSample: "Sample prices for this preview — the final price list is coming.",

  sizeSmallBox: "Small box",
  sizeMediumBox: "Medium box",
  sizeLargeBox: "Large box",
  sizeBarrel: "Barrel (55 gal)",
  zoneMetro: "Port-au-Prince or Cap-Haïtien area",
  zoneCity: "Other cities and towns",
  zoneRemote: "Rural and remote areas",

  howTitle: "How it works",
  step1Title: "Drop it off, or we pick it up",
  step1Body:
    "Bring your box or barrel to our Montréal or Miami warehouse, or book a truck to collect it.",
  step2Title: "We ship it",
  step2Body:
    "By sea or by air, in our own consolidated loads. Every item is weighed, photographed, and scanned.",
  step3Title: "Delivered in Haiti",
  step3Body:
    "To the door anywhere in Haiti, or ready at our Port-au-Prince or Cap-Haïtien warehouse. Your recipient gets updates in Creole.",


  trust1Title: "Our own trucks and warehouses",

  teaserTitle: "Coming next: Haitian goods to the world",
  teaserBody:
    "Coffee, cacao, rum, essential oils, art, and more from verified Haitian suppliers — sourced on our marketplace and shipped by us.",

  previewNotice: "Preview — bookings and payments are not live yet.",

  trackTitle: "Track a shipment",
  trackLabel: "Tracking number",
  trackButton: "Track",
  trackSample: "Preview with a sample shipment — live tracking arrives with bookings.",
  trackRecipient: "Recipient",
  trackRoute: "Route",
  trackStatusBooked: "Booked",
  trackStatusReceived: "Received at our Montréal warehouse",
  trackStatusDeparted: "Departed by sea",
  trackStatusArrived: "Arrived in Port-au-Prince",
  trackStatusCustoms: "Cleared customs",
  trackStatusOut: "Out for delivery",
  trackStatusDelivered: "Delivered",

  adminTitle: "Administrator dashboard",
  adminSubtitle: "The whole business, in one place",
  statTotalSales: "Total sales",
  statCommission: "Commission revenue",
  statProducerOwed: "Owed to producers",
  statPendingWithdrawals: "Pending withdrawals",
  statActiveOrders: "Active orders",
  statProducers: "Producers",
  statRefunds: "Refunds and disputes",
  mockNotice: "Demo data — connected to real figures in a later phase.",
};

export type Dictionary = typeof en;
export type DictionaryKey = keyof Dictionary;

const fr: Dictionary = {
  siteName: "ShipItAyiti",
  siteTagline: "Haïti et le monde, porte à porte",
  navShip: "Expédier",
  navTrack: "Suivre",
  navMarketplace: "Marché",
  soon: "Bientôt",
  haiti: "Haïti",

  heroTitle: "Expédiez en Haïti",
  heroBody: "Boîtes, barils et vos commandes Amazon — livrés partout en Haïti.",
  tabShop: "Achats",
  shopTitle: "Achetez sur Amazon, recevez en Haïti",
  shopStep1: "Obtenez votre adresse personnelle gratuite à Miami ou Montréal.",
  shopStep2: "Achetez sur Amazon ou ailleurs et faites livrer à cette adresse.",
  shopStep3: "Nous l'apportons en Haïti. Payez par MonCash ou en espèces à notre entrepôt.",
  shopAddressLabel: "Votre adresse (exemple)",
  shopWeight: "Poids du colis (lb)",
  shopPerLb: "la livre",
  shopSignupSoon: "Inscription bientôt",
  heroCheck1: "À domicile, ou retrait à notre entrepôt",
  heroCheck3: "Nouvelles par WhatsApp en créole pour votre famille",
  tabHome: "Accueil",
  tabHelp: "Aide",
  bookingSoon: "Réservation en ligne bientôt",

  estimateTitle: "Estimez votre prix",
  estimateFrom: "De",
  estimateTo: "Vers",
  estimateSize: "Taille",
  estimateDelivery: "En Haïti",
  estimateDoor: "Livré à domicile",
  estimatePickup: "Retrait à notre entrepôt",
  estimateZone: "Zone de livraison",
  estimateTotal: "Prix estimé",
  estimateSample: "Prix d'exemple pour cet aperçu — la grille finale arrive bientôt.",

  sizeSmallBox: "Petite boîte",
  sizeMediumBox: "Boîte moyenne",
  sizeLargeBox: "Grande boîte",
  sizeBarrel: "Baril (55 gal)",
  zoneMetro: "Région de Port-au-Prince ou du Cap-Haïtien",
  zoneCity: "Autres villes",
  zoneRemote: "Zones rurales et éloignées",

  howTitle: "Comment ça marche",
  step1Title: "Déposez-le, ou nous venons le chercher",
  step1Body:
    "Apportez votre boîte ou baril à notre entrepôt de Montréal ou de Miami, ou réservez un ramassage par camion.",
  step2Title: "Nous l'expédions",
  step2Body:
    "Par mer ou par avion, dans nos propres chargements groupés. Chaque article est pesé, photographié et scanné.",
  step3Title: "Livré en Haïti",
  step3Body:
    "À domicile partout en Haïti, ou prêt à notre entrepôt de Port-au-Prince ou du Cap-Haïtien. Votre destinataire reçoit des nouvelles en créole.",


  trust1Title: "Nos propres camions et entrepôts",

  teaserTitle: "Bientôt : les produits haïtiens pour le monde",
  teaserBody:
    "Café, cacao, rhum, huiles essentielles, art et plus, de fournisseurs haïtiens vérifiés — trouvés sur notre marché et expédiés par nous.",

  previewNotice: "Aperçu — les réservations et paiements ne sont pas encore actifs.",

  trackTitle: "Suivre un envoi",
  trackLabel: "Numéro de suivi",
  trackButton: "Suivre",
  trackSample: "Aperçu avec un envoi d'exemple — le suivi réel arrive avec les réservations.",
  trackRecipient: "Destinataire",
  trackRoute: "Trajet",
  trackStatusBooked: "Réservé",
  trackStatusReceived: "Reçu à notre entrepôt de Montréal",
  trackStatusDeparted: "Parti par mer",
  trackStatusArrived: "Arrivé à Port-au-Prince",
  trackStatusCustoms: "Dédouané",
  trackStatusOut: "En cours de livraison",
  trackStatusDelivered: "Livré",

  adminTitle: "Tableau de bord administrateur",
  adminSubtitle: "Toute l'entreprise, en un seul endroit",
  statTotalSales: "Ventes totales",
  statCommission: "Revenus de commission",
  statProducerOwed: "Dû aux producteurs",
  statPendingWithdrawals: "Retraits en attente",
  statActiveOrders: "Commandes actives",
  statProducers: "Producteurs",
  statRefunds: "Remboursements et litiges",
  mockNotice: "Données de démonstration — chiffres réels dans une phase ultérieure.",
};

const ht: Dictionary = {
  siteName: "ShipItAyiti",
  siteTagline: "Ayiti ak tout mond lan, pòt an pòt",
  navShip: "Voye",
  navTrack: "Swiv",
  navMarketplace: "Mache",
  soon: "Talè",
  haiti: "Ayiti",

  heroTitle: "Voye bay Ayiti",
  heroBody: "Bwat, barik ak kòmann Amazon ou — livre nenpòt kote an Ayiti.",
  tabShop: "Achte",
  shopTitle: "Achte sou Amazon, resevwa an Ayiti",
  shopStep1: "Pran adrès pèsonèl ou gratis Miyami oswa Monreyal.",
  shopStep2: "Achte sou Amazon oswa nenpòt magazen epi fè yo voye l nan adrès sa a.",
  shopStep3: "Nou pote l an Ayiti. Peye ak MonCash oswa kach nan depo nou.",
  shopAddressLabel: "Adrès ou (egzanp)",
  shopWeight: "Pwa koli a (liv)",
  shopPerLb: "pa liv",
  shopSignupSoon: "Enskripsyon ap louvri talè",
  heroCheck1: "Lakay moun nan, oswa pran l nan depo nou",
  heroCheck3: "Nouvèl sou WhatsApp an kreyòl pou fanmi w",
  tabHome: "Akèy",
  tabHelp: "Èd",
  bookingSoon: "Rezèvasyon an liy ap louvri talè",

  estimateTitle: "Kalkile pri a",
  estimateFrom: "Soti",
  estimateTo: "Pou",
  estimateSize: "Gwosè",
  estimateDelivery: "An Ayiti",
  estimateDoor: "Livre lakay",
  estimatePickup: "Pran l nan depo nou",
  estimateZone: "Zòn livrezon",
  estimateTotal: "Pri estime",
  estimateSample: "Pri egzanp pou apèsi sa a — lis pri final la ap vini.",

  sizeSmallBox: "Ti bwat",
  sizeMediumBox: "Bwat mwayen",
  sizeLargeBox: "Gwo bwat",
  sizeBarrel: "Barik (55 galon)",
  zoneMetro: "Zòn Pòtoprens oswa Okap",
  zoneCity: "Lòt vil",
  zoneRemote: "Zòn andeyò ak zòn ki lwen",

  howTitle: "Kijan sa mache",
  step1Title: "Depoze l, oswa nou vin chèche l",
  step1Body:
    "Pote bwat oswa barik ou nan depo nou Monreyal oswa Miyami, oswa mande yon kamyon vin chèche l.",
  step2Title: "Nou voye l",
  step2Body:
    "Pa bato oswa pa avyon, nan pwòp chajman pa nou. Nou peze, foto ak eskane chak atik.",
  step3Title: "Livre an Ayiti",
  step3Body:
    "Lakay moun nan nenpòt kote an Ayiti, oswa pare nan depo nou Pòtoprens oswa Okap. Moun k ap resevwa a jwenn nouvèl an kreyòl.",


  trust1Title: "Pwòp kamyon ak depo pa nou",

  teaserTitle: "Talè konsa: pwodwi ayisyen pou tout mond lan",
  teaserBody:
    "Kafe, kakawo, wonm, lwil esansyèl, atizay ak plis ankò, soti nan founisè ayisyen verifye — jwenn yo sou mache nou epi se nou ki voye yo.",

  previewNotice: "Apèsi — rezèvasyon ak peman poko aktif.",

  trackTitle: "Swiv yon anvwa",
  trackLabel: "Nimewo swivi",
  trackButton: "Swiv",
  trackSample: "Apèsi ak yon anvwa egzanp — swivi reyèl la ap vini ak rezèvasyon yo.",
  trackRecipient: "Moun k ap resevwa",
  trackRoute: "Wout",
  trackStatusBooked: "Rezève",
  trackStatusReceived: "Resevwa nan depo nou Monreyal",
  trackStatusDeparted: "Pati pa bato",
  trackStatusArrived: "Rive Pòtoprens",
  trackStatusCustoms: "Pase ladwàn",
  trackStatusOut: "Sou wout pou livre",
  trackStatusDelivered: "Livre",

  adminTitle: "Tablo kontwòl administratè",
  adminSubtitle: "Tout biznis la, nan yon sèl kote",
  statTotalSales: "Vant total",
  statCommission: "Revni komisyon",
  statProducerOwed: "Dwe pwodiktè yo",
  statPendingWithdrawals: "Retrè k ap tann",
  statActiveOrders: "Kòmann aktif",
  statProducers: "Pwodiktè",
  statRefunds: "Ranbousman ak diskisyon",
  mockNotice: "Done demonstrasyon — chif reyèl nan yon faz pita.",
};

const dictionaries: Record<Locale, Dictionary> = { en, fr, ht };

export function t(locale: Locale, key: DictionaryKey): string {
  return dictionaries[locale][key];
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr" || value === "ht";
}

export function resolveLocale(input: string | null | undefined): Locale {
  return isLocale(input) ? input : "en";
}

/**
 * Pick a locale for a first visit: a saved choice (cookie) wins, then the
 * browser's Accept-Language (first supported tag in order), then English.
 */
export function detectLocale(acceptLanguage: string | null, saved: string | null | undefined): Locale {
  if (isLocale(saved)) return saved;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(tag)) return tag;
  }
  return "en";
}
