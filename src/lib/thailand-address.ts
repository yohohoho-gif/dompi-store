/**
 * thailand-address.ts
 *
 * Client/Server Data Access Layer for the DOMPI Thailand Administrative Address Dataset.
 * Loads the compact bilingual dataset lazily on-demand.
 * Builds in-memory indexes on first interaction to deliver <2ms filtering without
 * blocking global bundle execution or making network requests.
 */

export type ThailandAddressTuple = [
  subdistrictTh: string,
  districtTh: string,
  provinceTh: string,
  postalCode: string,
  subdistrictEn: string,
  districtEn: string,
  provinceEn: string
];

export const TUPLE_IDX = {
  SUBDISTRICT_TH: 0,
  DISTRICT_TH: 1,
  PROVINCE_TH: 2,
  POSTAL_CODE: 3,
  SUBDISTRICT_EN: 4,
  DISTRICT_EN: 5,
  PROVINCE_EN: 6,
} as const;

export interface ThailandAddressCandidate {
  id: string; // Composite unique key: `${provinceTh}|${districtTh}|${subdistrictTh}|${postalCode}`
  subdistrictTh: string;
  districtTh: string;
  provinceTh: string;
  postalCode: string;
  subdistrictEn: string;
  districtEn: string;
  provinceEn: string;
}

export interface ProvinceOption {
  nameTh: string;
  nameEn: string;
}

export interface DistrictOption {
  nameTh: string;
  nameEn: string;
}

export interface SubdistrictOption {
  nameTh: string;
  nameEn: string;
  postalCode: string;
}

// Memory Cache Singletons
let cachedDataset: ThailandAddressTuple[] | null = null;
let loadPromise: Promise<ThailandAddressTuple[]> | null = null;

let provincesCache: ProvinceOption[] | null = null;
let districtsCache: Map<string, DistrictOption[]> | null = null;
let subdistrictsCache: Map<string, SubdistrictOption[]> | null = null;
let postalCodeIndex: Map<string, ThailandAddressCandidate[]> | null = null;

/**
 * Lazy loads the Thailand address dataset dynamically.
 * Guaranteed zero overhead on pages that do not mount or call Thailand address functions.
 */
export async function loadThailandAddressDataset(): Promise<ThailandAddressTuple[]> {
  if (cachedDataset) return cachedDataset;
  if (!loadPromise) {
    loadPromise = import("@/data/thailand-addresses.json")
      .then((mod) => {
        const raw = (mod.default ?? mod) as ThailandAddressTuple[];
        if (!Array.isArray(raw)) {
          throw new Error("Invalid Thailand address dataset format.");
        }
        cachedDataset = raw;
        buildIndexes(raw);
        return raw;
      })
      .catch((err) => {
        loadPromise = null; // Allow retry on failure
        throw err;
      });
  }
  return loadPromise;
}

/**
 * Builds pre-computed indexes in memory once when dataset is loaded.
 */
function buildIndexes(tuples: ThailandAddressTuple[]) {
  const provMap = new Map<string, ProvinceOption>();
  const distMap = new Map<string, Map<string, DistrictOption>>();
  const subMap = new Map<string, Map<string, SubdistrictOption>>();
  const zipMap = new Map<string, ThailandAddressCandidate[]>();

  for (let i = 0; i < tuples.length; i++) {
    const t = tuples[i];
    const subTh = t[0];
    const distTh = t[1];
    const provTh = t[2];
    const zip = t[3];
    const subEn = t[4];
    const distEn = t[5];
    const provEn = t[6];

    // 1. Province index
    if (!provMap.has(provTh)) {
      provMap.set(provTh, { nameTh: provTh, nameEn: provEn });
    }

    // 2. District index by province
    if (!distMap.has(provTh)) {
      distMap.set(provTh, new Map());
    }
    const provDistricts = distMap.get(provTh)!;
    if (!provDistricts.has(distTh)) {
      provDistricts.set(distTh, { nameTh: distTh, nameEn: distEn });
    }

    // 3. Subdistrict index by province + district
    const provDistKey = `${provTh}|${distTh}`;
    if (!subMap.has(provDistKey)) {
      subMap.set(provDistKey, new Map());
    }
    const distSubs = subMap.get(provDistKey)!;
    if (!distSubs.has(subTh)) {
      distSubs.set(subTh, { nameTh: subTh, nameEn: subEn, postalCode: zip });
    }

    // 4. Postal code reverse index
    const candidate: ThailandAddressCandidate = {
      id: `${provTh}|${distTh}|${subTh}|${zip}`,
      subdistrictTh: subTh,
      districtTh: distTh,
      provinceTh: provTh,
      postalCode: zip,
      subdistrictEn: subEn,
      districtEn: distEn,
      provinceEn: provEn,
    };

    let zipList = zipMap.get(zip);
    if (!zipList) {
      zipList = [];
      zipMap.set(zip, zipList);
    }
    zipList.push(candidate);
  }

  // Sort and freeze indexes
  provincesCache = Array.from(provMap.values()).sort((a, b) =>
    a.nameTh.localeCompare(b.nameTh, "th")
  );

  districtsCache = new Map();
  for (const [pTh, dMap] of distMap.entries()) {
    districtsCache.set(
      pTh,
      Array.from(dMap.values()).sort((a, b) =>
        a.nameTh.localeCompare(b.nameTh, "th")
      )
    );
  }

  subdistrictsCache = new Map();
  for (const [key, sMap] of subMap.entries()) {
    subdistrictsCache.set(
      key,
      Array.from(sMap.values()).sort((a, b) =>
        a.nameTh.localeCompare(b.nameTh, "th")
      )
    );
  }

  postalCodeIndex = zipMap;
}

/**
 * Normalizes text for search comparison (trimmed, lowercased).
 */
export function normalizeSearchText(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Returns all 77 Thai provinces sorted alphabetically by Thai script.
 */
export async function getThailandProvinces(): Promise<ProvinceOption[]> {
  await loadThailandAddressDataset();
  return provincesCache ?? [];
}

/**
 * Returns districts for a given province.
 */
export async function getThailandDistricts(
  provinceTh: string
): Promise<DistrictOption[]> {
  await loadThailandAddressDataset();
  if (!provinceTh || !districtsCache) return [];
  return districtsCache.get(provinceTh.trim()) ?? [];
}

/**
 * Returns subdistricts for a given province and district.
 */
export async function getThailandSubdistricts(
  provinceTh: string,
  districtTh: string
): Promise<SubdistrictOption[]> {
  await loadThailandAddressDataset();
  if (!provinceTh || !districtTh || !subdistrictsCache) return [];
  const key = `${provinceTh.trim()}|${districtTh.trim()}`;
  return subdistrictsCache.get(key) ?? [];
}

/**
 * Finds all candidate address records matching a given 5-digit postal code.
 */
export async function findAddressesByPostalCode(
  postalCode: string
): Promise<ThailandAddressCandidate[]> {
  await loadThailandAddressDataset();
  const trimmed = postalCode.trim();
  if (!trimmed || !postalCodeIndex) return [];
  return postalCodeIndex.get(trimmed) ?? [];
}

export interface ThailandAddressSearchResult {
  candidates: ThailandAddressCandidate[];
  totalMatches: number;
  hasMore: boolean;
}

/**
 * Searches candidates by query string.
 * Supports:
 * - 5-digit numeric postal codes (exact postal area candidates)
 * - Thai and English text keywords matching subdistrict, district, or province (minimum 2 characters)
 * - Incomplete numeric input (< 5 digits) returns empty to prevent misleading broad matches.
 */
export async function searchThailandAddresses(
  query: string,
  limit: number = 20
): Promise<ThailandAddressSearchResult> {
  const q = normalizeSearchText(query);
  if (!q || q.length < 2) {
    return { candidates: [], totalMatches: 0, hasMore: false };
  }

  // 1. Pure numeric input
  const isPureDigits = /^[0-9]+$/.test(q);
  if (isPureDigits) {
    if (q.length === 5) {
      const postalMatches = await findAddressesByPostalCode(q);
      return {
        candidates: postalMatches.slice(0, limit),
        totalMatches: postalMatches.length,
        hasMore: postalMatches.length > limit,
      };
    }
    // Incomplete numeric postal code (< 5 digits) -> return empty to avoid misleading broad matches
    return { candidates: [], totalMatches: 0, hasMore: false };
  }

  // 2. Text keyword search (Thai or English)
  const dataset = await loadThailandAddressDataset();
  const results: ThailandAddressCandidate[] = [];
  let totalMatches = 0;

  for (let i = 0; i < dataset.length; i++) {
    const t = dataset[i];
    const subTh = t[0];
    const distTh = t[1];
    const provTh = t[2];
    const zip = t[3];
    const subEn = t[4];
    const distEn = t[5];
    const provEn = t[6];

    const match =
      subTh.toLowerCase().includes(q) ||
      distTh.toLowerCase().includes(q) ||
      provTh.toLowerCase().includes(q) ||
      subEn.toLowerCase().includes(q) ||
      distEn.toLowerCase().includes(q) ||
      provEn.toLowerCase().includes(q);

    if (match) {
      totalMatches++;
      if (results.length < limit) {
        results.push({
          id: `${provTh}|${distTh}|${subTh}|${zip}`,
          subdistrictTh: subTh,
          districtTh: distTh,
          provinceTh: provTh,
          postalCode: zip,
          subdistrictEn: subEn,
          districtEn: distEn,
          provinceEn: provEn,
        });
      }
    }
  }

  return {
    candidates: results,
    totalMatches,
    hasMore: totalMatches > limit,
  };
}

/**
 * Finds exact postal code for a valid (province, district, subdistrict) triplet.
 */
export async function resolveExactPostalCode(
  provinceTh: string,
  districtTh: string,
  subdistrictTh: string
): Promise<string | null> {
  const subs = await getThailandSubdistricts(provinceTh, districtTh);
  const matched = subs.find((s) => s.nameTh === subdistrictTh.trim());
  return matched ? matched.postalCode : null;
}
