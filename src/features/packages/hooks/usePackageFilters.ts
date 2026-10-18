"use client";

import { useState, useMemo } from "react";
import { PackageTemplate } from "../types";

export function usePackageFilters(packages: PackageTemplate[]) {
  const [selectedPkgCategory, setSelectedPkgCategory] = useState<string>("ALL");
  const [selectedPkgLabels, setSelectedPkgLabels] = useState<string[]>([]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState<string>("");
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);

  // Kategori unik untuk pill tab
  const packageCategoryTabs = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (p.kategoriUtama && p.kategoriUtama.trim()) {
        set.add(p.kategoriUtama.trim());
      }
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [packages]);

  // Semua label unik untuk filter
  const allAvailableLabels = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (Array.isArray(p.labelGrade)) {
        p.labelGrade.forEach((l) => {
          if (l && l.trim()) set.add(l.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [packages]);

  // Filter paket berdasarkan kategori, labels, dan search query
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // 1. Filter Kategori Utama
      if (selectedPkgCategory !== "ALL") {
        const pkgCat = (pkg.kategoriUtama || "").toLowerCase();
        if (pkgCat !== selectedPkgCategory.toLowerCase()) return false;
      }

      // 2. Filter Multi-Select Label / Grade (AND logic)
      if (selectedPkgLabels.length > 0) {
        if (!Array.isArray(pkg.labelGrade) || pkg.labelGrade.length === 0) return false;
        const pkgLabelsLower = pkg.labelGrade.map((l) => l.toLowerCase());
        const hasAllLabels = selectedPkgLabels.every((selected) =>
          pkgLabelsLower.includes(selected.toLowerCase())
        );
        if (!hasAllLabels) return false;
      }

      // 3. Search query
      if (pkgSearchQuery.trim()) {
        const query = pkgSearchQuery.toLowerCase();
        const matchName = pkg.name.toLowerCase().includes(query);
        const matchDesc = (pkg.description || "").toLowerCase().includes(query);
        const matchCat = (pkg.kategoriUtama || "").toLowerCase().includes(query);
        const matchLabel =
          Array.isArray(pkg.labelGrade) &&
          pkg.labelGrade.some((l) => l.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchCat && !matchLabel) return false;
      }

      return true;
    });
  }, [packages, selectedPkgCategory, selectedPkgLabels, pkgSearchQuery]);

  const resetFilters = () => {
    setSelectedPkgCategory("ALL");
    setSelectedPkgLabels([]);
    setPkgSearchQuery("");
  };

  const isFiltered =
    selectedPkgCategory !== "ALL" || selectedPkgLabels.length > 0 || !!pkgSearchQuery.trim();

  return {
    selectedPkgCategory,
    setSelectedPkgCategory,
    selectedPkgLabels,
    setSelectedPkgLabels,
    pkgSearchQuery,
    setPkgSearchQuery,
    isLabelDropdownOpen,
    setIsLabelDropdownOpen,
    packageCategoryTabs,
    allAvailableLabels,
    filteredPackages,
    resetFilters,
    isFiltered,
  };
}
