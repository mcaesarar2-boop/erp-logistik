"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Package } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      // Jika berhasil login, kembalikan ke dashboard lalu segarkan rute
      router.replace("/")
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Package className="h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Login Sistem Logistik</h2>
          <p className="text-sm text-zinc-400">Masukkan kredensial Anda untuk mengakses sistem</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-md text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-100"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-100"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-300 py-2.5 rounded-md font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Memeriksa..." : "Masuk ke Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}