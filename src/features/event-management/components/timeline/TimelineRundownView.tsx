"use client";

import React, { useState } from "react";
import { Clock, Plus, Calendar, ListChecks, Trash2, Volume2, Users, DoorOpen, Coffee, Mic } from "lucide-react";
import { formatSlotRange, getSlotRangeText } from "@/shared/lib/formatters";
import { EVENT_TIME_SLOTS } from "@/shared/constants/timeline";
import { AddAgendaDialog } from "./AddAgendaDialog";
import { deleteEventTimelineItem } from "../../actions";
import type { EventDetailData, EventTimelineItemData } from "../../types";

interface TimelineRundownViewProps {
  eventDetail: EventDetailData | null;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function TimelineRundownView({
  eventDetail,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: TimelineRundownViewProps) {
  const [filterDay, setFilterDay] = useState<number>(1);
  const [isAddAgendaOpen, setIsAddAgendaOpen] = useState(false);
  const [selectedInitialSlots, setSelectedInitialSlots] = useState<string[]>([]);

  const currentDayItems = (eventDetail?.timelineItems || [])
    .filter(item => item.dayNumber === filterDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const occupiedMap = React.useMemo(() => {
    const map: { [slot: string]: EventTimelineItemData } = {};
    if (!eventDetail?.timelineItems) return map;
    eventDetail.timelineItems.forEach(item => {
      if (item.dayNumber !== filterDay) return;
      (item.slots || []).forEach(slot => {
        map[slot] = item;
      });
    });
    return map;
  }, [eventDetail, filterDay]);

  const totalOccupiedSlotsCount = Object.keys(occupiedMap).length;
  const totalFreeSlotsCount = Math.max(0, EVENT_TIME_SLOTS.length - totalOccupiedSlotsCount);

  const guestStarsInDay = (eventDetail?.guestStars || []).filter(
    gs => (gs.dayNumber || 1) === filterDay
  );

  const handleDeleteTimelineItem = async (timelineItemId: string) => {
    if (isDummyUser) {
      onShowDemoWarning?.();
      return;
    }
    const res = await deleteEventTimelineItem(timelineItemId);
    if (res.success) {
      onUpdateEventDetail(prev => prev ? {
        ...prev,
        timelineItems: (prev.timelineItems || []).filter(item => item.id !== timelineItemId)
      } : null);
    }
  };

  const getTimelineCategoryBadge = (category: string) => {
    switch (category) {
      case "PERFORMANCE":
        return (
          <span className="bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Mic className="w-3.5 h-3.5 text-purple-400" /> Show / Performance
          </span>
        );
      case "SOUNDCHECK":
        return (
          <span className="bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Soundcheck / GR
          </span>
        );
      case "BRIEFING":
        return (
          <span className="bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-blue-400" /> Briefing Kru
          </span>
        );
      case "GATE_OPEN":
        return (
          <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Open Gate / Registrasi
          </span>
        );
      case "BREAK":
        return (
          <span className="bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Coffee className="w-3.5 h-3.5 text-rose-400" /> Break / Ishoma
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-zinc-400" /> Agenda Umum
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls: Hari & Tambah Agenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/60 p-4 border border-zinc-800/80 rounded-2xl">
        {/* Day Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Filter Hari:
          </span>
          {Array.from({ length: eventDetail?.durationDays || 1 }).map((_, idx) => {
            const dNum = idx + 1;
            const isCurrent = filterDay === dNum;
            const itemsInThisDay = (eventDetail?.timelineItems || []).filter(i => i.dayNumber === dNum).length;
            return (
              <button
                key={dNum}
                type="button"
                onClick={() => setFilterDay(dNum)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <span>Hari ke-{dNum}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCurrent ? "bg-indigo-800 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {itemsInThisDay}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Button: Tambah Agenda Acara */}
        <button
          type="button"
          onClick={() => {
            setSelectedInitialSlots([]);
            setIsAddAgendaOpen(true);
          }}
          className="whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Tambah Agenda Rundown</span>
        </button>
      </div>

      {/* Quick Metrics Bar Hari Ini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Total Agenda Terjadwal</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-zinc-100">{currentDayItems.length}</span>
            <span className="text-xs text-zinc-400">Sesi</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Guest Star di Hari Ini</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-purple-400">{guestStarsInDay.length}</span>
            <span className="text-xs text-zinc-400">Performer</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Slot Terpakai (Locked)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-amber-400">{totalOccupiedSlotsCount}</span>
            <span className="text-xs text-zinc-400">
              / {EVENT_TIME_SLOTS.length} Slot ({(totalOccupiedSlotsCount * 0.5).toFixed(1)} Jam)
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Slot Tersedia (Bebas)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-400">{totalFreeSlotsCount}</span>
            <span className="text-xs text-zinc-400">Slot Bebas</span>
          </div>
        </div>
      </div>

      {/* Matrix Visual Timeline Bar */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Visual Matrix Jadwal Panggung (Hari ke-{filterDay})</span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Visual blocking 30-menit terpusat. Slot hijau bebas dapat diklik langsung untuk menjadwalkan agenda.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-zinc-400">Show</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-zinc-400">Soundcheck</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-zinc-400">Briefing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-400">Gate Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-zinc-400">Break</span>
            </div>
          </div>
        </div>

        {/* Grid Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {EVENT_TIME_SLOTS.map(slot => {
            const occupied = occupiedMap[slot];
            if (occupied) {
              const getBorderAndBg = () => {
                switch (occupied.category) {
                  case "PERFORMANCE":
                    return "bg-purple-950/70 border-purple-600/70 text-purple-200";
                  case "SOUNDCHECK":
                    return "bg-amber-950/70 border-amber-600/70 text-amber-200";
                  case "BRIEFING":
                    return "bg-blue-950/70 border-blue-600/70 text-blue-200";
                  case "GATE_OPEN":
                    return "bg-emerald-950/70 border-emerald-600/70 text-emerald-200";
                  case "BREAK":
                    return "bg-rose-950/70 border-rose-600/70 text-rose-200";
                  default:
                    return "bg-zinc-800 border-zinc-600 text-zinc-200";
                }
              };

              return (
                <div
                  key={slot}
                  title={`🔒 Terkunci:\n${occupied.title}\n(${occupied.startTime} - ${occupied.endTime} WIB)\nKategori: ${occupied.category}\nLokasi: ${occupied.stageLocation || 'Main Stage'}`}
                  className={`p-2 rounded-xl border text-center transition-all shadow-sm flex flex-col items-center justify-between min-h-[62px] ${getBorderAndBg()}`}
                >
                  <span className="text-[11px] font-mono font-bold leading-tight whitespace-nowrap">
                    {getSlotRangeText(slot)}
                  </span>
                  <span className="text-[10px] font-semibold truncate max-w-full px-0.5 mt-0.5">
                    {occupied.title}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setSelectedInitialSlots([slot]);
                  setIsAddAgendaOpen(true);
                }}
                title={`Klik untuk menjadwalkan agenda di jam ${getSlotRangeText(slot)}`}
                className="p-2 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 text-center cursor-pointer transition-all flex flex-col items-center justify-between min-h-[62px]"
              >
                <span className="text-[11px] font-mono font-bold leading-tight whitespace-nowrap">
                  {getSlotRangeText(slot)}
                </span>
                <span className="text-[9px] text-emerald-400/80 mt-0.5">+ Jadwalkan</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Chronological Rundown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-indigo-400" />
            <span>Daftar Rundown & Agenda Hari ke-{filterDay}</span>
            <span className="text-xs text-zinc-400 font-normal">({currentDayItems.length} Agenda)</span>
          </h4>
        </div>

        {currentDayItems.length > 0 ? (
          <div className="space-y-2.5">
            {currentDayItems.map(item => {
              const durationMinutes = (item.slots || []).length * 30;
              return (
                <div
                  key={item.id}
                  className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Time Badge */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center shrink-0 min-w-[110px]">
                      <span className="text-xs font-mono font-bold text-zinc-100 block">
                        {item.startTime} - {item.endTime}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5">
                        {durationMinutes} Menit ({(item.slots || []).length} Slot)
                      </span>
                    </div>

                    {/* Info & Category */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTimelineCategoryBadge(item.category)}
                        <h5 className="text-base font-bold text-zinc-100 leading-snug">{item.title}</h5>
                        {item.stageLocation && (
                          <span className="text-[11px] bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            📍 {item.stageLocation}
                          </span>
                        )}
                      </div>

                      {item.notes && <p className="text-xs text-zinc-400 italic">Catatan: {item.notes}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteTimelineItem(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-rose-900/60"
                      title="Hapus Agenda & Buka Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-6 space-y-2">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
            <h5 className="text-sm font-bold text-zinc-300">Belum Ada Agenda Terjadwal di Hari ke-{filterDay}</h5>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Mulai susun rundown dengan menambahkan Guest Star di tab Guest Star atau tambahkan agenda soundcheck/briefing di sini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedInitialSlots([]);
                setIsAddAgendaOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Agenda Hari Ini
            </button>
          </div>
        )}
      </div>

      <AddAgendaDialog
        isOpen={isAddAgendaOpen}
        onOpenChange={setIsAddAgendaOpen}
        eventDetailId={eventDetail?.id || ""}
        durationDays={eventDetail?.durationDays || 1}
        initialDayNumber={filterDay}
        initialSlots={selectedInitialSlots}
        timelineItems={eventDetail?.timelineItems || []}
        isDummyUser={isDummyUser}
        onShowDemoWarning={onShowDemoWarning}
        onAgendaAdded={(newItem) => {
          onUpdateEventDetail(prev => prev ? {
            ...prev,
            timelineItems: [...(prev.timelineItems || []), newItem]
          } : null);
        }}
      />
    </div>
  );
}

