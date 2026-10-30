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
  haiti: "Haiti",
  soon: "Soon",

  navServices: "Services",
  navShip: "Ship",
  navTrack: "Track",
  navMarketplace: "Marketplace",
  navQuote: "Get a quote",
  tabHome: "Home",
  tabShop: "Shop",
  tabHelp: "Help",

  heroTitle: "The reliable way to ship to Haiti.",
  heroBody:
    "Boxes, barrels, Amazon orders and freight — from Montréal and Miami to every town in Haiti. Our own trucks and warehouses, tracked at every step.",

  kpi1Value: "3",
  kpi1Label: "countries, one network",
  kpi2Value: "10/10",
  kpi2Label: "departments of Haiti, door to door",
  kpi3Value: "Air + Sea",
  kpi3Label: "two ways to ship",

  servicesTitle: "One network, three ways to move what matters.",
  svc1Title: "Boxes & barrels",
  svc1Body: "Send to family anywhere in Haiti. Drop off in Montréal or Miami, or we pick up.",
  svc2Title: "Shop & ship",
  svc2Body: "Shop on Amazon with your personal Miami or Montréal address. We bring it home to Haiti.",
  svc3Title: "Freight & sourcing",
  svc3Body: "Haitian coffee, cacao, rum, oils and art for businesses abroad — sourced and shipped by us.",
  svcCta: "Get a price",

  howTitle: "How it works",
  how1Title: "Book online",
  how1Body: "Get your price in seconds and book in a few taps.",
  how2Title: "Drop off or pickup",
  how2Body: "Bring it to our Montréal or Miami warehouse, or our truck collects it.",
  how3Title: "Scanned and shipped",
  how3Body: "Weighed, photographed and loaded on our next sailing or flight.",
  how4Title: "Delivered in Haiti",
  how4Body: "To the door anywhere in Haiti, or pickup at our warehouse — with updates on WhatsApp.",

  networkTitle: "Our network",
  networkBody:
    "Warehouses in Montréal, Miami and Haiti, linked by air and sea — then our own trucks to every department.",
  networkNext: "Paris and more destinations next.",
  legendWarehouse: "Warehouse",
  legendRoute: "Air & sea route",

  ctaTitle: "Ready when you are.",
  ctaBody: "Get an instant price for your box, barrel or package.",

  footerServices: "Services",
  footerHelp: "Help",
  footerLanguage: "Language",
  previewNotice: "Preview — bookings and payments are not live yet.",

  estimateFrom: "From",
  estimateTo: "To",
  estimateSize: "Size",
  estimateDelivery: "In Haiti",
  estimateDoor: "Delivered to the door",
  estimatePickup: "Pickup at our warehouse",
  estimateZone: "Delivery area",
  estimateTotal: "Estimated price",
  estimateSample: "Sample prices for this preview — the final price list is coming.",
  bookingSoon: "Online booking opens soon",

  sizeSmallBox: "Small box",
  sizeMediumBox: "Medium box",
  sizeLargeBox: "Large box",
  sizeBarrel: "Barrel (55 gal)",
  zoneMetro: "Port-au-Prince or Cap-Haïtien area",
  zoneCity: "Other cities and towns",
  zoneRemote: "Rural and remote areas",

  shopTitle: "Shop on Amazon, receive in Haiti",
  shopStep1: "Sign up and register your address in Haiti — you get a free personal address in Miami and Montréal.",
  shopStep2: "Shop on Amazon or any store and ship to that address.",
  shopStep3: "We bring it to Haiti. Pay by MonCash or cash at our warehouse.",
  shopAddressLabel: "Your address (example)",
  shopWeight: "Package weight (lb)",
  shopPerLb: "per lb",
  shopSignupSoon: "Sign-up opens soon",

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
  haiti: "Haïti",
  soon: "Bientôt",

  navServices: "Services",
  navShip: "Expédier",
  navTrack: "Suivre",
  navMarketplace: "Marché",
  navQuote: "Obtenir un prix",
  tabHome: "Accueil",
  tabShop: "Achats",
  tabHelp: "Aide",

  heroTitle: "La façon fiable d'expédier en Haïti.",
  heroBody:
    "Boîtes, barils, commandes Amazon et fret — de Montréal et Miami vers toutes les villes d'Haïti. Nos propres camions et entrepôts, suivis à chaque étape.",

  kpi1Value: "3",
  kpi1Label: "pays, un seul réseau",
  kpi2Value: "10/10",
  kpi2Label: "départements d'Haïti, porte à porte",
  kpi3Value: "Air + Mer",
  kpi3Label: "deux modes d'envoi",

  servicesTitle: "Un réseau, trois façons d'acheminer ce qui compte.",
  svc1Title: "Boîtes et barils",
  svc1Body: "Envoyez à votre famille partout en Haïti. Déposez à Montréal ou Miami, ou nous ramassons.",
  svc2Title: "Achats et envoi",
  svc2Body: "Achetez sur Amazon avec votre adresse personnelle à Miami ou Montréal. Nous l'apportons en Haïti.",
  svc3Title: "Fret et approvisionnement",
  svc3Body: "Café, cacao, rhum, huiles et art haïtiens pour les entreprises à l'étranger — trouvés et expédiés par nous.",
  svcCta: "Voir le prix",

  howTitle: "Comment ça marche",
  how1Title: "Réservez en ligne",
  how1Body: "Obtenez votre prix en quelques secondes et réservez en quelques gestes.",
  how2Title: "Dépôt ou ramassage",
  how2Body: "Apportez-le à notre entrepôt de Montréal ou Miami, ou notre camion vient le chercher.",
  how3Title: "Scanné et expédié",
  how3Body: "Pesé, photographié et chargé sur notre prochain départ par mer ou par air.",
  how4Title: "Livré en Haïti",
  how4Body: "À domicile partout en Haïti, ou retrait à notre entrepôt — avec des nouvelles sur WhatsApp.",

  networkTitle: "Notre réseau",
  networkBody:
    "Des entrepôts à Montréal, Miami et en Haïti, reliés par air et par mer — puis nos propres camions vers tous les départements.",
  networkNext: "Paris et d'autres destinations ensuite.",
  legendWarehouse: "Entrepôt",
  legendRoute: "Trajet air et mer",

  ctaTitle: "Prêts quand vous l'êtes.",
  ctaBody: "Obtenez un prix instantané pour votre boîte, baril ou colis.",

  footerServices: "Services",
  footerHelp: "Aide",
  footerLanguage: "Langue",
  previewNotice: "Aperçu — les réservations et paiements ne sont pas encore actifs.",

  estimateFrom: "De",
  estimateTo: "Vers",
  estimateSize: "Taille",
  estimateDelivery: "En Haïti",
  estimateDoor: "Livré à domicile",
  estimatePickup: "Retrait à notre entrepôt",
  estimateZone: "Zone de livraison",
  estimateTotal: "Prix estimé",
  estimateSample: "Prix d'exemple pour cet aperçu — la grille finale arrive bientôt.",
  bookingSoon: "Réservation en ligne bientôt",

  sizeSmallBox: "Petite boîte",
  sizeMediumBox: "Boîte moyenne",
  sizeLargeBox: "Grande boîte",
  sizeBarrel: "Baril (55 gal)",
  zoneMetro: "Région de Port-au-Prince ou du Cap-Haïtien",
  zoneCity: "Autres villes",
  zoneRemote: "Zones rurales et éloignées",

  shopTitle: "Achetez sur Amazon, recevez en Haïti",
  shopStep1:
    "Inscrivez-vous et enregistrez votre adresse en Haïti — vous recevez une adresse personnelle gratuite à Miami et Montréal.",
  shopStep2: "Achetez sur Amazon ou ailleurs et faites livrer à cette adresse.",
  shopStep3: "Nous l'apportons en Haïti. Payez par MonCash ou en espèces à notre entrepôt.",
  shopAddressLabel: "Votre adresse (exemple)",
  shopWeight: "Poids du colis (lb)",
  shopPerLb: "la livre",
  shopSignupSoon: "Inscription bientôt",

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
  haiti: "Ayiti",
  soon: "Talè",

  navServices: "Sèvis",
  navShip: "Voye",
  navTrack: "Swiv",
  navMarketplace: "Mache",
  navQuote: "Mande yon pri",
  tabHome: "Akèy",
  tabShop: "Achte",
  tabHelp: "Èd",

  heroTitle: "Fason ki serye pou voye bay Ayiti.",
  heroBody:
    "Bwat, barik, kòmann Amazon ak machandiz — soti Monreyal ak Miyami pou tout vil an Ayiti. Pwòp kamyon ak depo pa nou, swiv nan chak etap.",

  kpi1Value: "3",
  kpi1Label: "peyi, yon sèl rezo",
  kpi2Value: "10/10",
  kpi2Label: "depatman Ayiti, pòt an pòt",
  kpi3Value: "Avyon + Bato",
  kpi3Label: "de fason pou voye",

  servicesTitle: "Yon sèl rezo, twa fason pou deplase sa ki konte.",
  svc1Title: "Bwat ak barik",
  svc1Body: "Voye bay fanmi w nenpòt kote an Ayiti. Depoze l Monreyal oswa Miyami, oswa nou vin chèche l.",
  svc2Title: "Achte epi voye",
  svc2Body: "Achte sou Amazon ak adrès pèsonèl ou Miyami oswa Monreyal. Nou pote l lakay an Ayiti.",
  svc3Title: "Machandiz ak founisè",
  svc3Body: "Kafe, kakawo, wonm, lwil ak atizay ayisyen pou biznis lòt bò dlo — nou jwenn yo epi nou voye yo.",
  svcCta: "Wè pri a",

  howTitle: "Kijan sa mache",
  how1Title: "Rezève sou entènèt",
  how1Body: "Jwenn pri a nan kèk segonn epi rezève fasil.",
  how2Title: "Depoze oswa nou vin chèche",
  how2Body: "Pote l nan depo nou Monreyal oswa Miyami, oswa kamyon nou vin chèche l.",
  how3Title: "Eskane epi voye",
  how3Body: "Nou peze l, fè foto l epi chaje l nan pwochen depa bato oswa avyon.",
  how4Title: "Livre an Ayiti",
  how4Body: "Lakay moun nan nenpòt kote an Ayiti, oswa pran l nan depo nou — ak nouvèl sou WhatsApp.",

  networkTitle: "Rezo nou",
  networkBody:
    "Depo Monreyal, Miyami ak Ayiti, konekte pa avyon ak bato — epi pwòp kamyon nou rive nan tout depatman.",
  networkNext: "Pari ak lòt destinasyon apre.",
  legendWarehouse: "Depo",
  legendRoute: "Wout avyon ak bato",

  ctaTitle: "Nou pare lè w pare.",
  ctaBody: "Jwenn pri a touswit pou bwat, barik oswa koli ou.",

  footerServices: "Sèvis",
  footerHelp: "Èd",
  footerLanguage: "Lang",
  previewNotice: "Apèsi — rezèvasyon ak peman poko aktif.",

  estimateFrom: "Soti",
  estimateTo: "Pou",
  estimateSize: "Gwosè",
  estimateDelivery: "An Ayiti",
  estimateDoor: "Livre lakay",
  estimatePickup: "Pran l nan depo nou",
  estimateZone: "Zòn livrezon",
  estimateTotal: "Pri estime",
  estimateSample: "Pri egzanp pou apèsi sa a — lis pri final la ap vini.",
  bookingSoon: "Rezèvasyon an liy ap louvri talè",

  sizeSmallBox: "Ti bwat",
  sizeMediumBox: "Bwat mwayen",
  sizeLargeBox: "Gwo bwat",
  sizeBarrel: "Barik (55 galon)",
  zoneMetro: "Zòn Pòtoprens oswa Okap",
  zoneCity: "Lòt vil",
  zoneRemote: "Zòn andeyò ak zòn ki lwen",

  shopTitle: "Achte sou Amazon, resevwa an Ayiti",
  shopStep1: "Enskri epi anrejistre adrès ou an Ayiti — w ap jwenn yon adrès pèsonèl gratis Miyami ak Monreyal.",
  shopStep2: "Achte sou Amazon oswa nenpòt magazen epi fè yo voye l nan adrès sa a.",
  shopStep3: "Nou pote l an Ayiti. Peye ak MonCash oswa kach nan depo nou.",
  shopAddressLabel: "Adrès ou (egzanp)",
  shopWeight: "Pwa koli a (liv)",
  shopPerLb: "pa liv",
  shopSignupSoon: "Enskripsyon ap louvri talè",

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
