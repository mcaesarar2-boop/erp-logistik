"use client";

import { RefreshCw } from "lucide-react";

interface SyncEventButtonProps {
  isSyncing: boolean;
  onSync: () => void;
  syncToastMsg?: boolean;
}

export function SyncEventButton({
  isSyncing,
  onSync,
  syncToastMsg,
}: SyncEventButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-zinc-700 shadow-sm whitespace-nowrap disabled:opacity-50"
        title="Sinkronisasi Data & Bersihkan Ghost Events"
      >
        <RefreshCw
          className={`w-4 h-4 ${
            isSyncing ? "animate-spin text-amber-400" : "text-zinc-400"
          }`}
        />
        <span>{isSyncing ? "Menyinkronkan..." : "Sinkronisasi Data"}</span>
      </button>
      {syncToastMsg && (
        <div className="absolute -bottom-8 left-0 right-0 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 text-center animate-in fade-in zoom-in-95 duration-150">
          Data Ter-sinkron!
        </div>
      )}
    </div>
  );
}

