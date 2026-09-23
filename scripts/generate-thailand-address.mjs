/**
 * generate-thailand-address.mjs
 *
 * Reads pinned Thailand address source files (province, district, sub_district),
 * validates relational integrity, and generates a compact bilingual runtime dataset.
 *
 * Output: src/data/thailand-addresses.json
 * Tuple format:
 * [
 *   subdistrictThai,
 *   districtThai,
 *   provinceThai,
 *   postalCode,
 *   subdistrictEnglish,
 *   districtEnglish,
 *   provinceEnglish
 * ]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceDir = path.join(rootDir, 'data', 'thailand-address-source');
const outputDir = path.join(rootDir, 'src', 'data');
const outputFile = path.join(outputDir, 'thailand-addresses.json');

const provinceFile = path.join(sourceDir, 'province.json');
const districtFile = path.join(sourceDir, 'district.json');
const subdistrictFile = path.join(sourceDir, 'sub_district.json');

function assertFileExists(filePath, name) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${name} (${filePath}). Please ensure data/thailand-address-source/ is present.`);
  }
}

function run() {
  const startTime = Date.now();
  console.log('Generating Thailand address runtime dataset...');

  assertFileExists(provinceFile, 'province.json');
  assertFileExists(districtFile, 'district.json');
  assertFileExists(subdistrictFile, 'sub_district.json');

  const provinces = JSON.parse(fs.readFileSync(provinceFile, 'utf8'));
  const districts = JSON.parse(fs.readFileSync(districtFile, 'utf8'));
  const subdistricts = JSON.parse(fs.readFileSync(subdistrictFile, 'utf8'));

  // 1. Validate provinces
  const provinceMap = new Map();
  for (const p of provinces) {
    if (!p.id) throw new Error(`Province missing id: ${JSON.stringify(p)}`);
    if (provinceMap.has(p.id)) throw new Error(`Duplicate province ID: ${p.id}`);
    const nameTh = (p.name_th || '').trim();
    const nameEn = (p.name_en || '').trim();
    if (!nameTh) throw new Error(`Province ${p.id} missing name_th`);
    if (!nameEn) throw new Error(`Province ${p.id} missing name_en`);
    provinceMap.set(p.id, { id: p.id, nameTh, nameEn });
  }

  // 2. Validate districts
  const districtMap = new Map();
  for (const d of districts) {
    if (!d.id) throw new Error(`District missing id: ${JSON.stringify(d)}`);
    if (districtMap.has(d.id)) throw new Error(`Duplicate district ID: ${d.id}`);
    if (!provinceMap.has(d.province_id)) {
      throw new Error(`Orphan district ${d.id} (${d.name_th}) references non-existent province_id: ${d.province_id}`);
    }
    const nameTh = (d.name_th || '').trim();
    const nameEn = (d.name_en || '').trim();
    if (!nameTh) throw new Error(`District ${d.id} missing name_th`);
    if (!nameEn) throw new Error(`District ${d.id} missing name_en`);
    districtMap.set(d.id, { id: d.id, nameTh, nameEn, provinceId: d.province_id });
  }

  // 3. Validate subdistricts and construct compact tuples
  const POSTAL_REGEX = /^[0-9]{5}$/;
  const subdistrictIds = new Set();
  const tuples = [];

  for (const s of subdistricts) {
    if (!s.id) throw new Error(`Subdistrict missing id: ${JSON.stringify(s)}`);
    if (subdistrictIds.has(s.id)) throw new Error(`Duplicate subdistrict ID: ${s.id}`);
    subdistrictIds.add(s.id);

    if (!districtMap.has(s.district_id)) {
      throw new Error(`Orphan subdistrict ${s.id} (${s.name_th}) references non-existent district_id: ${s.district_id}`);
    }

    const dist = districtMap.get(s.district_id);
    const prov = provinceMap.get(dist.provinceId);

    const nameTh = (s.name_th || '').trim();
    const nameEn = (s.name_en || '').trim();
    const postalCode = String(s.zip_code ?? '').trim();

    if (!nameTh) throw new Error(`Subdistrict ${s.id} missing name_th`);
    if (!nameEn) throw new Error(`Subdistrict ${s.id} missing name_en`);
    if (!POSTAL_REGEX.test(postalCode)) {
      throw new Error(`Subdistrict ${s.id} (${nameTh}) has invalid postal code: "${postalCode}"`);
    }

    // Compact tuple format
    tuples.push([
      nameTh,          // 0: subdistrictThai
      dist.nameTh,     // 1: districtThai
      prov.nameTh,     // 2: provinceThai
      postalCode,      // 3: postalCode
      nameEn,          // 4: subdistrictEnglish
      dist.nameEn,     // 5: districtEnglish
      prov.nameEn      // 6: provinceEnglish
    ]);
  }

  // Deterministic sorting: Province TH -> District TH -> Subdistrict TH -> Postal Code
  tuples.sort((a, b) => {
    const provCmp = a[2].localeCompare(b[2], 'th');
    if (provCmp !== 0) return provCmp;
    const distCmp = a[1].localeCompare(b[1], 'th');
    if (distCmp !== 0) return distCmp;
    const subCmp = a[0].localeCompare(b[0], 'th');
    if (subCmp !== 0) return subCmp;
    return a[3].localeCompare(b[3]);
  });

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonContent = JSON.stringify(tuples);
  fs.writeFileSync(outputFile, jsonContent, 'utf8');

  const stats = fs.statSync(outputFile);
  const elapsed = Date.now() - startTime;

  console.log(`[SUCCESS] Generated ${tuples.length} address records in ${elapsed}ms`);
  console.log(`Output: ${outputFile} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`Provinces: ${provinceMap.size}, Districts: ${districtMap.size}, Subdistricts: ${subdistrictIds.size}`);
}

try {
  run();
} catch (err) {
  console.error('[ERROR] Dataset generation failed:', err.message);
  process.exit(1);
}
