"use client";

import { useState, useMemo, useEffect } from "react";
import type { Item, Category, SortOption } from "../types";

interface UseInventoryFilterOptions {
  items: Item[];
  categories: Category[];
  layer?: "all_items" | "rented" | "maintenance";
  initialLayer?: "all_items" | "rented" | "maintenance";
}

export function useInventoryFilter({ items, categories, layer, initialLayer }: UseInventoryFilterOptions) {
  const currentLayer = initialLayer || layer || "all_items";
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Temukan objek kategori saat ini
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Reset filter kembali ke 'ALL' jika kategori yang terpilih terhapus dari database
  useEffect(() => {
    if (selectedCategory !== "ALL" && !currentCategoryObj) {
      setSelectedCategory("ALL");
    }
  }, [categories, selectedCategory, currentCategoryObj]);

  // Reset pagination saat filter, pencarian, sort atau tab berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [layer, selectedCategory, searchQuery, sortBy]);

  // Logika Filter Pencarian
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory =
        selectedCategory === "ALL" || item.categories.some((c) => c.id === selectedCategory);
      const q = searchQuery.toLowerCase();
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.categories.some((c) => c.name.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Filter berdasarkan Layer & Sorting
  const itemsToDisplay = useMemo(() => {
    let displayItems = filteredItems;
    if (currentLayer === "rented") displayItems = displayItems.filter((i) => i.rentedQuantity > 0);
    if (currentLayer === "maintenance") displayItems = displayItems.filter((i) => i.maintenanceQuantity > 0);

    return [...displayItems].sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);

      if (sortBy === "date_modified_desc") {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      }

      if (sortBy === "date_modified_asc") {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateA - dateB;
      }

      const getQty = (item: Item) => {
        if (currentLayer === "rented") return item.rentedQuantity;
        if (currentLayer === "maintenance") return item.maintenanceQuantity;
        return item.quantity + item.rentedQuantity + item.maintenanceQuantity;
      };

      const qtyA = getQty(a);
      const qtyB = getQty(b);

      if (sortBy === "qty_highest") return qtyB - qtyA;
      if (sortBy === "qty_lowest") return qtyA - qtyB;

      if (sortBy === "price_highest") return (b.price || 0) - (a.price || 0);
      if (sortBy === "price_lowest") return (a.price || 0) - (b.price || 0);

      return 0;
    });
  }, [filteredItems, currentLayer, sortBy]);

  // Logika Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = itemsToDisplay.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(itemsToDisplay.length / itemsPerPage));

  return {
    selectedCategory,
    setSelectedCategory,
    currentCategoryObj,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredItems,
    itemsToDisplay,
    currentItems,
    totalPages,
    totalItems: itemsToDisplay.length,
    indexOfFirstItem,
    indexOfLastItem,
  };
}

