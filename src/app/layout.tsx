import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Logistik Pro",
  description: "Sistem Manajemen Aset & Logistik Enterprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <AuthGuard>
          {/* GLOBAL HEADER */}
          <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-100">
                <Package className="h-6 w-6 text-emerald-500" />
                <span className="font-bold text-lg tracking-wide">
                  ERP<span className="text-zinc-500">Logistik</span>
                </span>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* MAIN CONTENT WRAPPER */}
          <div className="flex-1 w-full">
            {children}
          </div>

          {/* GLOBAL FOOTER */}
          <footer className="border-t border-zinc-800 bg-zinc-950 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <Package className="h-5 w-5" />
                <span className="text-sm font-semibold">ERP Logistik Enterprise</span>
              </div>
              <p className="text-sm text-zinc-600">
                &copy; {new Date().getFullYear()} Hak Cipta Dilindungi.
              </p>
              <div className="flex gap-4 text-sm text-zinc-600">
                <a href="#" className="hover:text-zinc-400 transition-colors">Bantuan</a>
                <a href="#" className="hover:text-zinc-400 transition-colors">Kebijakan Privasi</a>
              </div>
            </div>
          </footer>
        </AuthGuard>
      </body>
    </html>
  );
}
