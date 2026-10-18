"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import { TimelineRundownView } from "./TimelineRundownView";
import type { EventDetailData } from "../../types";

interface EventTimelineTabProps {
  eventDetail: EventDetailData | null;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function EventTimelineTab({
  eventDetail,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: EventTimelineTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
              Master Timeline & Rundown Terpusat
            </h3>
            <span className="bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Multi-Day Schedule Matrix
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Sistem blocking jadwal panggung terpusat. Mengamankan slot waktu agar Guest Star, Soundcheck, Briefing Kru, dan Gate Open tersinkronisasi tanpa bentrok.
          </p>
        </div>
      </div>

      <TimelineRundownView
        eventDetail={eventDetail}
        isDummyUser={isDummyUser}
        onShowDemoWarning={onShowDemoWarning}
        onUpdateEventDetail={onUpdateEventDetail}
      />
    </div>
  );
}

