# Thailand Address Source Data

## Provenance & Attribution

- **Repository**: [kongvut/thai-province-data](https://github.com/kongvut/thai-province-data)
- **Maintainer**: Kongvut Sangkla (`@kongvut`)
- **Version**: 2.0.0 (v2 project architecture)
- **Pinned Commit**: `326c2ebe778fc0c6a26c4b09770e3c2aa97c6be8`
- **Pinned Date**: 2026-05-25 (Merge PR #44: "Fix: Correct English district names")
- **License**: MIT License

### MIT License Notice

```text
MIT License

Copyright (c) 2025 Kongvut Sangkla

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Vendored Source Files

This directory contains the minimum required relational source datasets:
1. `province.json` (77 records) - Primary provinces with geography and bilingual names.
2. `district.json` (930 records) - Districts (Amphoe / Khet) mapped to provinces.
3. `sub_district.json` (7,452 records) - Subdistricts (Tambon / Khwaeng) mapped to districts with 5-digit postal codes.

## Generation Pipeline

Do not modify files in this directory manually.
To regenerate the compact bilingual runtime dataset for DOMPI:

```bash
npm run address:generate
npm run address:validate
```

The runtime dataset is built into: `src/data/thailand-addresses.json`.
