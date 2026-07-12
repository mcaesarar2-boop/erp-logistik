"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, Session } from "@/lib/supabase"
import { UserCircle, Upload, Save, Lock, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  
  const [isDummyUser, setIsDummyUser] = useState(false)
  // State baru untuk mengelola alur ubah password
  const [updatePasswordStage, setUpdatePasswordStage] = useState<'initial' | 'pending_verification' | 'ready_to_update'>('initial')
  const [isRequestingLink, setIsRequestingLink] = useState(false)

  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
        setName(user.user_metadata?.full_name || "")
        setAvatarUrl(user.user_metadata?.avatar_url || "")
        if (user.email?.toLowerCase() === 'mcaesarar@gmail.com') setIsDummyUser(true)
      }
    }
    fetchUserData()

    // Cek jika user kembali dari link verifikasi email
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setUpdatePasswordStage('ready_to_update')
        showMessage('success', "Verifikasi berhasil! Silakan masukkan password baru Anda.")
      }
      // Jika sesi berubah (misal: logout), reset state
      if (event === "SIGNED_OUT") {
        setUpdatePasswordStage('initial')
        setIsDummyUser(false)
      }
    })

    // Unsubscribe saat komponen di-unmount
    return () => subscription.unsubscribe()
  }, [])

  const showMessage = (type: 'success'|'error', text: string) => {
    setMessage({ type, text })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMessage(null), 5000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDummyUser) {
      alert("Anda tidak bisa mengubah/menghapus/menambahkan item ini, Anda perlu izin!")
      return
    }

    setLoadingProfile(true)
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, avatar_url: avatarUrl }
    })
    
    if (error) showMessage('error', error.message)
    else {
      showMessage('success', "Profil berhasil diperbarui!")
      router.refresh() // Agar UserMenu di Header ikut terupdate
    }
    setLoadingProfile(false)
  }

  // Langkah 1: Kirim link verifikasi ke email
  const handleRequestPasswordUpdate = async () => {
    if (isDummyUser) {
      alert("Anda tidak bisa mengubah/menghapus/menambahkan item ini, Anda perlu izin!")
      return
    }

    setIsRequestingLink(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href, // Arahkan kembali ke halaman profil ini
    })

    if (error) {
      showMessage('error', "Gagal mengirim link: " + error.message)
    } else {
      setUpdatePasswordStage('pending_verification')
      showMessage('success', "Link konfirmasi telah dikirim ke email Anda. Silakan periksa kotak masuk.")
    }
    setIsRequestingLink(false)
  }

  // Langkah 2: Update password setelah verifikasi
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDummyUser) {
      alert("Anda tidak bisa mengubah/menghapus/menambahkan item ini, Anda perlu izin!")
      return
    }

    if (!password || password.length < 6) {
      showMessage('error', "Password minimal 6 karakter.")
      return
    }

    setLoadingPassword(true)
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) showMessage('error', error.message)
    else {
      showMessage('success', "Password berhasil diubah!")
      setPassword("")
      setUpdatePasswordStage('initial') // Kembalikan ke state awal
    }
    setLoadingPassword(false)
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDummyUser) {
      alert("Anda tidak bisa mengubah/menghapus/menambahkan item ini, Anda perlu izin!")
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const file = e.target.files?.[0]
    if (!file) return
    
    // Validasi ukuran maksimal 2MB
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', "Ukuran file terlalu besar. Maksimal 2MB.")
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Kita gunakan bucket item-images yang sudah ada biar praktis
      const { error: uploadError } = await supabase.storage.from('item-images').upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('item-images').getPublicUrl(fileName)
      const newAvatarUrl = data.publicUrl
      
      setAvatarUrl(newAvatarUrl)
      
      // Otomatis simpan ke metadata Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      })
      
      if (updateError) throw updateError
      
      showMessage('success', "Foto profil berhasil diunggah!")
      router.refresh()
    } catch (err: any) {
      showMessage('error', "Gagal mengunggah foto: " + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-zinc-900 rounded-md transition-colors text-zinc-400 hover:text-zinc-100 border border-transparent hover:border-zinc-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Pengaturan Profil</h1>
          <p className="text-sm text-zinc-400">Kelola identitas dan keamanan akun Anda.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' : 'bg-red-950/50 border-red-900 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* KARTU 1: INFO PROFIL & FOTO */}
        <div className="md:col-span-2 space-y-6 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-100 border-b border-zinc-800 pb-3">Data Pribadi</h2>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                {uploadingImage ? (
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="w-16 h-16 text-zinc-500" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-2 -right-2 bg-zinc-100 text-zinc-950 p-2 rounded-full hover:bg-zinc-300 transition-colors shadow-lg border-2 border-zinc-900 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleUploadAvatar} 
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }} 
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-zinc-100">Foto Profil</p>
              <p className="text-xs text-zinc-500 mt-1">Disarankan format kotak (1:1).<br/>Maksimal 2MB.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email Akun (Tidak dapat diubah)</label>
              <input type="email" value={email} disabled className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nama Tampilan</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama Anda..." className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-100" />
            </div>
            <button type="submit" disabled={loadingProfile} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              {loadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Profil
            </button>
          </form>
        </div>

        {/* KARTU 2: GANTI PASSWORD */}
        <div className="space-y-6 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-bold text-zinc-100 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" /> Keamanan
          </h2>
          {updatePasswordStage === 'ready_to_update' ? (
            // Tampilan SETELAH user klik link verifikasi
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Password Baru</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" minLength={6} className="w-full flex h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-100" required autoFocus />
              </div>
              <button type="submit" disabled={loadingPassword || !password} className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50">
                {loadingPassword ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          ) : (
            // Tampilan AWAL
            <>
              <p className="text-xs text-zinc-400">
                {updatePasswordStage === 'pending_verification' 
                  ? "Link verifikasi telah dikirim. Silakan klik link di email Anda untuk melanjutkan."
                  : "Untuk mengubah password, kami akan mengirimkan link verifikasi ke email Anda demi keamanan."
                }
              </p>
              <button onClick={handleRequestPasswordUpdate} disabled={isRequestingLink || updatePasswordStage === 'pending_verification'} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isRequestingLink ? "Mengirim..." : (updatePasswordStage === 'pending_verification' ? "Menunggu Verifikasi..." : "Ubah Password")}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
