"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PackagePlus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type PackageTemplate = { id: string; name: string };
type Item = { 
  id: string; 
  code: string; 
  name: string; 
  price?: number | null; 
  rentPercentage?: number | null 
};

export function AddToPackageDialog({ 
  item, 
  packages 
}: { 
  item: Item; 
  packages: PackageTemplate[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedPackage, setSelectedPackage] = useState("");
  const [newPackageName, setNewPackageName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [footnote, setFootnote] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDummyUser, setIsDummyUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email?.toLowerCase() === 'mcaesarar@gmail.com') {
          setIsDummyUser(true);
        } else {
          setIsDummyUser(false);
        }
      });
    }
  }, [isOpen]);

  const handleAddToPackage = async () => {
    if (isDummyUser) return alert("Anda tidak bisa mengubah/menghapus/menambahkan item ini, Anda perlu izin!");
    if (mode === 'existing' && !selectedPackage) return alert("Pilih paket terlebih dahulu!");
    if (mode === 'new' && !newPackageName.trim()) return alert("Nama paket baru harus diisi!");
    setLoading(true);

    try {
      const res = await fetch("/api/packages/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: mode === 'existing' ? selectedPackage : undefined,
          newPackageName: mode === 'new' ? newPackageName : undefined,
          quantity: quantity,
          item: {
            id: item.id,
            code: item.code,
            name: item.name,
            price: item.price || 0,
            rentPercentage: item.rentPercentage || 0,
            footnote: footnote,
          },
        }),
      });

      if (res.ok) {
        alert(mode === 'new' ? `Berhasil membuat paket ${newPackageName}!` : `Berhasil menambahkan ${item.name} ke paket!`);
        setIsOpen(false);
        setNewPackageName(""); // reset state agar form bersih pas dibuka lagi
        setFootnote(""); // reset footnote
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambahkan barang.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-md transition-colors"
        title="Tambah ke Paket"
      >
        <PackagePlus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-500" />
              Tambah ke Paket
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Tambahkan <span className="font-semibold text-zinc-200">{item.name}</span> ke dalam paket rental yang sudah ada.
            </p>
            
            <div className="space-y-4">
              {/* TOGGLE TAB MODE */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'existing' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Paket Tersedia
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('new')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'new' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Buat Paket Baru
                </button>
              </div>

              {mode === 'existing' ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Pilih Paket Tujuan
                  </label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                  >
                    <option value="" className="text-zinc-500">-- Pilih Paket Rental --</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Nama Paket Baru
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Paket Wedding A"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Jumlah (Quantity)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Catatan / Footnote (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Digunakan untuk area panggung utama"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={footnote}
                  onChange={(e) => setFootnote(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-4 py-2 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors font-medium text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleAddToPackage} 
                disabled={loading} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Menyimpan..." : "Tambahkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}