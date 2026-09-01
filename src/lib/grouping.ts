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

/**
 * Mengubah data catatan invoice / history menjadi format teks Markdown yang rapi untuk disalin ke clipboard.
 */
export function generateMarkdownInvoice(invoiceData: any, allItemsLookup?: any[]): string {
  if (!invoiceData) return "";

  const dateFormatted = invoiceData.date
    ? new Date(invoiceData.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  let desc = invoiceData.description?.trim() || "Invoice Rental";
  if (
    !desc.toLowerCase().startsWith("event") &&
    !desc.toLowerCase().startsWith("cetak") &&
    !desc.toLowerCase().startsWith("sewa")
  ) {
    desc = `Event: ${desc}`;
  }

  const payloadData: any[] = typeof invoiceData.payload === "string"
    ? JSON.parse(invoiceData.payload || "[]")
    : (Array.isArray(invoiceData.payload) ? invoiceData.payload : []);

  const grouped = groupItemsByPrimaryCategory(payloadData, allItemsLookup);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  const lines: string[] = [
    `📅 **${dateFormatted}**`,
    `📝 **${desc}**`,
    "",
  ];

  for (const group of grouped) {
    lines.push(`**[${group.categoryName}]**`);
    for (const item of group.items) {
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const totalItemPrice = qty * price;
      lines.push(`- ${qty} Unit x ${item.name} (${formatRupiah(totalItemPrice)})`);
    }
    lines.push("");
  }

  const grandTotal = payloadData.reduce(
    (acc: number, cur: any) => acc + ((Number(cur.qty) || 1) * (Number(cur.price) || 0)),
    0
  );

  lines.push(`💰 **Total: ${formatRupiah(grandTotal)}**`);

  return lines.join("\n").trim();
}

