"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EditItemDialog } from "@/components/EditItemDialog";
import { DeleteItemDialog } from "@/components/DeleteItemDialog";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog"; 
import { DeleteCategoryDialog } from "@/components/DeleteCategoryDialog";
import { Search, ArrowUpDown, History as HistoryIcon, Calendar, Trash2, Pencil, Loader2, Printer, PackageSearch, Eye, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from "@/components/ui/dialog";
import { RentalInvoiceDialog } from "@/components/RentalInvoiceDialog";
import { ReturnRentalDialog } from "@/components/ReturnRentalDialog";
import { ReprintInvoiceDialog } from "@/components/ReprintInvoiceDialog";
import { EditPackageDialog } from "@/components/EditPackageDialog";
import { PrintPackageDialog } from "@/components/PrintPackageDialog";
import { updateHistory, deleteHistory, deletePackageTemplate, batchRegenerateCodes } from "@/app/actions";
import { AddToPackageDialog } from "@/components/AddToPackageDialog";

type Category = {
  id: string;
  name: string;
};

type Item = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  rentedQuantity: number;
  maintenanceQuantity: number;
  status: string;
  imageUrl?: string | null;
  categories: Category[];
  price?: number | null;
  rentPercentage?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type History = {
  id: string;
  type: string;
  date: Date | string;
  description: string | null;
  payload: string | null;
  createdAt: Date | string;
};

type PackageTemplate = {
  id: string;
  name: string;
  description: string | null;
  payload: string;
};

interface MultiLayerDashboardProps {
  items: Item[];
  categories: Category[];
  histories: History[];
  packages: PackageTemplate[];
}

export default function MultiLayerDashboard({ items, categories, histories, packages }: MultiLayerDashboardProps) {
  const [activeLayer, setActiveLayer] = useState<'home' | 'all_items' | 'rented' | 'maintenance' | 'history' | 'packages'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // State untuk Fitur Edit & Delete History
  const [editingHistory, setEditingHistory] = useState<History | null>(null);
  const [deletingHistory, setDeletingHistory] = useState<History | null>(null);
  const [isHistoryActionLoading, setIsHistoryActionLoading] = useState(false);
  const [deletingPackage, setDeletingPackage] = useState<PackageTemplate | null>(null);
  const [addingToCartPkg, setAddingToCartPkg] = useState<PackageTemplate | null>(null);
  const [cartSuccessMsg, setCartSuccessMsg] = useState(false);
  
  // State untuk Batch Update Kode
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // CEK ADMIN CLIENT SIDE
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      // TODO: [KEAMANAN] Pindahkan daftar email admin ke environment variables (.env.local) untuk production.
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"]
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) {
        setIsAdmin(true)
      }
    })
  }, [])

  // Temukan objek kategori saat ini
  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  // Reset filter kembali ke 'ALL' jika kategori yang terpilih terhapus dari database
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !currentCategoryObj) {
      setSelectedCategory('ALL');
    }
  }, [categories, selectedCategory, currentCategoryObj]);

  // Reset pagination saat filter, pencarian, sort atau tab berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [activeLayer, selectedCategory, searchQuery, sortBy]);

  // --- LOGIKA PENCARIAN SUPER CERDAS ---
  // Memfilter berdasarkan Label (Select Dropdown) DAN Teks Pencarian (Barang/Kode/Label)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.categories.some(c => c.id === selectedCategory);
      const matchSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categories.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);
    
  // Filter berdasarkan Tab Layer yang aktif (kecuali Home)
  const itemsToDisplay = useMemo(() => {
    let displayItems = filteredItems;
    if (activeLayer === 'rented') displayItems = displayItems.filter(i => i.rentedQuantity > 0);
    if (activeLayer === 'maintenance') displayItems = displayItems.filter(i => i.maintenanceQuantity > 0);

    // --- LOGIKA PENGURUTAN (SORTING) ---
    return [...displayItems].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      
      if (sortBy === 'date_modified_desc') {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Terbaru di atas
      }
      
      if (sortBy === 'date_modified_asc') {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateA - dateB; // Terlama di atas
      }

      // Dapatkan nilai kuantitas yang relevan dengan tab yang sedang aktif
      const getQty = (item: Item) => {
        if (activeLayer === 'rented') return item.rentedQuantity;
        if (activeLayer === 'maintenance') return item.maintenanceQuantity;
        return item.quantity + item.rentedQuantity + item.maintenanceQuantity;
      };
      
      const qtyA = getQty(a);
      const qtyB = getQty(b);
      
      if (sortBy === 'qty_highest') return qtyB - qtyA;
      if (sortBy === 'qty_lowest') return qtyA - qtyB;
      
      if (sortBy === 'price_highest') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'price_lowest') return (a.price || 0) - (b.price || 0);
      
      return 0;
    });
  }, [filteredItems, activeLayer, sortBy]);

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = itemsToDisplay.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(itemsToDisplay.length / itemsPerPage);

  const totalItems = items.length;

  const { availableUnits, rentedUnits, maintenanceUnits, totalValuation } = useMemo(() => {
    return items.reduce((acc, item) => {
      const totalQty = item.quantity + item.rentedQuantity + item.maintenanceQuantity;
      return {
        availableUnits: acc.availableUnits + item.quantity,
        rentedUnits: acc.rentedUnits + item.rentedQuantity,
        maintenanceUnits: acc.maintenanceUnits + item.maintenanceQuantity,
        totalValuation: acc.totalValuation + (totalQty * (item.price || 0))
      };
    }, { availableUnits: 0, rentedUnits: 0, maintenanceUnits: 0, totalValuation: 0 });
  }, [items]);

  // --- Active Events Logic ---
  const activeEvents = useMemo(() => {
    return histories.filter(h => 
      h.type === 'INVOICE_RENTAL' && 
      h.description?.includes('Event:') && 
      !h.description?.includes('[SELESAI]')
    );
  }, [histories]);

  const TABS = [
    { id: 'home', label: 'Home (Highlight)' },
    { id: 'all_items', label: 'All Items' },
    { id: 'rented', label: 'On Rented' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'history', label: 'Riwayat Transaksi' },
    { id: 'packages', label: 'Katalog Paket' },
  ] as const;

  // FUNGSI AKSI HISTORY
  const handleUpdateHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingHistory) return;
    setIsHistoryActionLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateHistory(editingHistory.id, formData);
    setIsHistoryActionLoading(false);
    setEditingHistory(null);
  }

  const handleDeleteHistory = async () => {
    if (!deletingHistory) return;
    setIsHistoryActionLoading(true);
    await deleteHistory(deletingHistory.id);
    setIsHistoryActionLoading(false);
    setDeletingHistory(null);
  }

  const handleDeletePackage = async () => {
    if (!deletingPackage) return;
    setIsHistoryActionLoading(true);
    await deletePackageTemplate(deletingPackage.id);
    setIsHistoryActionLoading(false);
    setDeletingPackage(null);
  }

  const handleBatchRegenerate = async () => {
    setIsBatchLoading(true);
    const res = await batchRegenerateCodes();
    setIsBatchLoading(false);
    if (res?.success) {
      setShowBatchDialog(false);
    } else {
      alert(res?.error || "Gagal memperbarui kode masal.");
    }
  };

  return (
    <div className="w-full">
      {/* Navigasi Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="flex gap-4 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLayer(tab.id)}
              className={`py-3 px-4 whitespace-nowrap font-semibold text-sm transition-colors ${
                activeLayer === tab.id
                  ? 'border-b-2 border-zinc-100 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Layer 1: Home (Highlight) */}
      {activeLayer === 'home' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-zinc-100">Ringkasan Sistem Logistik</h2>
          
          <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Valuasi Seluruh Aset</p>
              <p className="text-4xl font-bold text-blue-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalValuation)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Jenis Aset</p>
              <p className="text-3xl font-bold text-zinc-50">{totalItems}</p>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit Tersedia</p>
              <p className="text-3xl font-bold text-emerald-400">{availableUnits}</p>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit Rented</p>
              <p className="text-3xl font-bold text-amber-400">{rentedUnits}</p>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Unit MT</p>
              <p className="text-3xl font-bold text-red-500">{maintenanceUnits}</p>
            </div>
          </div>

        </div>
      )}

      {/* Layer 2.5: Riwayat Transaksi */}
      {activeLayer === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <HistoryIcon className="w-6 h-6 text-zinc-400" />
            <h2 className="text-xl font-bold text-zinc-100">Catatan Riwayat & Invoice</h2>
          </div>

          {histories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {histories.map((hist) => {
                const payloadData = hist.payload ? JSON.parse(hist.payload) : [];
                const totalTagihan = payloadData.reduce((acc: number, cur: any) => acc + (cur.price * cur.qty), 0);

                return (
                  <div key={hist.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">{new Date(hist.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-100 mb-1 line-clamp-2">{hist.description}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 shrink-0 md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity z-10">
                          {/* Tombol Cetak Ulang hanya muncul untuk tipe Invoice Rental */}
                          {hist.type === 'INVOICE_RENTAL' && (
                            <ReprintInvoiceDialog history={hist}>
                              <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-md transition-colors shadow-sm" title="Cetak Ulang Invoice">
                                <Printer className="w-4 h-4" />
                              </button>
                            </ReprintInvoiceDialog>
                          )}
                          <button onClick={() => setEditingHistory(hist)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors shadow-sm"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeletingHistory(hist)} className="p-2 bg-red-950/50 hover:bg-red-900 text-red-400 rounded-md transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 max-h-32 overflow-y-auto">
                      {payloadData.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start text-xs py-1 border-b border-zinc-800/50 last:border-0 gap-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-zinc-300 truncate">{d.name} <span className="text-zinc-600">({d.code})</span></span>
                            {d.footnote && <span className="text-[10px] text-zinc-500 italic truncate" title={d.footnote}>{d.footnote}</span>}
                          </div>
                          <span className="font-bold text-emerald-400 shrink-0 mt-0.5">{d.qty} Unit x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.price)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Tercatat: {new Date(hist.createdAt).toLocaleTimeString('id-ID')}</span>
                      <span className="text-sm font-bold text-zinc-100">Total: <span className="text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalTagihan)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
              Belum ada catatan riwayat transaksi.
            </div>
          )}
        </div>
      )}

      {/* Layer 2.6: Katalog Paket */}
      {activeLayer === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <PackageSearch className="w-6 h-6 text-zinc-400" />
            <h2 className="text-xl font-bold text-zinc-100">Katalog Paket Rental</h2>
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const payloadData = pkg.payload ? JSON.parse(pkg.payload) : [];
                
                const totalPackageRent = payloadData.reduce((acc: number, pItem: any) => {
                  const itemDetail = items.find(i => i.id === pItem.id);
                  if (!itemDetail) return acc;
                  const rentPrice = ((itemDetail.price || 0) * (itemDetail.rentPercentage || 0)) / 100;
                  return acc + (rentPrice * pItem.qty);
                }, 0);

                const packageItems = payloadData
                  .map((pItem: any) => items.find(i => i.id === pItem.id))
                  .filter((item: Item | undefined): item is Item => !!item);

                return (
                  <div key={pkg.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col relative group">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-blue-400 mb-1 line-clamp-2">{pkg.name}</h3>
                        <p className="text-xs text-zinc-500 line-clamp-1">{pkg.description || 'Tidak ada deskripsi paket.'}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 shrink-0 md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity z-10">
                          <EditPackageDialog pkg={pkg} items={items} />
                          <button onClick={() => setDeletingPackage(pkg)} className="p-2 bg-red-950/50 hover:bg-red-900 text-red-400 rounded-md transition-colors shadow-sm" title="Hapus Paket"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-950/50 rounded-lg p-2 border border-zinc-800/50 max-h-40 overflow-y-auto mb-4 space-y-1">
                      {packageItems.map((item: Item, idx: number) => {
                        const pkgItemData = payloadData.find((p:any) => p.id === item.id);
                        return (
                        <div key={idx} className="flex justify-between items-start text-xs py-1.5 border-b border-zinc-800/50 last:border-0 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {item.imageUrl ? (
                               <div 
                                 className="w-7 h-7 rounded border border-zinc-700 overflow-hidden shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                                 onClick={() => setSelectedImage(item.imageUrl!)}
                                 title="Lihat Foto"
                               >
                                 <img src={item.imageUrl} className="w-full h-full object-cover" alt="thumb" />
                               </div>
                            ) : (
                               <div className="w-7 h-7 rounded border border-zinc-800 bg-zinc-900 shrink-0 flex items-center justify-center text-[8px] text-zinc-600">
                                  N/A
                               </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-zinc-300 truncate">{item.name}</span>
                              {pkgItemData?.footnote && (
                                <span className="text-[10px] text-zinc-500 italic truncate" title={pkgItemData.footnote}>{pkgItemData.footnote}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-zinc-400 shrink-0 bg-zinc-900 px-2 py-0.5 rounded mt-0.5">{pkgItemData?.qty || 0} Unit</span>
                        </div>
                      )})}
                    </div>

                    <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Harga Sewa</span>
                        <span className="text-lg font-bold text-emerald-400 leading-none">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPackageRent)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PrintPackageDialog pkg={pkg} items={items} />
                        <button
                          onClick={() => setAddingToCartPkg(pkg)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <ShoppingCart className="w-4 h-4 shrink-0" />
                          <span className="hidden sm:inline">Ke Keranjang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
              Belum ada template paket yang dibuat. Silakan buat melalui tombol "Bikin Paket".
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Data Barang (All, Rented, Maintenance) */}
      {activeLayer !== 'home' && activeLayer !== 'history' && activeLayer !== 'packages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-zinc-100">
              {activeLayer === 'all_items' && 'Semua Barang'}
              {activeLayer === 'rented' && 'Barang Sedang Keluar (Rented)'}
              {activeLayer === 'maintenance' && 'Barang Dalam Pemeliharaan'}
            </h2>
            
            {/* Fitur Filter Kategori */}
            <div className="flex items-center gap-3 bg-zinc-900/50 p-2 px-3 rounded-lg border border-zinc-800 shadow-sm flex-wrap">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari barang atau label..."
                className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 w-32 focus:w-48 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              <select
                id="categoryFilter"
                className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5 max-w-[140px] truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">-- Semua Label --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              
              <ArrowUpDown className="w-4 h-4 text-zinc-500 hidden sm:block" />
              <select
                className="bg-zinc-950 text-zinc-100 text-sm border border-zinc-700 rounded-md outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer p-1.5"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name_asc">Abjad (A-Z)</option>
                <option value="name_desc">Abjad (Z-A)</option>
                <option value="qty_highest">Terbanyak</option>
                <option value="qty_lowest">Paling Sedikit</option>
                <option value="date_modified_desc">Terbaru Diubah</option>
                <option value="date_modified_asc">Terlama Diubah</option>
                <option value="price_highest">Harga Tertinggi</option>
                <option value="price_lowest">Harga Terendah</option>
              </select>

              {isAdmin && <AddCategoryDialog />}
              
              {/* Tombol Aksi Kategori hanya muncul jika filter bukan 'ALL' */}
              {isAdmin && selectedCategory !== 'ALL' && currentCategoryObj && (
                <>
                  <EditCategoryDialog category={currentCategoryObj} />
                  <DeleteCategoryDialog category={currentCategoryObj} />
                </>
              )}
              
              {/* Tombol Rincian Rental Khusus di Tab On Rented */}
              {activeLayer === 'rented' && (
                <>
                  <div className="w-px h-4 bg-zinc-700 mx-1 hidden sm:block"></div>
                  <ReturnRentalDialog items={itemsToDisplay} />
                  <RentalInvoiceDialog items={itemsToDisplay} />
                </>
              )}

              {/* TAMPILKAN TOMBOL BATCH RAPIKAN KODE JIKA DI TAB ALL ITEMS */}
              {isAdmin && activeLayer === 'all_items' && (
                <>
                  <div className="w-px h-4 bg-zinc-700 mx-1 hidden sm:block"></div>
                  <button
                    onClick={() => setShowBatchDialog(true)}
                    className="flex items-center gap-2 bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-indigo-900 shadow-sm whitespace-nowrap"
                  >
                    Rapikan Semua Kode
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tampilan Khusus Grouping Event di Tab Rented */}
          {activeLayer === 'rented' && activeEvents.length > 0 && (
            <div className="mb-10 space-y-4">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2"><Calendar className="w-5 h-5 text-amber-400" /> Daftar Event / Acara Aktif</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEvents.map(event => {
                  const payload = event.payload ? JSON.parse(event.payload) : [];
                  const activeItems = payload.filter((p: any) => (p.qty - (p.returnedQty || 0)) > 0);
                  if (activeItems.length === 0) return null; // Fallback aman

                  return (
                    <div key={event.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col shadow-sm group relative">
                      <h4 className="font-bold text-amber-400 mb-1 line-clamp-1" title={event.description || ""}>{event.description?.split('|')[0].replace('Event:', '').trim()}</h4>
                      <p className="text-xs text-zinc-500 mb-4">{new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                      
                      <div className="flex-1 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 mb-4 max-h-32 overflow-y-auto space-y-2">
                        {activeItems.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-800/50 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-zinc-300 truncate pr-2 flex-1">{p.name}</span>
                            <span className="text-amber-400 font-bold shrink-0 bg-amber-950/30 px-2 py-0.5 rounded">{p.qty - (p.returnedQty || 0)} Unit</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-col xl:flex-row gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="w-full xl:flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 rounded-md transition-colors border border-zinc-700 flex items-center justify-center shrink-0 text-sm font-medium gap-2 shadow-sm">
                               <Eye className="w-4 h-4" /> <span className="inline">Rincian</span>
                            </button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                             <DialogHeader className="shrink-0 border-b border-zinc-800 pb-4">
                               <DialogTitle>
                                 Rincian Event: <span className="text-amber-400">{event.description?.split('|')[0].replace('Event:', '').trim()}</span>
                               </DialogTitle>
                             </DialogHeader>
                             <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-2">
                               {payload.map((pItem: any, idx: number) => {
                                  const realItem = items.find(i => i.id === pItem.id || i.code === pItem.code);
                                  return (
                                     <div key={idx} className="flex gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg items-center">
                                        <div className="w-16 h-16 shrink-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden flex items-center justify-center">
                                           {realItem?.imageUrl ? (
                                              <img src={realItem.imageUrl} alt={pItem.name} className="w-full h-full object-cover" />
                                           ) : (
                                              <span className="text-[10px] text-zinc-600 font-bold">NO IMG</span>
                                           )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                           <h5 className="font-bold text-sm text-zinc-100 truncate">{pItem.name}</h5>
                                           <p className="text-xs text-zinc-500">{pItem.code}</p>
                                           {pItem.footnote && <p className="text-[10px] text-zinc-400 italic mt-0.5 truncate" title={pItem.footnote}>{pItem.footnote}</p>}
                                           {(pItem.returnedQty > 0) && (
                                              <p className="text-[10px] font-bold text-amber-500 mt-1 bg-amber-950/30 w-max px-1.5 py-0.5 rounded">Kembali: {pItem.returnedQty} / {pItem.qty}</p>
                                           )}
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col justify-center">
                                           <p className="text-xs text-zinc-400 mb-0.5">{pItem.qty} Unit × {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pItem.price)}</p>
                                           <p className="font-bold text-sm text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pItem.qty * pItem.price)}</p>
                                        </div>
                                     </div>
                                  )
                               })}
                             </div>
                             <div className="shrink-0 mt-2 pt-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/40 p-4 rounded-xl border">
                               <span className="text-sm font-medium text-zinc-400">Total Harga Sewa Keseluruhan:</span>
                               <span className="text-xl font-bold text-emerald-400">
                                 {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(payload.reduce((acc: number, cur: any) => acc + (cur.qty * cur.price), 0))}
                               </span>
                             </div>
                          </DialogContent>
                        </Dialog>
                        <div className="w-full xl:flex-1 flex [&_button]:w-full">
                          <ReturnRentalDialog items={itemsToDisplay} activeEvent={event} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeLayer === 'rented' && <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2 mb-4 mt-6">Akumulasi Seluruh Barang Keluar (Flat List)</h3>}

          {/* Render Tabel/List Data Barang */}
          {itemsToDisplay.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {currentItems.map(item => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex flex-col min-h-[250px] sm:min-h-[320px] overflow-hidden shadow-lg">
                  <div className="h-32 sm:h-48 w-full bg-zinc-950/50 relative group overflow-hidden border-b border-zinc-800">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        onClick={() => setSelectedImage(item.imageUrl!)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                        <span className="text-xs font-bold uppercase tracking-widest border border-zinc-800 px-3 py-1 rounded-full">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]">
                      {item.categories?.map(cat => (
                        <span key={cat.id} className="inline-flex items-center rounded-md bg-zinc-950/80 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-700/50 backdrop-blur-sm">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 items-end">
                  {item.quantity > 0 && (
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-emerald-950/80 text-emerald-400 ring-1 ring-emerald-500/30"><span className="hidden sm:inline">Tersedia: </span>{item.quantity}</span>
                  )}
                  {item.rentedQuantity > 0 && (
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-amber-950/80 text-amber-400 ring-1 ring-amber-500/30"><span className="hidden sm:inline">Keluar: </span>{item.rentedQuantity}</span>
                  )}
                  {item.maintenanceQuantity > 0 && (
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-red-950/80 text-red-400 ring-1 ring-red-500/30">MT: {item.maintenanceQuantity}</span>
                  )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-5 flex flex-col flex-1">
                    <h2 
                      className="text-base sm:text-xl font-bold truncate text-zinc-100 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => setSelectedItemDetail(item)}
                      title="Lihat Detail"
                    >
                      {item.name}
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-zinc-500 mb-2 sm:mb-3">{item.code}</p>
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-2 hidden sm:block">{item.description || "Tidak ada deskripsi."}</p>
                    
                    {item.createdAt ? (
                      <p className="text-[9px] sm:text-[11px] text-zinc-500 mb-2 sm:mb-4 font-medium hidden sm:block">
                        Ditambahkan: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    ) : (
                      <div className="mb-2 sm:mb-4 hidden sm:block"></div>
                    )}
                    
                    <div className="bg-zinc-950/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-zinc-800/50">
                      <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 border-b border-zinc-800/50 pb-1 mb-1.5 sm:mb-2">Valuasi Item</p>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[9px] sm:text-[11px] text-zinc-500">Satuan</p>
                        <p className="text-[10px] sm:text-xs font-medium text-zinc-300">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price || 0)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mb-1 hidden sm:flex">
                        <p className="text-[9px] sm:text-[11px] text-zinc-500">Total</p>
                        <p className="text-[10px] sm:text-xs font-bold text-blue-400">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((item.quantity + item.rentedQuantity + item.maintenanceQuantity) * (item.price || 0))}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-1 sm:mt-0">
                        <p className="text-[9px] sm:text-[11px] text-zinc-500">Sewa <span className="hidden sm:inline">({item.rentPercentage || 0}%)</span></p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-400">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(((item.price || 0) * (item.rentPercentage || 0)) / 100)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-end border-t border-zinc-800/50 pt-3 sm:pt-4 mt-auto gap-3 sm:gap-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => setSelectedItemDetail(item)}
                          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border border-zinc-700 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> <span className="inline">Detail</span>
                        </button>
                        {isAdmin && (
                          <>
                            <EditItemDialog item={item} allCategories={categories} />
                            <DeleteItemDialog item={item} />
                            <AddToPackageDialog item={item} packages={packages} />
                          </>
                        )}
                      </div>
                      <div className="flex items-center sm:block w-full justify-between sm:text-right">
                        <p className="text-[10px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block sm:hidden">
                          {activeLayer === 'all_items' ? 'Total Unit' : 'Unit'}:
                        </p>
                        <div className="flex flex-col items-end">
                          <p className="text-xl sm:text-3xl font-black leading-none text-zinc-50">
                            {activeLayer === 'rented' ? item.rentedQuantity : 
                             activeLayer === 'maintenance' ? item.maintenanceQuantity : 
                             (item.quantity + item.rentedQuantity + item.maintenanceQuantity)}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1 hidden sm:block">
                            {activeLayer === 'all_items' ? 'Total Unit' : 'Unit'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 border-t border-zinc-800 pt-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span>Menampilkan</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer"
                  >
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                    <option value={50}>50</option>
                  </select>
                  <span>dari {itemsToDisplay.length} aset</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Sebelumnya
                  </button>
                  <span className="text-sm text-zinc-400 px-2 font-medium">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Selanjutnya
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
              Tidak ada barang yang ditemukan pada tab dan label ini.
            </div>
          )}
        </div>
      )}

      {/* --- KOTAK POPUP PREVIEW FOTO --- */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950/95 border-zinc-800 p-2 rounded-2xl shadow-2xl max-w-4xl flex justify-center items-center">
          <DialogTitle className="sr-only">Preview Foto Aset</DialogTitle>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* --- KOTAK POPUP DETAIL ASET --- */}
      <Dialog open={!!selectedItemDetail} onOpenChange={(open) => !open && setSelectedItemDetail(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogTitle className="sr-only">Detail Aset</DialogTitle>
          {selectedItemDetail && (
            <>
              <div className="relative h-48 sm:h-64 bg-zinc-900 border-b border-zinc-800 shrink-0">
                {selectedItemDetail.imageUrl ? (
                  <img 
                    src={selectedItemDetail.imageUrl} 
                    alt={selectedItemDetail.name} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(selectedItemDetail.imageUrl!)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <span className="text-sm font-bold uppercase tracking-widest border border-zinc-800 px-4 py-2 rounded-full">No Image</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {selectedItemDetail.categories?.map(cat => (
                    <span key={cat.id} className="inline-flex items-center rounded-md bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-700/50 backdrop-blur-sm">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="flex flex-col gap-1 mb-4 border-b border-zinc-800/50 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">{selectedItemDetail.name}</h2>
                  <p className="text-sm font-mono text-zinc-400">{selectedItemDetail.code}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status Ketersediaan</p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-900/30 px-3 py-2 rounded-md">
                          <span className="text-sm text-zinc-300">Tersedia (Gudang)</span>
                          <span className="font-bold text-emerald-400">{selectedItemDetail.quantity} Unit</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/30 px-3 py-2 rounded-md">
                          <span className="text-sm text-zinc-300">Sedang Keluar (Rental)</span>
                          <span className="font-bold text-amber-400">{selectedItemDetail.rentedQuantity} Unit</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-md">
                          <span className="text-sm text-zinc-300">Maintenance (MT)</span>
                          <span className="font-bold text-red-400">{selectedItemDetail.maintenanceQuantity} Unit</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-md mt-1">
                          <span className="text-sm font-bold text-zinc-100">Total Keseluruhan</span>
                          <span className="font-black text-zinc-50">{selectedItemDetail.quantity + selectedItemDetail.rentedQuantity + selectedItemDetail.maintenanceQuantity} Unit</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Informasi Valuasi & Harga</p>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Harga Beli Satuan</span>
                          <span className="text-sm font-medium text-zinc-200">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedItemDetail.price || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Persentase Sewa</span>
                          <span className="text-sm font-medium text-zinc-200">{selectedItemDetail.rentPercentage || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                          <span className="text-sm font-bold text-zinc-300">Harga Sewa Satuan</span>
                          <span className="text-sm font-bold text-emerald-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(((selectedItemDetail.price || 0) * (selectedItemDetail.rentPercentage || 0)) / 100)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                          <span className="text-sm font-bold text-zinc-300">Total Valuasi Aset</span>
                          <span className="text-sm font-bold text-blue-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((selectedItemDetail.quantity + selectedItemDetail.rentedQuantity + selectedItemDetail.maintenanceQuantity) * (selectedItemDetail.price || 0))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Deskripsi Aset</p>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3 text-sm text-zinc-300 min-h-[60px] whitespace-pre-wrap">
                    {selectedItemDetail.description || <span className="text-zinc-500 italic">Tidak ada deskripsi.</span>}
                  </div>
                </div>
                
                {selectedItemDetail.createdAt && (
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-6 text-center">
                    Ditambahkan ke sistem pada: {new Date(selectedItemDetail.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 flex justify-end gap-2">
                <button 
                  onClick={() => setSelectedItemDetail(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-800"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP EDIT & DELETE HISTORY (INLINE UNTUK PERFORMA CEPAT) */}
      <Dialog open={!!editingHistory} onOpenChange={(open) => !open && setEditingHistory(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle>Ubah Riwayat Transaksi</DialogTitle>
          <form onSubmit={handleUpdateHistory} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Tanggal Faktur</label>
              <input type="date" name="date" defaultValue={editingHistory?.date ? new Date(editingHistory.date).toISOString().split('T')[0] : ''} className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Catatan / Deskripsi</label>
              <input type="text" name="description" defaultValue={editingHistory?.description || ''} className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100" required />
            </div>
            <button type="submit" disabled={isHistoryActionLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-md font-medium flex justify-center items-center gap-2">
              {isHistoryActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingHistory} onOpenChange={(open) => !open && setDeletingHistory(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-red-400">Hapus Riwayat Transaksi?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">Apakah Anda yakin ingin menghapus catatan riwayat faktur <strong>"{deletingHistory?.description}"</strong>? (Data barang di gudang tidak akan berubah, hanya menghilangkan catatannya saja).</p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => setDeletingHistory(null)} className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md">Batal</button>
            <button onClick={handleDeleteHistory} disabled={isHistoryActionLoading} className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-md flex justify-center items-center">
              {isHistoryActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP DELETE PAKET */}
      <Dialog open={!!deletingPackage} onOpenChange={(open) => !open && setDeletingPackage(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-red-400">Hapus Template Paket?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">Apakah Anda yakin ingin menghapus template paket <strong>"{deletingPackage?.name}"</strong>? (Tindakan ini tidak bisa dibatalkan).</p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => setDeletingPackage(null)} className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md">Batal</button>
            <button onClick={handleDeletePackage} disabled={isHistoryActionLoading} className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-md flex justify-center items-center">
              {isHistoryActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP BATCH REGENERATE KODE */}
      <Dialog open={showBatchDialog} onOpenChange={(open) => !open && setShowBatchDialog(false)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-indigo-400">Format Ulang Semua Kode Aset?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Tindakan ini akan <strong>mengubah seluruh kode aset saat ini</strong> secara otomatis menggunakan format baru (Contoh: <code>AUD-BCL-001</code>) berdasarkan label yang terpasang pada masing-masing barang.
          </p>
          <div className="bg-amber-950/50 border border-amber-900/50 p-3 rounded-md mt-4">
            <p className="text-sm text-amber-400 font-medium">Perhatian:</p>
            <p className="text-xs text-amber-500/80 mt-1">
              Jika Anda sudah mencetak label barcode/QR fisik menggunakan kode lama, fisik label tersebut tidak akan sinkron lagi dengan sistem setelah proses ini. Pastikan Anda siap mencetak ulang label jika diperlukan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => setShowBatchDialog(false)} className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md">Batal</button>
            <button onClick={handleBatchRegenerate} disabled={isBatchLoading} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex justify-center items-center">
              {isBatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Format Ulang"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP KONFIRMASI KE KERANJANG */}
      <Dialog open={!!addingToCartPkg} onOpenChange={(open) => !open && setAddingToCartPkg(null)}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50">
          <DialogTitle className="text-emerald-400 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Masukkan ke Keranjang?
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Apakah Anda yakin ingin memasukkan seluruh aset dari paket <strong>"{addingToCartPkg?.name}"</strong> ke Keranjang Kasir?
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => setAddingToCartPkg(null)} className="h-10 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors">Batal</button>
            <button
              onClick={() => {
                if (addingToCartPkg) {
                  window.dispatchEvent(new CustomEvent('add-to-pos-cart', { detail: { pkgId: addingToCartPkg.id } }));
                  setAddingToCartPkg(null);
                  setCartSuccessMsg(true); // Tampilkan popup sukses
                }
              }}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex justify-center items-center transition-colors font-medium"
            >
              Ya, Masukkan
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KOTAK POPUP SUKSES MASUK KERANJANG */}
      <Dialog open={cartSuccessMsg} onOpenChange={setCartSuccessMsg}>
        <DialogContent aria-describedby={undefined} className="bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-sm flex flex-col items-center justify-center p-6 text-center">
          <DialogTitle className="sr-only">Sukses</DialogTitle>
          <div className="w-12 h-12 rounded-full bg-emerald-950/50 flex items-center justify-center mb-2 border border-emerald-900">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Berhasil!</h3>
          <p className="text-sm text-zinc-400 mt-2">Seluruh aset telah dimasukkan ke Keranjang Kasir. Silakan buka Keranjang untuk memproses.</p>
          <button onClick={() => setCartSuccessMsg(false)} className="mt-6 w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md border border-zinc-800 transition-colors font-medium">Tutup</button>
        </DialogContent>
      </Dialog>

    </div>
  );
}