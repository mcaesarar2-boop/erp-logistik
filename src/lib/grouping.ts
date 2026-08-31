/**
 * Utility untuk mengambil Kategori / Label Utama (Index ke-0) dari item
 * dan mengelompokkan (auto-grouping) list barang berdasarkan section header kategori.
 */

export function getItemPrimaryCategory(item: any, allItemsLookup?: any[]): string {
  if (!item) return "LAINNYA";

  // Cek jika item adalah layanan kustom / tambahan
  if (item.code === "LAYANAN" || (item.id && String(item.id).startsWith("custom-"))) {
    return "LAYANAN TAMBAHAN";
  }

  // 1. Cek langsung di properti categories (Prisma relation / schema)
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    const firstCat = item.categories[0];
    const catName = typeof firstCat === "string" ? firstCat : firstCat?.name;
    if (catName && String(catName).trim() !== "") {
      return String(catName).trim().toUpperCase();
    }
  }

  // 2. Cek di properti labels (array label/tags)
  if (Array.isArray(item.labels) && item.labels.length > 0) {
    const firstLabel = item.labels[0];
    const labelName = typeof firstLabel === "string" ? firstLabel : firstLabel?.name;
    if (labelName && String(labelName).trim() !== "") {
      return String(labelName).trim().toUpperCase();
    }
  }

  // 3. Cek di properti tags (array string)
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    const firstTag = item.tags[0];
    if (firstTag && String(firstTag).trim() !== "") {
      return String(firstTag).trim().toUpperCase();
    }
  }

  // 4. Cek properti category tunggal jika ada
  if (item.category) {
    const catName = typeof item.category === "string" ? item.category : item.category?.name;
    if (catName && String(catName).trim() !== "") {
      return String(catName).trim().toUpperCase();
    }
  }

  // 5. Jika tidak ada di objek lokal snapshot, cari di allItemsLookup
  if (allItemsLookup && Array.isArray(allItemsLookup) && allItemsLookup.length > 0) {
    const found = allItemsLookup.find(
      (dbItem: any) => (item.id && dbItem.id === item.id) || (item.code && dbItem.code === item.code)
    );
    if (found) {
      if (Array.isArray(found.categories) && found.categories.length > 0) {
        const firstCat = found.categories[0];
        const catName = typeof firstCat === "string" ? firstCat : firstCat?.name;
        if (catName && String(catName).trim() !== "") {
          return String(catName).trim().toUpperCase();
        }
      }
      if (Array.isArray(found.labels) && found.labels.length > 0) {
        const firstLabel = found.labels[0];
        const labelName = typeof firstLabel === "string" ? firstLabel : firstLabel?.name;
        if (labelName && String(labelName).trim() !== "") {
          return String(labelName).trim().toUpperCase();
        }
      }
    }
  }

  return "LAINNYA";
}

export interface GroupedCategory<T> {
  categoryName: string;
  items: T[];
}

/**
 * Mengelompokkan array item ke dalam kelompok kategori berdasarkan label urutan pertama (index 0).
 */
export function groupItemsByPrimaryCategory<T>(
  items: T[],
  allItemsLookup?: any[]
): GroupedCategory<T>[] {
  if (!items || items.length === 0) return [];

  const groupsMap = new Map<string, T[]>();

  for (const item of items) {
    const category = getItemPrimaryCategory(item, allItemsLookup);
    const existing = groupsMap.get(category);
    if (existing) {
      existing.push(item);
    } else {
      groupsMap.set(category, [item]);
    }
  }

  const result: GroupedCategory<T>[] = [];
  groupsMap.forEach((groupItems, categoryName) => {
    result.push({
      categoryName,
      items: groupItems,
    });
  });

  return result;
}

