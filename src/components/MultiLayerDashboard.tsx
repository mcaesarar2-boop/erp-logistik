"use client";

import React, { useState, useEffect } from "react";
import { EditItemDialog } from "@/components/EditItemDialog";
import { DeleteItemDialog } from "@/components/DeleteItemDialog";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteCategoryDialog } from "@/components/DeleteCategoryDialog";
import { Search, ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

interface MultiLayerDashboardProps {
  items: Item[];
  categories: Category[];
}

export default function MultiLayerDashboard({ items, categories }: MultiLayerDashboardProps) {
  const [activeLayer, setActiveLayer] = useState<'home' | 'all_items' | 'rented' | 'maintenance'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // CEK ADMIN CLIENT SIDE
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const ADMIN_EMAILS = ["mcaesarar@gmail.com"] // Ganti jika email admin berubah
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

  // --- LOGIKA PENCARIAN SUPER CERDAS ---
  // Memfilter berdasarkan Label (Select Dropdown) DAN Teks Pencarian (Barang/Kode/Label)
  const filteredItems = items.filter(item => {
    const matchCategory = selectedCategory === 'ALL' || item.categories.some(c => c.id === selectedCategory);
    const matchSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categories.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });
    
  // Filter berdasarkan Tab Layer yang aktif (kecuali Home)
  let itemsToDisplay = filteredItems;
  if (activeLayer === 'rented') itemsToDisplay = filteredItems.filter(i => i.rentedQuantity > 0);
  if (activeLayer === 'maintenance') itemsToDisplay = filteredItems.filter(i => i.maintenanceQuantity > 0);

  // --- LOGIKA PENGURUTAN (SORTING) ---
  itemsToDisplay = [...itemsToDisplay].sort((a, b) => {
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
    
    return 0;
  });

  const totalItems = items.length;
  const availableUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  const rentedUnits = items.reduce((acc, item) => acc + item.rentedQuantity, 0);
  const maintenanceUnits = items.reduce((acc, item) => acc + item.maintenanceQuantity, 0);
  
  const totalValuation = items.reduce((acc, item) => {
    const totalQty = item.quantity + item.rentedQuantity + item.maintenanceQuantity;
    return acc + (totalQty * (item.price || 0));
  }, 0);

  const TABS = [
    { id: 'home', label: 'Home (Highlight)' },
    { id: 'all_items', label: 'All Items' },
    { id: 'rented', label: 'On Rented' },
    { id: 'maintenance', label: 'Maintenance' },
  ] as const;

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

      {/* Layer 2: Data Barang (All, Rented, Maintenance) */}
      {activeLayer !== 'home' && (
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
              </select>

              {isAdmin && <AddCategoryDialog />}
              
              {/* Tombol Aksi Kategori hanya muncul jika filter bukan 'ALL' */}
              {isAdmin && selectedCategory !== 'ALL' && currentCategoryObj && (
                <>
                  <EditCategoryDialog category={currentCategoryObj} />
                  <DeleteCategoryDialog category={currentCategoryObj} />
                </>
              )}
            </div>
          </div>

          {/* Render Tabel/List Data Barang */}
          {itemsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsToDisplay.map(item => (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex flex-col min-h-[320px] overflow-hidden shadow-lg">
                  <div className="h-48 w-full bg-zinc-950/50 relative group overflow-hidden border-b border-zinc-800">
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
                        <span key={cat.id} className="inline-flex items-center rounded-md bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-700/50 backdrop-blur-sm">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {item.quantity > 0 && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-emerald-950/80 text-emerald-400 ring-1 ring-emerald-500/30">Tersedia: {item.quantity}</span>
                  )}
                  {item.rentedQuantity > 0 && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-amber-950/80 text-amber-400 ring-1 ring-amber-500/30">Keluar: {item.rentedQuantity}</span>
                  )}
                  {item.maintenanceQuantity > 0 && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider shadow-lg backdrop-blur-md bg-red-950/80 text-red-400 ring-1 ring-red-500/30">MT: {item.maintenanceQuantity}</span>
                  )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-bold truncate text-zinc-100">{item.name}</h2>
                    <p className="text-sm font-mono text-zinc-500 mb-3">{item.code}</p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{item.description || "Tidak ada deskripsi."}</p>
                    
                    {item.createdAt ? (
                      <p className="text-[11px] text-zinc-500 mb-4 font-medium">
                        Ditambahkan: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    ) : (
                      <div className="mb-4"></div>
                    )}
                    
                    <div className="bg-zinc-950/50 rounded-lg p-3 mb-4 border border-zinc-800/50">
                      <p className="text-xs text-zinc-500 mb-1">Valuasi Item (Total Unit x Harga)</p>
                      <p className="text-sm font-bold text-blue-400">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((item.quantity + item.rentedQuantity + item.maintenanceQuantity) * (item.price || 0))}
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-zinc-800/50 pt-4 mt-auto">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <EditItemDialog item={item} allCategories={categories} />
                          <DeleteItemDialog item={item} />
                        </div>
                      )}
                      <div className="text-right">
                    <p className="text-3xl font-black leading-none text-zinc-50">
                      {activeLayer === 'rented' ? item.rentedQuantity : 
                       activeLayer === 'maintenance' ? item.maintenanceQuantity : 
                       (item.quantity + item.rentedQuantity + item.maintenanceQuantity)}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                      {activeLayer === 'all_items' ? 'Total Unit' : 'Unit'}
                    </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 bg-zinc-900/20 rounded-xl border border-zinc-800">
              Tidak ada barang yang ditemukan pada tab dan label ini.
            </div>
          )}
        </div>
      )}

      {/* --- KOTAK POPUP PREVIEW FOTO --- */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="bg-zinc-950/95 border-zinc-800 p-2 rounded-2xl shadow-2xl max-w-4xl flex justify-center items-center">
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
    </div>
  );
}