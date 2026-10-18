"use client";

import { useState } from "react";
import { Calendar, PlusCircle, Eye, Plus, Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ItemThumbnail } from "@/shared/components/ItemThumbnail";
import { groupItemsByPrimaryCategory } from "@/shared/lib/grouping";
import { formatRupiah } from "@/shared/lib/formatters";
import { ReturnRentalDialog } from "./ReturnRentalDialog";
import type { History, Item } from "../types";

interface ActiveEventCardProps {
  event: History;
  items: Item[];
  isAdmin: boolean;
  isDummyUser: boolean;
  isCopied?: boolean;
  onCopy?: (event: History) => void;
  onNavigateToEvents?: () => void;
}

export function ActiveEventCard({
  event,
  items,
  isAdmin,
  isDummyUser,
  isCopied = false,
  onCopy,
  onNavigateToEvents,
}: ActiveEventCardProps) {
  const payload = event.payload ? JSON.parse(event.payload) : [];
  
  // Saring item yang belum dikembalikan, dan abaikan layanan tambahan
  const activeItems = payload.filter((p: any) => 
    (p.qty - (p.returnedQty || 0)) > 0 && 
    p.code !== "LAYANAN" && 
    !(p.id && p.id.startsWith("custom-"))
  );

  if (activeItems.length === 0) return null;

  const eventTitle = event.description?.split("|")[0].replace("Event:", "").trim() || "Event";
  const eventDate = new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "full" });

  const handleAddOnRental = () => {
    window.dispatchEvent(
      new CustomEvent("open-addon-rental", {
        detail: {
          eventId: event.id,
          eventName: eventTitle,
        },
      })
    );
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col shadow-sm group relative">
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-amber-400 mb-1 line-clamp-1" title={event.description || ""}>
            {eventTitle}
          </h4>
          <p className="text-xs text-zinc-500">{eventDate}</p>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => onCopy?.(event)}
            className={`p-2 rounded-md transition-all shadow-sm ${
              isCopied
                ? "bg-amber-950/80 border border-amber-700 text-amber-400"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
            title="Salin Data Event (Markdown)"
          >
            {isCopied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
          </button>
          {isCopied && (
            <div className="absolute -bottom-8 right-0 bg-amber-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
              Tersalin!
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 mb-4 space-y-3">
        {groupItemsByPrimaryCategory(activeItems, items).map((group) => (
          <div key={group.categoryName} className="w-full">
            <div className="w-full flex items-center gap-1.5 pb-1 mb-1.5 border-b border-zinc-800/80">
              <span className="w-1.5 h-3 bg-amber-400 rounded-full shrink-0" />
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                {group.categoryName}
              </span>
              <span className="text-[9px] font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded-full border border-zinc-800">
                {group.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {group.items.map((p: any, idx: number) => {
                const realItem = items.find((i) => i.id === p.id || i.code === p.code);
                const isCustom = p.code === "LAYANAN" || (p.id && String(p.id).startsWith("custom-"));
                const itemNote = p.catatan || p.footnote;
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs py-1 border-b border-zinc-850/40 last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isCustom ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-950/40 border border-blue-800/40 flex items-center justify-center shrink-0 text-blue-400">
                          <PlusCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ItemThumbnail
                          src={realItem?.imageUrl || p.imageUrl}
                          alt={p.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded shrink-0"
                          iconClassName="w-3.5 h-3.5 text-zinc-500"
                        />
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-300 truncate font-medium">{p.name}</span>
                          {p.discount === 100 ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1 py-0.2 rounded">
                              FREE / Bonus
                            </span>
                          ) : p.discount > 0 ? (
                            <span className="text-[9px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1 py-0.2 rounded">
                              Disc {p.discount}%
                            </span>
                          ) : null}
                        </div>
                        {itemNote && (
                          <span className="text-[11px] text-zinc-400 italic truncate" title={itemNote}>
                            {itemNote}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold shrink-0 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded text-[11px]">
                      {p.qty - (p.returnedQty || 0)} Unit
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex h-full w-full items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 py-1.5 px-2 text-xs sm:text-sm font-medium text-zinc-300 shadow-sm transition-colors hover:bg-zinc-700">
              <Eye className="w-4 h-4 shrink-0" /> <span className="inline">Rincian</span>
            </button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b border-zinc-800 pb-4">
              <DialogTitle>
                Rincian Event: <span className="text-amber-400">{eventTitle}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-2">
              {groupItemsByPrimaryCategory(payload, items).map((group) => (
                <div key={group.categoryName} className="w-full">
                  <div className="w-full flex items-center gap-2 pb-1.5 mb-2.5 border-b border-zinc-800">
                    <span className="w-1.5 h-3.5 bg-amber-400 rounded-full shrink-0" />
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      {group.categoryName}
                    </h4>
                    <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full">
                      {group.items.length} {group.items.length > 1 ? "items" : "item"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {group.items.map((pItem: any, idx: number) => {
                      const realItem = items.find((i) => i.id === pItem.id || i.code === pItem.code);
                      const isCustom = pItem.code === "LAYANAN" || (pItem.id && String(pItem.id).startsWith("custom-"));
                      const modalItemNote = pItem.catatan || pItem.footnote;
                      return (
                        <div key={idx} className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg items-center">
                          {isCustom ? (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-blue-950/40 border border-blue-800/50 rounded-lg flex items-center justify-center text-blue-400">
                              <PlusCircle className="w-6 h-6" />
                            </div>
                          ) : (
                            <ItemThumbnail
                              src={realItem?.imageUrl || pItem.imageUrl}
                              alt={pItem.name}
                              className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg"
                              iconClassName="w-5 h-5 text-zinc-500"
                            />
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-sm text-zinc-100 truncate">{pItem.name}</h5>
                              {pItem.discount === 100 ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                                  FREE / Bonus
                                </span>
                              ) : pItem.discount > 0 ? (
                                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
                                  Disc {pItem.discount}%
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-zinc-500 font-mono">{pItem.code}</p>
                            {modalItemNote && (
                              <p className="text-[10px] text-zinc-400 italic mt-0.5 truncate" title={modalItemNote}>
                                {modalItemNote}
                              </p>
                            )}
                            {pItem.returnedQty > 0 && (
                              <p className="text-[10px] font-bold text-amber-500 mt-1 bg-amber-950/30 w-max px-1.5 py-0.5 rounded">
                                Kembali: {pItem.returnedQty} / {pItem.qty}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex flex-col justify-center">
                            <p className="text-xs text-zinc-400 mb-0.5">
                              {pItem.qty} Unit × {formatRupiah(pItem.price)}
                            </p>
                            <p className="font-bold text-sm text-emerald-400">
                              {formatRupiah(pItem.qty * pItem.price)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 mt-2 pt-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/40 p-4 rounded-xl border">
              <span className="text-sm font-medium text-zinc-400">Total Harga Sewa Keseluruhan:</span>
              <span className="text-xl font-bold text-emerald-400">
                {formatRupiah(payload.reduce((acc: number, cur: any) => acc + cur.qty * cur.price, 0))}
              </span>
            </div>
          </DialogContent>
        </Dialog>

        {(isAdmin || isDummyUser) && (
          <button
            type="button"
            onClick={handleAddOnRental}
            className="flex h-full w-full items-center justify-center gap-1.5 rounded-md border border-emerald-800/80 bg-emerald-950/40 py-1.5 px-2 text-xs sm:text-sm font-medium text-emerald-400 shadow-sm transition-colors hover:bg-emerald-900/60 hover:text-emerald-300"
            title="Tambah Barang Susulan ke Event Ini"
          >
            <Plus className="w-4 h-4 shrink-0" /> <span className="inline">Tambah Barang</span>
          </button>
        )}

        <div className="flex w-full [&_button]:w-full">
          <ReturnRentalDialog items={items} activeEvent={event} />
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onNavigateToEvents}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-800/50 rounded-md text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Buka di Event Management</span>
        </button>
      </div>
    </div>
  );
}

