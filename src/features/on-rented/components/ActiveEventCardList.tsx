"use client";

import { Calendar } from "lucide-react";
import { ActiveEventCard } from "./ActiveEventCard";
import type { History, Item } from "../types";

interface ActiveEventCardListProps {
  activeEvents: History[];
  items: Item[];
  isAdmin: boolean;
  isDummyUser: boolean;
  copiedEventId?: string | null;
  onCopyEvent?: (event: History) => void;
  onNavigateToEvents?: () => void;
}

export function ActiveEventCardList({
  activeEvents,
  items,
  isAdmin,
  isDummyUser,
  copiedEventId,
  onCopyEvent,
  onNavigateToEvents,
}: ActiveEventCardListProps) {
  if (activeEvents.length === 0) return null;

  return (
    <div className="mb-10 space-y-4">
      <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
        <Calendar className="w-5 h-5 text-amber-400" /> Daftar Event / Acara Aktif
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeEvents.map((event) => (
          <ActiveEventCard
            key={event.id}
            event={event}
            items={items}
            isAdmin={isAdmin}
            isDummyUser={isDummyUser}
            isCopied={copiedEventId === event.id}
            onCopy={onCopyEvent}
            onNavigateToEvents={onNavigateToEvents}
          />
        ))}
      </div>
    </div>
  );
}

