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
    const { packageId, newPackageName, item, quantity = 1, discount = 0 } = body;
    const itemDiscount = Math.min(100, Math.max(0, Number(item.discount ?? discount ?? 0)));
    const itemQty = Math.max(1, Number(quantity) || 1);
    const lineId = item.lineId || crypto.randomUUID();

    // --- LOGIC BIKIN PAKET BARU ---
    if (newPackageName) {
      const initialPayload = [{
        lineId,
        id: item.id,
        code: item.code,
        name: item.name,
        imageUrl: item.imageUrl || null,
        price: item.price || 0,
        rentPercentage: item.rentPercentage || 0,
        qty: itemQty,
        discount: itemDiscount,
        footnote: item.footnote || ""
      }];
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
    let payload: any[] = [];
    try {
      payload = pkg.payload ? JSON.parse(pkg.payload) : [];
      if (!Array.isArray(payload)) payload = [];
    } catch (e) {
      payload = []; // Fallback aman jika string payload di DB rusak/bukan JSON
    }

    // Pastikan seluruh baris lama memiliki lineId dan discount
    payload = payload.map((p: any) => ({
      ...p,
      lineId: p.lineId || crypto.randomUUID(),
      discount: Math.min(100, Math.max(0, Number(p.discount) || 0))
    }));

    // 3. Independent Line Items: Jangan auto-merge! Selalu tambahkan baris baru dengan lineId mandiri
    payload.push({
      lineId,
      id: item.id,
      code: item.code,
      name: item.name,
      imageUrl: item.imageUrl || null,
      price: item.price || 0,
      rentPercentage: item.rentPercentage || 0,
      qty: itemQty,
      discount: itemDiscount,
      footnote: item.footnote || ""
    });

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
