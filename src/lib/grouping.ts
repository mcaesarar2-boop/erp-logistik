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
      const itemNote = (item as any).catatan || (item as any).footnote;
      const noteStr = itemNote && String(itemNote).trim() ? ` *(Catatan: ${String(itemNote).trim()})*` : "";
      lines.push(`- ${qty} Unit x ${item.name}${noteStr} (${formatRupiah(totalItemPrice)})`);
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

/**
 * Mengubah data event aktif di tab On Rented menjadi format teks Markdown yang rapi untuk disalin ke clipboard.
 */
export function generateMarkdownEvent(eventData: any, allItemsLookup?: any[]): string {
  if (!eventData) return "";

  const dateFormatted = eventData.date
    ? new Date(eventData.date).toLocaleDateString('id-ID', {
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

  let desc = eventData.description?.trim() || "Event Aktif";
  if (desc.includes("|")) {
    desc = desc.split("|")[0].trim();
  }
  if (
    !desc.toLowerCase().startsWith("event") &&
    !desc.toLowerCase().startsWith("cetak") &&
    !desc.toLowerCase().startsWith("sewa")
  ) {
    desc = `Event: ${desc}`;
  }

  const payloadData: any[] = typeof eventData.payload === "string"
    ? JSON.parse(eventData.payload || "[]")
    : (Array.isArray(eventData.payload) ? eventData.payload : []);

  // Saring item yang belum dikembalikan dan bukan layanan
  const activeItems = payloadData.filter((p: any) => 
    (p.qty - (p.returnedQty || 0)) > 0 && 
    p.code !== "LAYANAN" && 
    !(p.id && String(p.id).startsWith("custom-"))
  );

  const grouped = groupItemsByPrimaryCategory(activeItems, allItemsLookup);

  const lines: string[] = [
    `📅 **${dateFormatted}**`,
    `📝 **${desc}**`,
    "",
  ];

  for (const group of grouped) {
    lines.push(`**[${group.categoryName}]**`);
    for (const item of group.items) {
      const remainingQty = (Number((item as any).qty) || 1) - (Number((item as any).returnedQty) || 0);
      const itemNote = (item as any).catatan || (item as any).footnote;
      const noteStr = itemNote && String(itemNote).trim() ? ` *(Catatan: ${String(itemNote).trim()})*` : "";
      lines.push(`- ${remainingQty} Unit x ${(item as any).name}${noteStr}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Mengubah data template paket rental menjadi format teks Markdown yang rapi untuk disalin ke clipboard.
 */
export function generateMarkdownPackage(pkgData: any, allItemsLookup?: any[]): string {
  if (!pkgData) return "";

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  const payloadData: any[] = typeof pkgData.payload === "string"
    ? JSON.parse(pkgData.payload || "[]")
    : (Array.isArray(pkgData.payload) ? pkgData.payload : []);

  const totalPackageRent = payloadData.reduce((acc: number, pItem: any) => {
    const itemDetail = allItemsLookup?.find((i: any) => i.id === pItem.id);
    const price = itemDetail ? itemDetail.price : pItem.price;
    const rentPercentage = itemDetail ? itemDetail.rentPercentage : pItem.rentPercentage;
    const rentPrice = ((price || 0) * (rentPercentage || 0)) / 100;
    return acc + (rentPrice * (Number(pItem.qty) || 1));
  }, 0);

  const packageItems = payloadData.map((pItem: any) => {
    const itemDetail = allItemsLookup?.find((i: any) => i.id === pItem.id);
    return {
      ...(itemDetail || {}),
      ...pItem,
      name: pItem.name || itemDetail?.name || "Aset",
    };
  });

  const grouped = groupItemsByPrimaryCategory(packageItems, allItemsLookup);

  const lines: string[] = [
    `📦 **${pkgData.name}**`,
  ];

  if (pkgData.description && String(pkgData.description).trim()) {
    lines.push(`_${String(pkgData.description).trim()}_`);
  }

  lines.push("");

  for (const group of grouped) {
    lines.push(`**[${group.categoryName}]**`);
    for (const item of group.items) {
      const qty = Number((item as any).qty) || 1;
      const itemNote = (item as any).catatan || (item as any).footnote;
      const noteStr = itemNote && String(itemNote).trim() ? ` *(Catatan: ${String(itemNote).trim()})*` : "";
      lines.push(`- ${qty} Unit x ${(item as any).name}${noteStr}`);
    }
    lines.push("");
  }

  lines.push(`💰 **Total Harga: ${formatRupiah(totalPackageRent)}**`);

  return lines.join("\n").trim();
}


