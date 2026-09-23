"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  getThailandProvinces,
  getThailandDistricts,
  getThailandSubdistricts,
  searchThailandAddresses,
  ProvinceOption,
  DistrictOption,
  SubdistrictOption,
  ThailandAddressCandidate,
} from "@/lib/thailand-address";

export interface ThailandAddressValue {
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

export interface ThailandAddressSelectorProps {
  value: ThailandAddressValue;
  onChange: (nextValue: ThailandAddressValue) => void;
  disabled?: boolean;
  errors?: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
  className?: string;
}

export default function ThailandAddressSelector({
  value,
  onChange,
  disabled = false,
  errors = {},
  className = "",
}: ThailandAddressSelectorProps) {
  const baseId = useId();

  // Mode: 'structured' (dataset combobox/cascading) | 'manual' (free-text fallback)
  const [isManualMode, setIsManualMode] = useState(false);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  // Dataset Options
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [subdistricts, setSubdistricts] = useState<SubdistrictOption[]>([]);

  // Unified Location / Postal Code Search State
  // Initialized purely from existing address values in Edit mode
  const [searchQuery, setSearchQuery] = useState(() => {
    if (value.subdistrict && value.district && value.province && value.postalCode) {
      return `${value.subdistrict}, ${value.district}, ${value.province} ${value.postalCode}`;
    }
    if (value.postalCode) {
      return value.postalCode;
    }
    return "";
  });
  const [searchCandidates, setSearchCandidates] = useState<ThailandAddressCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [candidateHighlightedIndex, setCandidateHighlightedIndex] = useState(-1);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const candidateDropdownRef = useRef<HTMLDivElement>(null);

  // Load provinces on mount
  useEffect(() => {
    let ignore = false;
    getThailandProvinces()
      .then((provList) => {
        if (!ignore) {
          setProvinces(provList);
          setIsLoadingDataset(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load Thailand address dataset:", err);
          setDatasetError("Could not load address suggestions. Manual entry enabled.");
          setIsManualMode(true);
          setIsLoadingDataset(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Load districts whenever selected province changes
  useEffect(() => {
    let ignore = false;
    if (value.province && !isManualMode) {
      getThailandDistricts(value.province)
        .then((dList) => {
          if (!ignore) setDistricts(dList);
        })
        .catch((err) => console.error("Failed to load districts:", err));
    }
    return () => {
      ignore = true;
    };
  }, [value.province, isManualMode]);

  // Load subdistricts whenever selected district changes
  useEffect(() => {
    let ignore = false;
    if (value.province && value.district && !isManualMode) {
      getThailandSubdistricts(value.province, value.district)
        .then((sList) => {
          if (!ignore) setSubdistricts(sList);
        })
        .catch((err) => console.error("Failed to load subdistricts:", err));
    }
    return () => {
      ignore = true;
    };
  }, [value.province, value.district, isManualMode]);

  const activeDistricts = value.province && !isManualMode ? districts : [];
  const activeSubdistricts =
    value.province && value.district && !isManualMode ? subdistricts : [];

  // Close candidate dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        candidateDropdownRef.current &&
        !candidateDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCandidateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Province change in hierarchical flow (clears search to avoid stale state)
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProv = e.target.value;
    setSearchQuery("");
    setSearchCandidates([]);
    setShowCandidateDropdown(false);
    onChange({
      province: nextProv,
      district: "",
      subdistrict: "",
      postalCode: "",
    });
  };

  // Handle District change in hierarchical flow (clears search to avoid stale state)
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDist = e.target.value;
    setSearchQuery("");
    setSearchCandidates([]);
    setShowCandidateDropdown(false);
    onChange({
      ...value,
      district: nextDist,
      subdistrict: "",
      postalCode: "",
    });
  };

  // Handle Subdistrict change in hierarchical flow (clears search to avoid stale state)
  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSub = e.target.value;
    const selected = activeSubdistricts.find((s) => s.nameTh === nextSub);
    setSearchQuery("");
    setSearchCandidates([]);
    setShowCandidateDropdown(false);
    onChange({
      ...value,
      subdistrict: nextSub,
      postalCode: selected ? selected.postalCode : value.postalCode,
    });
  };

  // Handle Unified Search input (Postal Code or Thai/English locality keyword)
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);

    const trimmed = text.trim();
    const isPureDigits = /^[0-9]+$/.test(trimmed);

    // If pure digits, search only when 5 digits; if text, search when length >= 2
    if ((isPureDigits && trimmed.length === 5) || (!isPureDigits && trimmed.length >= 2)) {
      setIsSearching(true);
      try {
        const result = await searchThailandAddresses(trimmed, 20);
        setSearchCandidates(result.candidates);
        setTotalMatches(result.totalMatches);
        setHasMoreMatches(result.hasMore);
        setShowCandidateDropdown(true);
        setCandidateHighlightedIndex(-1);
      } catch (err) {
        console.error("Address search failed:", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchCandidates([]);
      setTotalMatches(0);
      setHasMoreMatches(false);
      setShowCandidateDropdown(false);
    }
  };

  // Select candidate from search results (updates canonical Thai values + search display)
  const handleSelectCandidate = (candidate: ThailandAddressCandidate) => {
    onChange({
      province: candidate.provinceTh,
      district: candidate.districtTh,
      subdistrict: candidate.subdistrictTh,
      postalCode: candidate.postalCode,
    });
    setSearchQuery(
      `${candidate.subdistrictTh}, ${candidate.districtTh}, ${candidate.provinceTh} ${candidate.postalCode}`
    );
    setShowCandidateDropdown(false);
    setCandidateHighlightedIndex(-1);
  };

  // Keyboard navigation for candidate dropdown
  const handleCandidateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCandidateDropdown || searchCandidates.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCandidateHighlightedIndex((prev) =>
        prev < searchCandidates.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCandidateHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : searchCandidates.length - 1
      );
    } else if (e.key === "Enter" && candidateHighlightedIndex >= 0) {
      e.preventDefault();
      handleSelectCandidate(searchCandidates[candidateHighlightedIndex]);
    } else if (e.key === "Escape") {
      setShowCandidateDropdown(false);
    }
  };

  // Manual fallback inputs change
  const handleManualChange = (field: keyof ThailandAddressValue, val: string) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle Header */}
      <div className="flex items-center justify-between text-xs text-neutral-500 pb-1 border-b border-neutral-100">
        <span className="font-medium text-neutral-700">
          {isManualMode ? "Manual Address Entry" : "Administrative Address Lookup"}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsManualMode(!isManualMode);
            setShowCandidateDropdown(false);
          }}
          disabled={disabled}
          className="text-black underline underline-offset-2 hover:opacity-70 transition-opacity focus:outline-none focus:ring-1 focus:ring-black rounded-[4px] px-1"
        >
          {isManualMode ? "Use automatic address lookup" : "Enter address manually"}
        </button>
      </div>

      {datasetError && (
        <div className="p-2.5 text-xs text-amber-800 bg-amber-50 rounded-[8px] border border-amber-200">
          {datasetError}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE A: STRUCTURED AUTOCOMPLETE / CASCADING SELECTOR */}
      {/* ---------------------------------------------------- */}
      {!isManualMode ? (
        <div className="space-y-3">
          {/* Unified Location & Postal Code Search */}
          <div className="relative" ref={candidateDropdownRef}>
            <label
              htmlFor={`${baseId}-location-search`}
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
            >
              Quick Search (ค้นหาจากรหัสไปรษณีย์ หรือ ชื่อตำบล/อำเภอ)
            </label>
            <div className="relative">
              <input
                id={`${baseId}-location-search`}
                type="text"
                disabled={disabled || isLoadingDataset}
                placeholder="Type postal code or area (e.g. 10110, บางละมุง, Bang Lamung, เชียงใหม่)"
                aria-label="Search by postal code or location"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleCandidateKeyDown}
                onFocus={() => {
                  if (searchCandidates.length > 0) setShowCandidateDropdown(true);
                }}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                role="combobox"
                aria-expanded={showCandidateDropdown}
                aria-autocomplete="list"
                aria-controls={`${baseId}-candidate-list`}
              />
              {isSearching && (
                <div className="absolute right-3 top-3 text-xs text-neutral-400 animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {/* Candidate Disambiguation Dropdown */}
            {showCandidateDropdown && (
              <div
                id={`${baseId}-candidate-list`}
                role="listbox"
                className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-[8px] shadow-lg divide-y divide-neutral-100"
              >
                {searchCandidates.length > 0 ? (
                  <>
                    <div className="p-2 bg-neutral-50 text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Select matching area ({totalMatches} matches):</span>
                      {hasMoreMatches && (
                        <span className="text-[10px] text-neutral-400 font-normal">
                          Showing top 20
                        </span>
                      )}
                    </div>
                    {searchCandidates.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={idx === candidateHighlightedIndex}
                        onClick={() => handleSelectCandidate(c)}
                        onMouseEnter={() => setCandidateHighlightedIndex(idx)}
                        className={`w-full text-left p-2.5 text-xs transition-colors flex flex-col gap-0.5 ${
                          idx === candidateHighlightedIndex
                            ? "bg-neutral-100 text-black font-medium"
                            : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-black">
                            แขวง/ตำบล {c.subdistrictTh}{" "}
                            <span className="text-neutral-400 font-normal">
                              ({c.subdistrictEn})
                            </span>
                          </span>
                          <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded text-[10px] font-mono">
                            {c.postalCode}
                          </span>
                        </div>
                        <div className="text-neutral-500 text-[11px]">
                          เขต/อำเภอ {c.districtTh} ({c.districtEn}) • จังหวัด {c.provinceTh} ({c.provinceEn})
                        </div>
                      </button>
                    ))}
                    {hasMoreMatches && (
                      <div className="p-2 bg-neutral-50 text-center text-[11px] text-neutral-500 italic">
                        Type more to narrow results
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-xs text-neutral-500">
                    No matching locations found. Try another search or select step-by-step below.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-2 text-[11px] font-medium text-neutral-400 absolute">
              OR SELECT STEP-BY-STEP
            </span>
          </div>

          {/* Grid: Province & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Province */}
            <div>
              <label
                htmlFor={`${baseId}-province`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                จังหวัด / Province *
              </label>
              <select
                id={`${baseId}-province`}
                disabled={disabled || isLoadingDataset}
                value={value.province}
                onChange={handleProvinceChange}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              >
                <option value="">-- เลือกจังหวัด / Select Province --</option>
                {provinces.map((p) => (
                  <option key={p.nameTh} value={p.nameTh}>
                    {p.nameTh} ({p.nameEn})
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="mt-1 text-xs text-red-600">{errors.province}</p>
              )}
            </div>

            {/* District */}
            <div>
              <label
                htmlFor={`${baseId}-district`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                เขต / อำเภอ (District) *
              </label>
              <select
                id={`${baseId}-district`}
                disabled={disabled || !value.province || activeDistricts.length === 0}
                value={value.district}
                onChange={handleDistrictChange}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors disabled:bg-neutral-100 disabled:text-neutral-400"
              >
                <option value="">
                  {!value.province
                    ? "-- เลือกจังหวัดก่อน / Select Province first --"
                    : "-- เลือกเขต/อำเภอ / Select District --"}
                </option>
                {activeDistricts.map((d) => (
                  <option key={d.nameTh} value={d.nameTh}>
                    {d.nameTh} ({d.nameEn})
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-xs text-red-600">{errors.district}</p>
              )}
            </div>
          </div>

          {/* Grid: Subdistrict & Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subdistrict */}
            <div>
              <label
                htmlFor={`${baseId}-subdistrict`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                แขวง / ตำบล (Subdistrict) *
              </label>
              <select
                id={`${baseId}-subdistrict`}
                disabled={disabled || !value.district || activeSubdistricts.length === 0}
                value={value.subdistrict}
                onChange={handleSubdistrictChange}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors disabled:bg-neutral-100 disabled:text-neutral-400"
              >
                <option value="">
                  {!value.district
                    ? "-- เลือกเขต/อำเภอก่อน / Select District first --"
                    : "-- เลือกแขวง/ตำบล / Select Subdistrict --"}
                </option>
                {activeSubdistricts.map((s) => (
                  <option key={s.nameTh} value={s.nameTh}>
                    {s.nameTh} ({s.nameEn}) - {s.postalCode}
                  </option>
                ))}
              </select>
              {errors.subdistrict && (
                <p className="mt-1 text-xs text-red-600">{errors.subdistrict}</p>
              )}
            </div>

            {/* Postal Code (Auto-populated from subdistrict or manual) */}
            <div>
              <label
                htmlFor={`${baseId}-postalCode`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                รหัสไปรษณีย์ / Postal Code *
              </label>
              <input
                id={`${baseId}-postalCode`}
                type="text"
                readOnly={Boolean(value.subdistrict)}
                inputMode="numeric"
                maxLength={5}
                disabled={disabled}
                placeholder="Auto-populated or 5 digits"
                value={value.postalCode}
                onChange={(e) =>
                  onChange({
                    ...value,
                    postalCode: e.target.value.replace(/[^0-9]/g, "").slice(0, 5),
                  })
                }
                className={`w-full h-11 px-3 border border-neutral-300 rounded-[8px] text-sm text-black font-mono transition-colors ${
                  value.subdistrict
                    ? "bg-neutral-50 text-neutral-700 cursor-not-allowed"
                    : "bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                }`}
              />
              {errors.postalCode && (
                <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* MODE B: FREE-TEXT MANUAL FALLBACK                   */
        /* ---------------------------------------------------- */
        <div className="space-y-3 p-3 bg-neutral-50/70 border border-neutral-200 rounded-[8px]">
          <p className="text-[11px] text-neutral-500 mb-1">
            Manual Mode: Enter standard Thai or English administrative names for non-standard or new postal zones.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${baseId}-manual-province`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                จังหวัด / Province *
              </label>
              <input
                id={`${baseId}-manual-province`}
                type="text"
                disabled={disabled}
                placeholder="e.g. กรุงเทพมหานคร or Bangkok"
                value={value.province}
                onChange={(e) => handleManualChange("province", e.target.value)}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              {errors.province && (
                <p className="mt-1 text-xs text-red-600">{errors.province}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-manual-district`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                เขต / อำเภอ (District) *
              </label>
              <input
                id={`${baseId}-manual-district`}
                type="text"
                disabled={disabled}
                placeholder="e.g. บางรัก or Bang Rak"
                value={value.district}
                onChange={(e) => handleManualChange("district", e.target.value)}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              {errors.district && (
                <p className="mt-1 text-xs text-red-600">{errors.district}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${baseId}-manual-subdistrict`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                แขวง / ตำบล (Subdistrict) *
              </label>
              <input
                id={`${baseId}-manual-subdistrict`}
                type="text"
                disabled={disabled}
                placeholder="e.g. สีลม or Si Lom"
                value={value.subdistrict}
                onChange={(e) => handleManualChange("subdistrict", e.target.value)}
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              {errors.subdistrict && (
                <p className="mt-1 text-xs text-red-600">{errors.subdistrict}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-manual-postalCode`}
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1"
              >
                รหัสไปรษณีย์ / Postal Code *
              </label>
              <input
                id={`${baseId}-manual-postalCode`}
                type="text"
                inputMode="numeric"
                maxLength={5}
                disabled={disabled}
                placeholder="5-digit postal code (e.g. 10500)"
                value={value.postalCode}
                onChange={(e) =>
                  handleManualChange(
                    "postalCode",
                    e.target.value.replace(/[^0-9]/g, "").slice(0, 5)
                  )
                }
                className="w-full h-11 px-3 bg-white border border-neutral-300 rounded-[8px] text-sm text-black font-mono focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              {errors.postalCode && (
                <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
