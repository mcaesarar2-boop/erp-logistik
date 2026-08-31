export const DEMO_EMAILS = ["mcaesarar@gmail.com"];
export const ADMIN_EMAILS = ["mcaesarar2@gmail.com"];

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  return DEMO_EMAILS.includes(email.toLowerCase().trim());
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function canViewMutationUI(email?: string | null): boolean {
  if (!email) return false;
  return isAdminEmail(email) || isDemoEmail(email);
}

export function canExecuteMutation(email?: string | null): boolean {
  if (!email) return false;
  return isAdminEmail(email) && !isDemoEmail(email);
}

export const DEMO_MESSAGES = {
  default: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Perubahan terhadap data tidak tersedia pada akun ini."
  },
  add: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo dan bersifat read-only. Penambahan data baru dinonaktifkan pada akun ini."
  },
  edit: {
    title: "Read-Only Demo",
    message: "Akun ini disediakan untuk tujuan demonstrasi. Perubahan terhadap data dinonaktifkan pada akun demo."
  },
  delete: {
    title: "Data Aman",
    message: "Aksi penghapusan dinonaktifkan pada akun demo. Tidak ada data yang akan dihapus."
  },
  rental: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo. Pembuatan transaksi sewa dinonaktifkan pada akun ini."
  },
  returnRental: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo. Proses pengembalian aset dinonaktifkan pada akun ini."
  },
  maintenance: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo. Pencatatan pemeliharaan aset dinonaktifkan pada akun ini."
  },
  batch: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo. Format ulang kode aset masal dinonaktifkan pada akun ini."
  },
  profile: {
    title: "Mode Demo",
    message: "Akun yang sedang digunakan adalah akun demo. Perubahan profil dan kata sandi dinonaktifkan pada akun ini."
  }
} as const;
