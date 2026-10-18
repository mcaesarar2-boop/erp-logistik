import { supabase } from "@/lib/supabase";
import { isDemoEmail } from "@/shared/constants/permissions";

/**
 * Validasi apakah user yang sedang login adalah akun demo/dummy.
 * Digunakan oleh Server Actions untuk memblokir mutasi database.
 */
export async function validateDummyUser(): Promise<{ success: false; error: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (isDemoEmail(user?.email)) {
    return { 
      success: false, 
      error: "Akses ditolak: Akun Dummy hanya dapat melihat data (Read-Only)." 
    };
  }

  return null;
}

