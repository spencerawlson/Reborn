/**
 * Prohibited items — our first check on what customers declare.
 *
 * Compiled October 30, 2026 from the references listed per category.
 * Haiti's customs administration (AGD) does not publish a current
 * consolidated list online (the official list reportedly dates from 1962),
 * so this combines the UN arms embargo, US export and hazmat rules,
 * dangerous-goods rules for air and sea, and Haitian import rules as
 * summarised by the US government. It is NOT exhaustive: every package is
 * inspected, and customs has the final word. To be confirmed by the
 * company's licensed customs broker.
 *
 * Matching is keyword-based on the customer's description (EN/FR/HT),
 * accent- and case-insensitive, on whole words. Keywords are chosen to
 * avoid everyday false alarms (e.g. "ink cartridge", "chia seeds",
 * "money clip", "bug spray") — see tests/prohibited.test.ts.
 */
import type { Locale } from "../i18n/index";

type L = Record<Locale, string>;

export interface Reference {
  label: string;
  url: string;
}

export interface ProhibitedCategory {
  id: string;
  title: L;
  reason: L;
  examples: L;
  keywords: string[];
  references: Reference[];
}

export const LIST_REVIEWED = "2026-10-30";

const REF = {
  unEmbargo: { label: "UN Security Council, resolution 2752 (2024) — Haiti arms embargo (all arms and related materiel)", url: "https://news.un.org/en/story/2024/10/1155901" },
  unRenewal: { label: "Renewal: resolution 2794 (2025) — ASIL summary", url: "https://www.asil.org/ILIB/un-extends-haiti-arms-embargo-amid-ongoing-gang-violence" },
  tradeGov: { label: "U.S. International Trade Administration — Haiti: Prohibited and Restricted Items", url: "https://trade.gov/country-commercial-guides/haiti-prohibited-and-restricted-items" },
  usda: { label: "USDA FAS — Haiti Food and Agricultural Import Regulations and Standards (FAIRS) report", url: "https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=FAIRS+Annual+Country+Report+Annual_Port-au-Prince_Haiti_HA2022-0001" },
  usps: { label: "USPS International Mail Manual — Country Conditions for Mailing: Haiti", url: "https://pe.usps.com/IMM_Archive/NHTML/IMM_Archive_20240121/fh_022.htm" },
  iata: { label: "IATA Dangerous Goods Regulations (air cargo)", url: "https://www.iata.org/en/programs/cargo/dgr/" },
  hazmat: { label: "U.S. Hazardous Materials Regulations, 49 CFR Subchapter C", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-I/subchapter-C" },
};

export const PROHIBITED: ProhibitedCategory[] = [
  {
    id: "weapons",
    title: { en: "Firearms, ammunition and weapons", fr: "Armes à feu, munitions et armes", ht: "Zam afe, minisyon ak zam" },
    reason: {
      en: "Haiti is under a UN arms embargo covering arms and related materiel of all types, and the U.S. denies firearm exports to Haiti.",
      fr: "Haïti est sous embargo de l'ONU sur les armes et le matériel connexe de tous types, et les États-Unis refusent les exportations d'armes à feu vers Haïti.",
      ht: "Ayiti anba yon anbago ONI sou tout kalite zam ak materyèl ki mache avè yo, epi Etazini refize ekspòtasyon zam afe pou Ayiti.",
    },
    examples: {
      en: "Guns, pistols, rifles, ammunition, gun parts, silencers, tasers, BB and air guns",
      fr: "Fusils, pistolets, carabines, munitions, pièces d'armes, silencieux, tasers, armes à air",
      ht: "Zam, pistolè, fizi, minisyon, pyès zam, silansye, tazè, zam a lè",
    },
    keywords: [
      "gun", "guns", "firearm", "firearms", "pistol", "pistols", "rifle", "rifles", "shotgun", "revolver", "handgun",
      "ammunition", "ammo", "bullet", "bullets", "gun magazine", "gun parts", "silencer", "suppressor", "rifle scope",
      "taser", "stun gun", "bb gun", "air gun", "airsoft", "pellet gun", "grenade",
      "arme a feu", "armes a feu", "pistolet", "fusil", "carabine", "munition", "munitions", "silencieux",
      "zam", "zam afe", "pistole", "fizi", "minisyon",
    ],
    references: [REF.unEmbargo, REF.unRenewal, REF.tradeGov],
  },
  {
    id: "explosives",
    title: { en: "Explosives and fireworks", fr: "Explosifs et feux d'artifice", ht: "Eksplozif ak petar" },
    reason: {
      en: "Explosives are dangerous goods and are banned from import into Haiti.",
      fr: "Les explosifs sont des marchandises dangereuses et leur importation en Haïti est interdite.",
      ht: "Eksplozif se machandiz danjere, epi yo entèdi antre yo Ayiti.",
    },
    examples: {
      en: "Fireworks, firecrackers, gunpowder, dynamite, detonators, flares",
      fr: "Feux d'artifice, pétards, poudre à canon, dynamite, détonateurs, fusées éclairantes",
      ht: "Petar, fedatifis, poud kanon, dinamit, detonatè",
    },
    keywords: [
      "explosive", "explosives", "dynamite", "fireworks", "firework", "firecracker", "firecrackers", "gunpowder",
      "detonator", "detonators", "blasting cap", "road flare",
      "explosif", "explosifs", "feux d'artifice", "feu d'artifice", "petard", "petards", "poudre a canon",
      "eksplozif", "petar", "fedatifis", "dinamit",
    ],
    references: [REF.tradeGov, REF.iata, REF.hazmat],
  },
  {
    id: "drugs",
    title: { en: "Drugs and narcotics", fr: "Drogues et stupéfiants", ht: "Dwòg" },
    reason: {
      en: "Narcotics and illegal drugs are prohibited imports in Haiti.",
      fr: "Les stupéfiants et drogues illégales sont interdits à l'importation en Haïti.",
      ht: "Dwòg ak sibstans ilegal entèdi pou antre Ayiti.",
    },
    examples: {
      en: "Cannabis, cocaine, heroin, methamphetamine, fentanyl",
      fr: "Cannabis, cocaïne, héroïne, méthamphétamine, fentanyl",
      ht: "Mariwana, kokayin, ewoyin, fentanil",
    },
    keywords: [
      "cocaine", "heroin", "marijuana", "marihuana", "cannabis", "methamphetamine", "meth", "fentanyl", "opium", "narcotics",
      "drogue", "drogues", "stupefiant", "stupefiants", "heroine",
      "dwog", "mariwana", "kokayin", "ewoyin",
    ],
    references: [REF.tradeGov],
  },
  {
    id: "counterfeit",
    title: { en: "Counterfeit goods and fake money", fr: "Contrefaçons et faux billets", ht: "Machandiz kontrefè ak fo lajan" },
    reason: {
      en: "Counterfeit goods and counterfeit currency are prohibited imports in Haiti.",
      fr: "Les contrefaçons et la fausse monnaie sont interdites à l'importation en Haïti.",
      ht: "Machandiz kontrefè ak fo lajan entèdi pou antre Ayiti.",
    },
    examples: {
      en: "Fake designer goods, counterfeit banknotes, equipment to make counterfeit money",
      fr: "Faux articles de marque, faux billets, matériel de contrefaçon de monnaie",
      ht: "Fo machandiz mak, fo biyè, materyèl pou fè fo lajan",
    },
    keywords: [
      "counterfeit", "fake money", "fake banknotes", "prop money",
      "contrefacon", "contrefacons", "faux billets", "fausse monnaie",
      "fo lajan", "fo biye", "kontrefe",
    ],
    references: [REF.tradeGov],
  },
  {
    id: "obscene",
    title: { en: "Pornography", fr: "Pornographie", ht: "Pònografi" },
    reason: {
      en: "Pornographic material is a prohibited import in Haiti.",
      fr: "Le matériel pornographique est interdit à l'importation en Haïti.",
      ht: "Materyèl pònografik entèdi pou antre Ayiti.",
    },
    examples: { en: "Pornographic magazines, films or images", fr: "Revues, films ou images pornographiques", ht: "Revi, fim oswa imaj pònografik" },
    keywords: ["pornography", "pornographic", "porn", "pornographie", "pornographique", "ponografi"],
    references: [REF.tradeGov, REF.usps],
  },
  {
    id: "hazardous",
    title: { en: "Fuels, gas cylinders and corrosive chemicals", fr: "Carburants, bouteilles de gaz et produits corrosifs", ht: "Gaz, bonbòn gaz ak pwodwi chimik ki boule" },
    reason: {
      en: "These are hazardous materials (dangerous goods) that cannot travel in our consolidated air or sea loads.",
      fr: "Ce sont des matières dangereuses qui ne peuvent pas voyager dans nos chargements groupés par air ou par mer.",
      ht: "Se materyèl danjere ki pa ka vwayaje nan chajman avyon oswa bato nou yo.",
    },
    examples: {
      en: "Gasoline, diesel, kerosene, propane or butane tanks, gas cylinders, lighter fluid, battery acid",
      fr: "Essence, diesel, kérosène, bonbonnes de propane ou butane, bouteilles de gaz, essence à briquet, acide de batterie",
      ht: "Gazolin, dyezèl, kewozin, bonbòn pwopàn oswa butàn, gaz brikè, asid batri",
    },
    keywords: [
      "gasoline", "petrol", "diesel fuel", "kerosene", "propane", "butane", "gas cylinder", "gas tank", "oxygen tank",
      "lighter fluid", "paint thinner", "battery acid", "sulfuric acid", "muriatic acid", "hydrochloric acid",
      "bidon d'essence", "bonbonne de gaz", "bouteille de gaz", "acide sulfurique",
      "gazolin", "kewozin", "bonbon gaz", "gaz pwopan",
    ],
    references: [REF.iata, REF.hazmat],
  },
  {
    id: "live",
    title: { en: "Live animals, live plants and fresh meat", fr: "Animaux vivants, plantes vivantes et viande fraîche", ht: "Bèt vivan, plant vivan ak vyann fre" },
    reason: {
      en: "Animals, plants and fresh animal products need Haitian quarantine import permits and health or plant certificates, which personal shipments don't have.",
      fr: "Les animaux, plantes et produits animaux frais exigent des permis d'importation de la quarantaine haïtienne et des certificats sanitaires ou phytosanitaires.",
      ht: "Bèt, plant ak pwodwi bèt fre bezwen pèmi karantèn Ayiti ak sètifika sante oswa fitosanitè.",
    },
    examples: { en: "Pets, birds, live plants, soil, fresh or raw meat and fish", fr: "Animaux de compagnie, oiseaux, plantes vivantes, terre, viande ou poisson cru", ht: "Bèt kay, zwazo, plant vivan, tè, vyann oswa pwason kri" },
    keywords: [
      "live animal", "live animals", "puppy", "kitten", "parrot", "macaw", "live bird", "live plant", "live plants",
      "potting soil", "raw meat", "fresh meat", "fresh fish", "raw chicken",
      "animal vivant", "animaux vivants", "plante vivante", "plantes vivantes", "viande crue", "viande fraiche", "poisson frais",
      "bet vivan", "plant vivan", "vyann fre", "vyann kri",
    ],
    references: [REF.usda, REF.tradeGov],
  },
  {
    id: "toxic",
    title: { en: "Pesticides, toxic and radioactive material", fr: "Pesticides, produits toxiques et radioactifs", ht: "Pestisid, pwodwi toksik ak radyoaktif" },
    reason: {
      en: "Organochlorine pesticides are banned in Haiti and other pesticides need an import permit; toxic and radioactive waste is prohibited.",
      fr: "Les pesticides organochlorés sont interdits en Haïti et les autres exigent un permis d'importation ; les déchets toxiques et radioactifs sont interdits.",
      ht: "Pestisid òganoklore entèdi Ayiti, lòt pestisid bezwen yon pèmi; fatra toksik ak radyoaktif entèdi.",
    },
    examples: { en: "Pesticides, herbicides, DDT, toxic waste, radioactive items", fr: "Pesticides, herbicides, DDT, déchets toxiques, objets radioactifs", ht: "Pestisid, èbisid, DDT, fatra toksik, bagay radyoaktif" },
    keywords: [
      "pesticide", "pesticides", "herbicide", "herbicides", "ddt", "toxic waste", "radioactive",
      "dechets toxiques", "radioactif", "pestisid", "ebisid", "radyoaktif",
    ],
    references: [REF.usda, REF.tradeGov],
  },
  {
    id: "cash",
    title: { en: "Cash and banknotes", fr: "Argent liquide et billets de banque", ht: "Lajan kach ak biyè bank" },
    reason: {
      en: "Cash can't travel in packages: it is uninsurable and must be declared to Haitian customs above the legal limit. Use a money-transfer service instead.",
      fr: "L'argent liquide ne peut pas voyager dans les colis : il n'est pas assurable et doit être déclaré à la douane haïtienne au-delà de la limite légale.",
      ht: "Lajan kach pa ka vwayaje nan koli: yo pa ka asire l, epi fòk ou deklare l nan ladwàn Ayiti si l depase limit lalwa a.",
    },
    examples: { en: "Banknotes, cash, money orders sent as cash", fr: "Billets de banque, argent liquide", ht: "Biyè bank, lajan kach" },
    keywords: ["cash", "banknote", "banknotes", "argent liquide", "billets de banque", "lajan kach", "kob kach"],
    references: [REF.tradeGov],
  },
];

/** Lowercase, strip accents and punctuation (keeping apostrophes), collapse spaces. */
export function normalize(text: string): string {
  return ` ${text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/**
 * Everyday products whose names contain a prohibited keyword. These
 * phrases are removed before matching so they never trigger a block.
 */
const HARMLESS = [
  "glue gun", "hot glue gun", "massage gun", "massager gun", "heat gun", "nail gun", "staple gun", "spray gun",
  "paint gun", "caulk gun", "caulking gun", "grease gun", "soldering gun", "water gun", "squirt gun", "bubble gun",
  "tape gun", "label gun", "price gun", "temperature gun", "thermometer gun", "nerf gun",
  "bullet journal", "nutribullet", "nutri bullet", "magic bullet", "bullet blender", "bullet point",
  "cash register", "cash box", "cash drawer", "cash counting", "cash counter",
  "pistolet a colle", "pistolet de massage", "pistolet a peinture", "pistolet a eau",
].map(normalize);

function stripHarmless(hay: string): string {
  let out = hay;
  for (const phrase of HARMLESS) out = out.split(phrase).join(" ");
  return out;
}

const INDEX = PROHIBITED.map((category) => ({
  category,
  keys: [...new Set(category.keywords.map((k) => normalize(k)))],
}));

/** The first prohibited category the text mentions, or null. Whole words only. */
export function findProhibited(text: string): ProhibitedCategory | null {
  const hay = stripHarmless(normalize(text));
  for (const { category, keys } of INDEX) {
    if (keys.some((k) => hay.includes(k))) return category;
  }
  return null;
}

export function prohibitedById(id: string): ProhibitedCategory | undefined {
  return PROHIBITED.find((c) => c.id === id);
}
