"use client"

import { useState, useRef, useEffect } from "react"
import { UserCircle, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Gagal logout:", error)
    } finally {
      window.location.href = "/login"
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Ikon User Utama */}
      <UserCircle 
        className="h-8 w-8 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      />
      
      {/* Kotak Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl py-1 z-50">
          <button onClick={() => { setIsOpen(false); alert("Halaman Profil belum dibuat, masih mode coba-coba!") }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors">
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
  )
}