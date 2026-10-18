"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays } from "lucide-react";
import { TimelineRundownView } from "./TimelineRundownView";
import type { EventDetailData } from "../../types";

interface MasterTimelineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetail: EventDetailData | null;
  isDummyUser?: boolean;
  onShowDemoWarning?: () => void;
  onUpdateEventDetail: (updater: (prev: EventDetailData | null) => EventDetailData | null) => void;
}

export function MasterTimelineModal({
  isOpen,
  onOpenChange,
  eventDetail,
  isDummyUser,
  onShowDemoWarning,
  onUpdateEventDetail,
}: MasterTimelineModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-4xl sm:max-w-5xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-zinc-800/80">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
            </div>
            Master Timeline & Rundown Terpusat
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <TimelineRundownView
            eventDetail={eventDetail}
            isDummyUser={isDummyUser}
            onShowDemoWarning={onShowDemoWarning}
            onUpdateEventDetail={onUpdateEventDetail}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

