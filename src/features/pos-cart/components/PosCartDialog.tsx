"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Search, ShoppingCart, PackageOpen, AlertCircle, Loader2, PlusCircle } from "lucide-react";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { DEMO_MESSAGES } from "@/shared/constants/permissions";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { deletePackageTemplate } from "@/features/packages";
import { checkoutRental } from "../actions/posCheckoutActions";
import { usePosCart } from "../context/PosCartContext";
import { CartItemList } from "./CartItemList";
import { CustomServiceForm, CustomServiceList } from "./CustomServiceRow";
import { CartCheckoutSummary } from "./CartCheckoutSummary";
import type { AddRentalDialogProps, CartItem, CustomServiceItem } from "../types";

export function PosCartDialog({ items, packages = [] }: AddRentalDialogProps) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [isDeletingPkg, setIsDeletingPkg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number | "">(0);
  const [discountDesc, setDiscountDesc] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [targetEventId, setTargetEventId] = useState<string>("");
  const [targetEventName, setTargetEventName] = useState<string>("");
  const [rentalDays, setRentalDays] = useState<number | "">(1);

  const [customItems, setCustomItems] = useState<CustomServiceItem[]>([]);

  const { isAdmin, isDummyUser, showDemoWarning, setShowDemoWarning } = useAuthPermission();
  const context = usePosCart();

  const addToCart = (item: any) => {
    if (item.quantity <= 0) return;
    const currentAccumulatedQty = cart
      .filter((c) => c.id === item.id)
      .reduce((sum, c) => sum + (Number(c.qty) || 1), 0);

    if (currentAccumulatedQty >= item.quantity) {
      setWarningMsg(
        `Stok tersedia di gudang untuk "${item.name}" sudah maksimal di keranjang (${item.quantity} Unit).`
      );
      return;
    }

    // MULTI-ADD: Buat baris mandiri baru dengan lineId tanpa auto-merge
    const newLine: CartItem = {
      lineId: crypto.randomUUID(),
      id: item.id,
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      price: item.price,
      rentPercentage: item.rentPercentage,
      imageUrl: item.imageUrl,
      qty: 1,
      discount: 0,
      footnote: "",
    };
    setCart((prev) => [...prev, newLine]);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleLoadPackage = (pkgId: string, isAppendOnly: boolean = false) => {
    setWarningMsg(null);
    setErrorMsg(null);

    let newCart = [...cart];

    // Jika mengganti paket melalui dropdown, hapus paket sebelumnya
    if (!isAppendOnly && selectedPackageId) {
      newCart = newCart.filter(
        (c) => !(c as any).fromPackageId || (c as any).fromPackageId !== selectedPackageId
      );
    }

    if (!isAppendOnly) {
      setSelectedPackageId(pkgId);
    }

    if (!pkgId) {
      if (!isAppendOnly) setCart(newCart);
      return;
    }

    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) {
      if (!isAppendOnly) setCart(newCart);
      return;
    }

    try {
      const parsedPayload = JSON.parse(pkg.payload);
      let hasError = false;
      let errorDetails = "";

      const currentInCartMap = new Map<string, number>();
      newCart.forEach((c) => {
        currentInCartMap.set(c.id, (currentInCartMap.get(c.id) || 0) + (Number(c.qty) || 1));
      });

      const pkgDemandMap = new Map<string, number>();
      parsedPayload.forEach((pItem: any) => {
        pkgDemandMap.set(pItem.id, (pkgDemandMap.get(pItem.id) || 0) + (Number(pItem.qty) || 1));
      });

      for (const [itemId, demandQty] of pkgDemandMap.entries()) {
        const realItem = items.find((i) => i.id === itemId);
        if (!realItem) {
          hasError = true;
          errorDetails += `Barang tidak ditemukan. `;
          continue;
        }

        const totalNeeded = (currentInCartMap.get(itemId) || 0) + demandQty;
        if (totalNeeded > realItem.quantity) {
          hasError = true;
          errorDetails += `${realItem.name} stok tidak cukup (Butuh ${totalNeeded}, Ada ${realItem.quantity}). `;
        }
      }

      if (hasError) {
        setErrorMsg(`Paket tidak dapat digunakan: ${errorDetails}`);
        if (!isAppendOnly) {
          setSelectedPackageId("");
          setCart(newCart);
        }
        return;
      }

      // MULTI-ADD: Masukkan setiap item paket sebagai baris mandiri baru
      parsedPayload.forEach((pItem: any) => {
        const realItem = items.find((i) => i.id === pItem.id)!;
        newCart.push({
          lineId: crypto.randomUUID(),
          fromPackageId: pkg.id,
          id: realItem.id,
          name: realItem.name,
          code: realItem.code,
          quantity: realItem.quantity,
          price: realItem.price,
          rentPercentage: realItem.rentPercentage,
          imageUrl: realItem.imageUrl,
          qty: Number(pItem.qty) || 1,
          discount: Math.min(100, Math.max(0, Number(pItem.discount) || 0)),
          footnote: pItem.footnote || "",
        });
      });

      setCart(newCart);
    } catch {
      setErrorMsg("Gagal memuat paket.");
      if (!isAppendOnly) {
        setSelectedPackageId("");
        setCart(newCart);
      }
    }
  };

  // Sync with context if present
  useEffect(() => {
    if (context.isOpen && !open) {
      setOpen(true);
      if (context.targetEventId) {
        setTargetEventId(context.targetEventId);
        setTargetEventName(context.targetEventName);
        setEventName(`${context.targetEventName} (Tambahan)`);
      }
    }
  }, [context.isOpen, context.targetEventId, context.targetEventName, open]);

  // Handle external add item from context
  useEffect(() => {
    if (context.externalAddItem) {
      const itemToAdd = items.find((i) => i.id === context.externalAddItem.id) || context.externalAddItem;
      addToCart(itemToAdd);
      context.setExternalAddItem(null);
    }
  }, [context.externalAddItem, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle external package load from context
  useEffect(() => {
    if (context.externalPkgId) {
      handleLoadPackage(context.externalPkgId, true);
      context.setExternalPkgId(null);
    }
  }, [context.externalPkgId, packages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listener fallback untuk window events
  useEffect(() => {
    const handleAddToCartEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.pkgId) {
        handleLoadPackage(customEvent.detail.pkgId, true);
      } else if (customEvent.detail?.item) {
        addToCart(customEvent.detail.item);
      } else if (customEvent.detail?.itemId) {
        const found = items.find((i) => i.id === customEvent.detail.itemId);
        if (found) addToCart(found);
      }
    };

    const handleOpenAddonRental = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.eventId) {
        const evId = customEvent.detail.eventId;
        const evName = customEvent.detail.eventName || "Event";
        setTargetEventId(evId);
        setTargetEventName(evName);
        setEventName(`${evName} (Tambahan)`);
        setCart([]);
        setCustomItems([]);
        setSelectedPackageId("");
        setDiscountPercentage(0);
        setDiscountDesc("");
        setRentalDays(1);
        setErrorMsg(null);
        setWarningMsg(null);
        setOpen(true);
      }
    };

    window.addEventListener("add-to-pos-cart", handleAddToCartEvent);
    window.addEventListener("open-addon-rental", handleOpenAddonRental);
    return () => {
      window.removeEventListener("add-to-pos-cart", handleAddToCartEvent);
      window.removeEventListener("open-addon-rental", handleOpenAddonRental);
    };
  }, [packages, items, cart, selectedPackageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePackage = async () => {
    if (!selectedPackageId || !confirm("Yakin ingin menghapus template paket ini?")) return;
    setIsDeletingPkg(true);
    await deletePackageTemplate(selectedPackageId);
    setIsDeletingPkg(false);
    setSelectedPackageId("");
    setWarningMsg(null);
  };

  const updateQty = (lineId: string, newQty: any) => {
    const target = cart.find((c) => c.lineId === lineId);
    if (!target) return;

    const otherLinesQty = cart
      .filter((c) => c.id === target.id && c.lineId !== lineId)
      .reduce((sum, c) => sum + (Number(c.qty) || 1), 0);
    const maxAllowed = Math.max(1, target.quantity - otherLinesQty);

    setCart(
      cart.map((c) => {
        if (c.lineId === lineId) {
          return {
            ...c,
            qty: newQty === "" ? "" : Math.min(Math.max(1, parseInt(newQty) || 0), maxAllowed),
          };
        }
        return c;
      })
    );
  };

  const updateDiscount = (lineId: string, newDiscount: any) => {
    setCart(
      cart.map((c) => {
        if (c.lineId === lineId) {
          return {
            ...c,
            discount:
              newDiscount === "" ? "" : Math.min(100, Math.max(0, parseInt(newDiscount) || 0)),
          };
        }
        return c;
      })
    );
  };

  const updateFootnote = (lineId: string, footnote: string) => {
    setCart(cart.map((c) => (c.lineId === lineId ? { ...c, footnote } : c)));
  };

  const handleAddCustomItem = (newItem: {
    name: string;
    qty: number | "";
    price: number | "";
    discount?: number | "";
  }) => {
    setCustomItems([
      ...customItems,
      {
        id: `custom-${Date.now()}`,
        lineId: crypto.randomUUID(),
        name: newItem.name,
        qty: Number(newItem.qty) || 1,
        price: Number(newItem.price) || 0,
        discount: Math.min(100, Math.max(0, Number(newItem.discount) || 0)),
        footnote: "",
      },
    ]);
  };

  const updateCustomQty = (id: string, newQty: any) => {
    setCustomItems(
      customItems.map((c) =>
        c.id === id ? { ...c, qty: newQty === "" ? "" : Math.max(1, parseInt(newQty) || 0) } : c
      )
    );
  };

  const updateCustomPrice = (id: string, newPrice: any) => {
    setCustomItems(
      customItems.map((c) =>
        c.id === id ? { ...c, price: newPrice === "" ? "" : Math.max(0, parseInt(newPrice) || 0) } : c
      )
    );
  };

  const updateCustomDiscount = (id: string, newDiscount: any) => {
    setCustomItems(
      customItems.map((c) =>
        c.id === id
          ? {
              ...c,
              discount:
                newDiscount === "" ? "" : Math.min(100, Math.max(0, parseInt(newDiscount) || 0)),
            }
          : c
      )
    );
  };

  const updateCustomFootnote = (id: string, newFootnote: string) => {
    setCustomItems(customItems.map((c) => (c.id === id ? { ...c, footnote: newFootnote } : c)));
  };

  async function handleSubmit(formData: FormData) {
    if (isDummyUser) {
      setShowDemoWarning(true);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    if (cart.length === 0 && customItems.length === 0) {
      setErrorMsg("Keranjang masih kosong.");
      setIsSubmitting(false);
      return;
    }

    formData.append("itemsPayload", JSON.stringify(cart));
    formData.append("customPayload", JSON.stringify(customItems));
    formData.append("rentalDays", String(rentalDays || 1));
    formData.append("discountPercentage", String(discountPercentage || 0));
    formData.append("discountDesc", discountDesc || "");
    formData.append("eventName", eventName || "");
    if (targetEventId) {
      formData.append("targetEventId", targetEventId);
      formData.append("targetEventName", targetEventName);
    }

    const result = await checkoutRental(formData);

    if (result && !result.success) {
      setErrorMsg(result.error ?? "Terjadi kesalahan sistem.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setOpen(false);
    context.setIsOpen(false);
    context.clearTargetEvent();
    setCart([]);
    setSelectedPackageId("");
    setWarningMsg(null);
    setDiscountPercentage(0);
    setDiscountDesc("");
    setEventName("");
    setTargetEventId("");
    setTargetEventName("");
    setRentalDays(1);
    setCustomItems([]);
  }

  const groupedCart = useMemo(() => groupItemsByPrimaryCategory(cart, items), [cart, items]);

  const safeRentalDays = Number(rentalDays) || 1;
  const safeDiscountPercentage = Number(discountPercentage) || 0;
  const assetSubTotal = cart.reduce((acc, item) => {
    const baseRentPerItem = ((item.price || 0) * (item.rentPercentage || 0)) / 100;
    const itemDiscount = Math.min(100, Math.max(0, Number(item.discount) || 0));
    const lineNet = (baseRentPerItem * (Number(item.qty) || 1)) * (1 - itemDiscount / 100);
    return acc + lineNet * safeRentalDays;
  }, 0);
  const customSubTotal = customItems.reduce((acc, item) => {
    const basePrice = Number(item.price) || 0;
    const itemDiscount = Math.min(100, Math.max(0, Number(item.discount) || 0));
    const lineNet = (basePrice * (Number(item.qty) || 1)) * (1 - itemDiscount / 100);
    return acc + lineNet * safeRentalDays;
  }, 0);
  const subTotal = assetSubTotal + customSubTotal;
  const discountAmount = subTotal * (safeDiscountPercentage / 100);
  const grandTotal = subTotal - discountAmount;

  if (!isAdmin && !isDummyUser) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        context.setIsOpen(isOpen);
        if (!isOpen) {
          setErrorMsg(null);
          setWarningMsg(null);
          setTargetEventId("");
          setTargetEventName("");
          context.clearTargetEvent();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto shrink-0 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 shadow-lg hover:shadow-emerald-900/50 transition-all font-bold flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang Kasir</span>
          {(cart.length > 0 || customItems.length > 0) && (
            <span className="bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black px-2 py-0.5 rounded-full shadow-inner">
              {cart.reduce((acc, i) => acc + (Number(i.qty) || 1), 0) +
                customItems.reduce((acc, i) => acc + (Number(i.qty) || 1), 0)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 flex flex-col max-w-[98vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] w-full h-[98vh] max-h-[98vh] overflow-hidden p-3 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {targetEventId
              ? `Tambah Barang Susulan: ${targetEventName}`
              : "Keranjang Rental & Point of Sale (POS)"}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md flex items-center gap-2 shrink-0">
            <span className="font-bold">Gagal:</span> {errorMsg}
          </div>
        )}

        {warningMsg && (
          <div className="bg-amber-950/50 border border-amber-900 text-amber-400 text-xs p-3 rounded-md flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{warningMsg}</span>
          </div>
        )}

        <form
          action={handleSubmit}
          className="flex flex-col lg:flex-row gap-6 pt-2 flex-1 overflow-y-auto pr-1 pb-4"
        >
          {/* Kolom Kiri: Form & Pemilih Paket / Barang */}
          <div className="flex flex-col gap-4 w-full lg:w-[350px] xl:w-[400px] shrink-0 pb-2">
            {targetEventId && (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-lg flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <PlusCircle className="w-4 h-4" /> Mode Tambah Barang Susulan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetEventId("");
                      setTargetEventName("");
                      setEventName("");
                      context.clearTargetEvent();
                    }}
                    className="text-[10px] text-zinc-400 hover:text-red-400 underline"
                  >
                    Batal Mode Susulan
                  </button>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Barang yang disewa akan otomatis tergabung ke Event:{" "}
                  <strong>{targetEventName}</strong> dan membuat Invoice Tambahan baru di Riwayat
                  Transaksi.
                </p>
              </div>
            )}

            <div className="space-y-2 shrink-0">
              <div className="flex justify-between items-center">
                <Label>
                  Nama Event / Acara {targetEventId ? "(Terkunci: Mode Tambahan)" : "(Opsional)"}
                </Label>
                {targetEventId && (
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono">
                    Mode Susulan
                  </span>
                )}
              </div>
              <Input
                placeholder="Misal: Konser Dewa 19"
                value={eventName}
                onChange={(e) => !targetEventId && setEventName(e.target.value)}
                readOnly={!!targetEventId}
                disabled={!!targetEventId}
                className={`bg-zinc-900 border-zinc-800 ${
                  targetEventId
                    ? "opacity-90 cursor-not-allowed bg-zinc-900/80 font-semibold text-emerald-300 border-emerald-800/60"
                    : ""
                }`}
              />
            </div>

            {packages.length > 0 && (
              <div className="space-y-2 shrink-0 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <Label className="flex items-center gap-2 text-emerald-400">
                  <PackageOpen className="w-4 h-4" /> Gunakan Template Paket
                </Label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 min-w-0 truncate bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-10 px-3"
                    value={selectedPackageId}
                    onChange={(e) => handleLoadPackage(e.target.value)}
                  >
                    <option value="">-- Pilih Paket (Opsional) --</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.description ? `- ${p.description}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPackageId && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleDeletePackage}
                      disabled={isDeletingPkg}
                      className="shrink-0 h-10 w-10 border border-red-900 bg-red-950/50 text-red-400 hover:bg-red-900"
                    >
                      {isDeletingPkg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 shrink-0">
              <Label>Cari Aset Tersedia</Label>
              <div className="relative z-50">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Ketik nama atau kode aset..."
                  className="pl-9 bg-zinc-900 border-zinc-800"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                />
                {showResults && searchQuery && (
                  <div className="absolute top-full mt-1 left-0 w-full max-h-[180px] overflow-y-auto overflow-x-hidden bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl z-50">
                    {filteredItems.filter((i) => i.quantity > 0).length > 0 ? (
                      filteredItems
                        .filter((i) => i.quantity > 0)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 flex justify-between items-center gap-3"
                            onClick={() => addToCart(item)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <ItemThumbnail
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-md"
                                iconClassName="w-4 h-4 text-zinc-500"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-zinc-200 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-zinc-400 font-mono">{item.code}</p>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-emerald-400 shrink-0">
                              Tersedia: {item.quantity}
                            </p>
                          </div>
                        ))
                    ) : (
                      <div className="p-3 text-sm text-zinc-500 text-center">
                        Aset tidak ditemukan / stok kosong.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <CustomServiceForm onAddCustomItem={handleAddCustomItem} />
          </div>

          {/* Kolom Kanan: Daftar Keranjang & Ringkasan Checkout */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex justify-between items-center shrink-0 border-b border-zinc-800 pb-2">
              <Label className="text-base text-zinc-100 font-bold">Daftar Keranjang / Invoice</Label>
              {(cart.length > 0 || customItems.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Yakin ingin mengosongkan seluruh isi keranjang?")) {
                      setCart([]);
                      setCustomItems([]);
                      setSelectedPackageId("");
                      setEventName("");
                      setDiscountPercentage(0);
                      setDiscountDesc("");
                      setRentalDays(1);
                    }
                  }}
                  className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Kosongkan Keranjang
                </button>
              )}
            </div>

            {cart.length === 0 && customItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 text-sm mt-2">
                Belum ada item di keranjang.
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <CartItemList
                  groupedCart={groupedCart}
                  safeRentalDays={safeRentalDays}
                  onUpdateQty={updateQty}
                  onUpdateDiscount={updateDiscount}
                  onUpdateFootnote={updateFootnote}
                  onRemove={(lineId) => setCart(cart.filter((c) => c.lineId !== lineId))}
                />

                <CustomServiceList
                  customItems={customItems}
                  safeRentalDays={safeRentalDays}
                  onUpdateQty={updateCustomQty}
                  onUpdatePrice={updateCustomPrice}
                  onUpdateDiscount={updateCustomDiscount}
                  onUpdateFootnote={updateCustomFootnote}
                  onRemove={(id) =>
                    setCustomItems(customItems.filter((c) => (c.lineId || c.id) !== id))
                  }
                />
              </div>
            )}

            {(cart.length > 0 || customItems.length > 0) && (
              <CartCheckoutSummary
                rentalDays={rentalDays}
                onRentalDaysChange={setRentalDays}
                discountPercentage={discountPercentage}
                onDiscountPercentageChange={setDiscountPercentage}
                discountDesc={discountDesc}
                onDiscountDescChange={setDiscountDesc}
                subTotal={subTotal}
                discountAmount={discountAmount}
                grandTotal={grandTotal}
                isSubmitting={isSubmitting}
                isDisabled={cart.length === 0 && customItems.length === 0}
              />
            )}
          </div>
        </form>
      </DialogContent>
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        title={DEMO_MESSAGES.rental.title}
        message="Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Pembuatan transaksi sewa kasir dinonaktifkan pada akun ini."
      />
    </Dialog>
  );
}

