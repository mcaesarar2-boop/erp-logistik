"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Set default ke true agar layar ditutup loading sebelum selesai dicek
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && pathname !== "/login") {
        // Jika belum login dan mencoba buka dashboard, tendang ke login
        router.replace("/login")
      } else if (session && pathname === "/login") {
        // Jika sudah login tapi iseng buka halaman /login, kembalikan ke dashboard
        router.replace("/")
      } else {
        // Jika aman, buka gembok layar loading
        setIsChecking(false)
      }
    }

    checkAuth()

    // Pantau jika ada perubahan status login (misal dari tab sebelah)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && pathname !== "/login") {
        router.replace("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400 font-medium animate-pulse">Memeriksa akses keamanan...</p>
      </div>
    )
  }

  return <>{children}</>
}