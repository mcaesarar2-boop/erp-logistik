import { groupItemsByPrimaryCategory } from "./grouping";
import { formatRupiah, formatDateID } from "./formatters";

/**
 * Mengubah data catatan invoice / history menjadi format teks Markdown yang rapi untuk disalin ke clipboard.
 */
export function generateMarkdownInvoice(invoiceData: any, allItemsLookup?: any[]): string {
  if (!invoiceData) return "";

  const dateFormatted = invoiceData.date ? formatDateID(invoiceData.date) : formatDateID(new Date());

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
      const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
      const totalItemPrice = qty * price;
      const itemNote = (item as any).catatan || (item as any).footnote;
      const noteStr = itemNote && String(itemNote).trim() ? ` *(Catatan: ${String(itemNote).trim()})*` : "";

      let priceStr = "";
      if (discount === 100 || (totalItemPrice === 0 && discount > 0)) {
        priceStr = ` (Rp 0 - Diskon 100% / Bonus)`;
      } else if (discount > 0) {
        priceStr = ` (${formatRupiah(totalItemPrice)} - Diskon ${discount}%)`;
      } else {
        priceStr = ` (${formatRupiah(totalItemPrice)})`;
      }

      lines.push(`- ${qty} Unit x ${item.name}${noteStr}${priceStr}`);
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

  const dateFormatted = eventData.date ? formatDateID(eventData.date) : formatDateID(new Date());

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

  const payloadData: any[] = typeof pkgData.payload === "string"
    ? JSON.parse(pkgData.payload || "[]")
    : (Array.isArray(pkgData.payload) ? pkgData.payload : []);

  const totalPackageRent = payloadData.reduce((acc: number, pItem: any) => {
    const itemDetail = allItemsLookup?.find((i: any) => i.id === pItem.id);
    const price = itemDetail ? itemDetail.price : pItem.price;
    const rentPercentage = itemDetail ? itemDetail.rentPercentage : pItem.rentPercentage;
    const rentPrice = ((price || 0) * (rentPercentage || 0)) / 100;
    const itemDiscount = Math.min(100, Math.max(0, Number(pItem.discount) || 0));
    return acc + ((rentPrice * (Number(pItem.qty) || 1)) * (1 - (itemDiscount / 100)));
  }, 0);

  const packageItems = payloadData.map((pItem: any) => {
    const itemDetail = allItemsLookup?.find((i: any) => i.id === pItem.id);
    return {
      ...(itemDetail || {}),
      ...pItem,
      name: pItem.name || itemDetail?.name || "Aset",
      discount: Math.min(100, Math.max(0, Number(pItem.discount) || 0)),
    };
  });

  const grouped = groupItemsByPrimaryCategory(packageItems, allItemsLookup);

  const lines: string[] = [
    `📦 **${pkgData.name}**`,
  ];

  const metaBadges: string[] = [];
  if (pkgData.kategoriUtama && String(pkgData.kategoriUtama).trim()) {
    metaBadges.push(`📁 **Kategori:** ${String(pkgData.kategoriUtama).trim()}`);
  }
  if (Array.isArray(pkgData.labelGrade) && pkgData.labelGrade.length > 0) {
    metaBadges.push(`🏷️ **Label:** ${pkgData.labelGrade.join(", ")}`);
  }
  if (metaBadges.length > 0) {
    lines.push(metaBadges.join(" | "));
  }

  if (pkgData.description && String(pkgData.description).trim()) {
    lines.push(`_${String(pkgData.description).trim()}_`);
  }

  lines.push("");

  for (const group of grouped) {
    lines.push(`**[${group.categoryName}]**`);
    for (const item of group.items) {
      const qty = Number((item as any).qty) || 1;
      const itemDiscount = Math.min(100, Math.max(0, Number((item as any).discount) || 0));
      const itemDetail = allItemsLookup?.find((i: any) => i.id === (item as any).id);
      const price = itemDetail ? itemDetail.price : (item as any).price;
      const rentPercentage = itemDetail ? itemDetail.rentPercentage : (item as any).rentPercentage;
      const rentPrice = ((price || 0) * (rentPercentage || 0)) / 100;
      const lineNetTotal = (rentPrice * qty) * (1 - (itemDiscount / 100));

      const itemNote = (item as any).catatan || (item as any).footnote;
      const noteStr = itemNote && String(itemNote).trim() ? ` *(Catatan: ${String(itemNote).trim()})*` : "";

      let priceStr = "";
      if (itemDiscount === 100) {
        priceStr = ` (Rp 0 - Diskon 100% / Bonus)`;
      } else if (itemDiscount > 0) {
        priceStr = ` (${formatRupiah(lineNetTotal)} - Diskon ${itemDiscount}%)`;
      } else {
        priceStr = ` (${formatRupiah(lineNetTotal)})`;
      }

      lines.push(`- ${qty} Unit x ${(item as any).name}${noteStr}${priceStr}`);
    }
    lines.push("");
  }

  lines.push(`💰 **Total Harga: ${formatRupiah(totalPackageRent)}**`);

  return lines.join("\n").trim();
}

