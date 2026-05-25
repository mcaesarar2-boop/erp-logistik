"use client"

import { useState, useRef, useEffect } from "react"
import { UserCircle, LogOut, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  // Menutup menu jika user klik di luar area dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Mengambil data email user yang sedang login dari Supabase
  useEffect(() => {
    const fetchUser = async () => {
      // Gunakan getSession agar instan (membaca dari cache browser)
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email)
        setUserName(data.session.user.user_metadata?.full_name || null)
        setUserAvatar(data.session.user.user_metadata?.avatar_url || null)
      }
    }
    fetchUser()

    // Pantau perubahan sesi (sinkronisasi saat logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email)
        setUserName(session.user.user_metadata?.full_name || null)
        setUserAvatar(session.user.user_metadata?.avatar_url || null)
      } else {
        setUserEmail(null)
        setUserName(null)
        setUserAvatar(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Gagal logout:", error)
    } finally {
      window.location.href = "/login"
    }
  }

  if (pathname === "/login") return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-zinc-400 hidden sm:block">
        {userName || (userEmail ? userEmail.split('@')[0] : "Memuat...")}
      </span>
      <div className="relative" ref={menuRef}>
        {/* Ikon User Utama */}
        {userAvatar ? (
          <img 
            src={userAvatar} 
            alt="Profil" 
            className="h-8 w-8 rounded-full object-cover border border-zinc-700 cursor-pointer hover:ring-2 hover:ring-zinc-500 transition-all"
            onClick={() => setIsOpen(!isOpen)}
          />
        ) : (
          <UserCircle 
            className="h-8 w-8 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" 
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
        
        {/* Kotak Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl py-1 z-50">
            <button onClick={() => { setIsOpen(false); router.push("/profile") }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors">
              <User className="h-4 w-4" />
              Profil Saya
            </button>
            <div className="h-px bg-zinc-800 my-1"></div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-2 transition-colors font-medium">
              <LogOut className="h-4 w-4" />
              Keluar (Logout)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}