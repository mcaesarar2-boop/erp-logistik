import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { isDemoEmail } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    // Validasi Akun Dummy di Server (API Route)
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (isDemoEmail(authUser?.email)) {
      return NextResponse.json({ error: "Akses ditolak: Akun Dummy hanya dapat melihat data (Read-Only)." }, { status: 403 });
    }

    const body = await req.json();
    const { packageId, newPackageName, item, quantity = 1 } = body;

    // --- LOGIC BIKIN PAKET BARU ---
    if (newPackageName) {
      const initialPayload = [{ ...item, qty: quantity }];
      const newPkg = await prisma.packageTemplate.create({
        data: {
          name: newPackageName,
          description: "Dibuat cepat melalui dashboard barang",
          payload: JSON.stringify(initialPayload),
        }
      });
      return NextResponse.json({ message: "Paket baru berhasil dibuat", data: newPkg }, { status: 200 });
    }

    // --- LOGIC TAMBAH KE PAKET EXISTING ---
    if (!packageId) return NextResponse.json({ error: "Data paket tidak lengkap" }, { status: 400 });

    // 1. Ambil data paket yang dipilih
    const pkg = await prisma.packageTemplate.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    // 2. Parse payload dari JSON string ke Array (Dilengkapi pengaman)
    let payload = [];
    try {
      payload = pkg.payload ? JSON.parse(pkg.payload) : [];
    } catch (e) {
      payload = []; // Fallback aman jika string payload di DB rusak/bukan JSON
    }

    // 3. Cek apakah item sudah ada di dalam paket tersebut
    const existingIndex = payload.findIndex((i: any) => i.id === item.id);
    if (existingIndex !== -1) {
      // PERBAIKAN: Gunakan "qty" agar cocok dengan EditPackageDialog & RentPackageDialog
      payload[existingIndex].qty = (payload[existingIndex].qty || 0) + quantity;
      if (item.footnote) {
        payload[existingIndex].footnote = item.footnote;
      }
    } else {
      // PERBAIKAN: Gunakan "qty" saat push barang baru
      payload.push({ ...item, qty: quantity });
    }

    // 4. Simpan kembali (update) ke database
    const updatedPackage = await prisma.packageTemplate.update({
      where: { id: packageId },
      data: { payload: JSON.stringify(payload) },
    });

    return NextResponse.json({ message: "Berhasil ditambahkan", data: updatedPackage }, { status: 200 });
  } catch (error) {
    console.error("Gagal menambah barang ke paket:", error);
    return NextResponse.json({ error: "Terjadi kesalahan di server" }, { status: 500 });
  }
}
