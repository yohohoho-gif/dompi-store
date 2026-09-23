/**
 * validate-thailand-address.mjs
 *
 * Verifies the integrity of both the pinned source files and the generated runtime dataset.
 * Checks for relational consistency, postal code formatting, bilingual completeness,
 * tuple shape, and absence of exact duplicates.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceDir = path.join(rootDir, 'data', 'thailand-address-source');
const outputFile = path.join(rootDir, 'src', 'data', 'thailand-addresses.json');

// Expected counts for the pinned dataset version: kongvut/thai-province-data v2.0.0 (commit 326c2eb)
const PINNED_VERSION = 'v2.0.0 (commit 326c2eb)';
const EXPECTED_PROVINCES = 77;
const EXPECTED_DISTRICTS = 930;
const EXPECTED_SUBDISTRICTS = 7452;

function assertCondition(cond, message) {
  if (!cond) {
    throw new Error(`Validation check failed: ${message}`);
  }
}

function run() {
  console.log(`=== Validating Thailand Address Dataset [${PINNED_VERSION}] ===\n`);

  // 1. Verify existence of required files
  const provFile = path.join(sourceDir, 'province.json');
  const distFile = path.join(sourceDir, 'district.json');
  const subFile = path.join(sourceDir, 'sub_district.json');

  assertCondition(fs.existsSync(provFile), `Source file province.json not found at ${provFile}`);
  assertCondition(fs.existsSync(distFile), `Source file district.json not found at ${distFile}`);
  assertCondition(fs.existsSync(subFile), `Source file sub_district.json not found at ${subFile}`);
  assertCondition(fs.existsSync(outputFile), `Runtime dataset not found at ${outputFile}. Run "npm run address:generate" first.`);

  const provinces = JSON.parse(fs.readFileSync(provFile, 'utf8'));
  const districts = JSON.parse(fs.readFileSync(distFile, 'utf8'));
  const subdistricts = JSON.parse(fs.readFileSync(subFile, 'utf8'));
  const generatedTuples = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

  // 2. Source relational validation
  console.log('1. Checking source record counts...');
  assertCondition(provinces.length === EXPECTED_PROVINCES, `Expected ${EXPECTED_PROVINCES} provinces for pinned version, found ${provinces.length}`);
  assertCondition(districts.length === EXPECTED_DISTRICTS, `Expected ${EXPECTED_DISTRICTS} districts for pinned version, found ${districts.length}`);
  assertCondition(subdistricts.length === EXPECTED_SUBDISTRICTS, `Expected ${EXPECTED_SUBDISTRICTS} subdistricts for pinned version, found ${subdistricts.length}`);
  console.log(`   ✓ Source counts match pinned baseline: 77 provinces, 930 districts, 7,452 subdistricts`);

  console.log('2. Validating relational integrity...');
  const provIds = new Set(provinces.map(p => p.id));
  const distIds = new Set(districts.map(d => d.id));
  const subIds = new Set();

  for (const p of provinces) {
    assertCondition(p.name_th && p.name_th.trim(), `Province ${p.id} has empty name_th`);
    assertCondition(p.name_en && p.name_en.trim(), `Province ${p.id} has empty name_en`);
  }

  for (const d of districts) {
    assertCondition(provIds.has(d.province_id), `Orphan district ${d.id} references missing province ${d.province_id}`);
    assertCondition(d.name_th && d.name_th.trim(), `District ${d.id} has empty name_th`);
    assertCondition(d.name_en && d.name_en.trim(), `District ${d.id} has empty name_en`);
  }

  const POSTAL_REGEX = /^[0-9]{5}$/;
  for (const s of subdistricts) {
    assertCondition(!subIds.has(s.id), `Duplicate subdistrict ID found in source: ${s.id}`);
    subIds.add(s.id);
    assertCondition(distIds.has(s.district_id), `Orphan subdistrict ${s.id} references missing district ${s.district_id}`);
    assertCondition(s.name_th && s.name_th.trim(), `Subdistrict ${s.id} has empty name_th`);
    assertCondition(s.name_en && s.name_en.trim(), `Subdistrict ${s.id} has empty name_en`);
    const zip = String(s.zip_code ?? '');
    assertCondition(POSTAL_REGEX.test(zip), `Subdistrict ${s.id} has invalid 5-digit postal code: "${zip}"`);
  }
  console.log(`   ✓ Relational integrity verified: 0 orphan districts, 0 orphan subdistricts, 0 duplicate IDs`);

  // 3. Generated runtime dataset validation
  console.log('3. Validating generated runtime dataset (thailand-addresses.json)...');
  assertCondition(Array.isArray(generatedTuples), 'Generated dataset root is not an array');
  assertCondition(generatedTuples.length === EXPECTED_SUBDISTRICTS, `Generated dataset record count (${generatedTuples.length}) does not match expected (${EXPECTED_SUBDISTRICTS})`);

  const seenTuples = new Set();
  let invalidTupleShape = 0;
  let invalidZip = 0;
  let emptyFields = 0;

  for (let i = 0; i < generatedTuples.length; i++) {
    const t = generatedTuples[i];
    if (!Array.isArray(t) || t.length !== 7) {
      invalidTupleShape++;
      continue;
    }
    const [subTh, distTh, provTh, zip, subEn, distEn, provEn] = t;
    if (!subTh || !distTh || !provTh || !subEn || !distEn || !provEn) {
      emptyFields++;
    }
    if (!POSTAL_REGEX.test(zip)) {
      invalidZip++;
    }

    const tupleKey = `${subTh}|${distTh}|${provTh}|${zip}|${subEn}|${distEn}|${provEn}`;
    if (seenTuples.has(tupleKey)) {
      throw new Error(`Exact duplicate generated tuple at index ${i}: ${tupleKey}`);
    }
    seenTuples.add(tupleKey);
  }

  assertCondition(invalidTupleShape === 0, `${invalidTupleShape} tuples do not have exact length of 7`);
  assertCondition(emptyFields === 0, `${emptyFields} tuples contain empty string elements`);
  assertCondition(invalidZip === 0, `${invalidZip} tuples have invalid postal code format`);
  console.log(`   ✓ Tuple shape: 100% of ${generatedTuples.length} records are 7-element non-empty string tuples`);
  console.log(`   ✓ Duplicate check: 0 exact duplicate tuples`);

  const stats = fs.statSync(outputFile);
  console.log('\n=== Validation Summary: PASSED ===');
  console.log(`- Pinned Version: ${PINNED_VERSION}`);
  console.log(`- Verified Records: ${generatedTuples.length}`);
  console.log(`- File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`- Integrity: No orphans, no missing bilingual names, valid 5-digit postal codes.`);
}

try {
  run();
} catch (err) {
  console.error('\n[ERROR] Validation failed:', err.message);
  process.exit(1);
}
