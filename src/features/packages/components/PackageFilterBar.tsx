"use client";

import React from "react";
import { Tag, Filter, X, Search, ChevronDown } from "lucide-react";
import { PackageTemplate } from "../types";

export interface PackageFilterBarProps {
  packages: PackageTemplate[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onClearLabels: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryTabs: string[];
  allLabels: string[];
  isLabelDropdownOpen: boolean;
  onToggleLabelDropdown: () => void;
  onCloseLabelDropdown: () => void;
  isFiltered: boolean;
  onResetAll: () => void;
}

export function PackageFilterBar({
  packages,
  selectedCategory,
  onSelectCategory,
  selectedLabels,
  onToggleLabel,
  onClearLabels,
  searchQuery,
  onSearchChange,
  categoryTabs,
  allLabels,
  isLabelDropdownOpen,
  onToggleLabelDropdown,
  onCloseLabelDropdown,
  isFiltered,
  onResetAll,
}: PackageFilterBarProps) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3.5">
      {/* 1. Pill Buttons / Tabs untuk Kategori Utama */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-400" /> Kategori Utama:
          </span>
          {isFiltered && (
            <button
              onClick={onResetAll}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categoryTabs.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count =
              cat === "ALL"
                ? packages.length
                : packages.filter(
                    (p) => (p.kategoriUtama || "").toLowerCase() === cat.toLowerCase()
                  ).length;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold ring-1 ring-blue-400/50"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <span>{cat === "ALL" ? "Semua Kategori" : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-blue-700/90 text-blue-100" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cross-Filter Label/Grade & Quick Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-2 relative">
          {/* Dropdown Multi-Select Checkbox Filter Label / Grade */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleLabelDropdown}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                selectedLabels.length > 0
                  ? "bg-blue-950/70 border-blue-600 text-blue-300 shadow-sm shadow-blue-950"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span>Filter Label / Grade</span>
              {selectedLabels.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none">
                  {selectedLabels.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                  isLabelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu Checkbox */}
            {isLabelDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseLabelDropdown} />
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-200">Cross-Filter Label</span>
                    {selectedLabels.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearLabels}
                        className="text-[11px] text-zinc-400 hover:text-red-400 cursor-pointer"
                      >
                        Hapus Pilihan
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {allLabels.length > 0 ? (
                      allLabels.map((lbl) => {
                        const isChecked = selectedLabels.includes(lbl);
                        const countInCat = packages.filter((p) => {
                          const matchCat =
                            selectedCategory === "ALL" ||
                            (p.kategoriUtama || "").toLowerCase() === selectedCategory.toLowerCase();
                          const matchLbl =
                            Array.isArray(p.labelGrade) &&
                            p.labelGrade.some((l) => l.toLowerCase() === lbl.toLowerCase());
                          return matchCat && matchLbl;
                        }).length;

                        return (
                          <label
                            key={lbl}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => onToggleLabel(lbl)}
                                className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                              />
                              <span
                                className={`truncate ${
                                  isChecked ? "text-blue-300 font-semibold" : "text-zinc-300"
                                }`}
                              >
                                {lbl}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                              {countInCat}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-xs text-zinc-500 py-2 text-center">Belum ada label.</div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-end">
                    <button
                      type="button"
                      onClick={onCloseLabelDropdown}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Badge Label Aktif */}
          {selectedLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedLabels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-950/80 border border-blue-700 text-blue-300 shadow-sm"
                >
                  <span>{lbl}</span>
                  <button
                    type="button"
                    onClick={() => onToggleLabel(lbl)}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Input Pencarian Cepat */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari paket..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

