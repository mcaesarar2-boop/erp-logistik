"use client";

import React, { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import { DemoRestrictionDialog } from "@/shared/components/DemoRestrictionDialog";
import { useEventWorkspace, useEventBudgeting } from "../hooks";
import { EventSelectorHeader } from "./EventSelectorHeader";
import { EventSubTabNav } from "./EventSubTabNav";
import { CreateStandaloneEventDialog } from "./CreateStandaloneEventDialog";
import { EditEventInfoDialog } from "./overview/EditEventInfoDialog";
import { EventOverviewTab } from "./overview/EventOverviewTab";
import { EventBudgetingTab } from "./budgeting/EventBudgetingTab";
import { EventEquipmentTab } from "./equipment/EventEquipmentTab";
import { EventUtilityTab } from "./utility/EventUtilityTab";
import { EventGuestStarTab } from "./guest-star/EventGuestStarTab";
import { EventTimelineTab } from "./timeline/EventTimelineTab";
import { MasterTimelineModal } from "./timeline/MasterTimelineModal";
import type { EventDetailData } from "../types";

export interface EventManagementContainerProps {
  histories: any[];
  items: any[];
  initialEventDetails?: EventDetailData[];
}

export function EventManagementContainer({
  histories,
  items,
  initialEventDetails = [],
}: EventManagementContainerProps) {
  const { isDummyUser, showDemoWarning, setShowDemoWarning } = useAuthPermission();

  const {
    availableEvents,
    selectedHistoryId,
    setSelectedHistoryId,
    eventDetail,
    setEventDetail,
    isLoadingDetail,
    currentSelectedSummary,
    activeSubTab,
    setActiveSubTab,
  } = useEventWorkspace(histories, initialEventDetails);

  const budgetingStats = useEventBudgeting(eventDetail, currentSelectedSummary);

  const [isStandaloneDialogOpen, setIsStandaloneDialogOpen] = useState(false);
  const [isMasterTimelineOpen, setIsMasterTimelineOpen] = useState(false);
  const [isEditingEventInfo, setIsEditingEventInfo] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Header & Event Selector */}
      <EventSelectorHeader
        availableEvents={availableEvents}
        selectedHistoryId={selectedHistoryId}
        onSelectEvent={setSelectedHistoryId}
        eventDetail={eventDetail}
        currentSelectedSummary={currentSelectedSummary}
        budgetingStats={budgetingStats}
        onOpenStandaloneDialog={() => setIsStandaloneDialogOpen(true)}
      />

      {/* Empty State when no events exist */}
      {availableEvents.length === 0 && !eventDetail ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-500 shadow-inner">
            <Calendar className="w-8 h-8 text-amber-400" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-zinc-100">Tidak Ada Acara Aktif di On Rented</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Saat ini tidak ada acara rental yang berstatus aktif di tab On Rented. Anda dapat menyewakan alat dengan tipe Event di POS Kasir atau membuat workspace mandiri baru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsStandaloneDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inisialisasi Workspace Baru</span>
          </button>
        </div>
      ) : (
        <>
          {/* 2. Sub-Tab Navigation Bar */}
          <EventSubTabNav
            activeSubTab={activeSubTab}
            onSelectSubTab={setActiveSubTab}
            eventDetail={eventDetail}
            currentSelectedSummary={currentSelectedSummary}
            budgetingStats={budgetingStats}
            isEditingEventInfo={isEditingEventInfo}
            onToggleEditEventInfo={() => setIsEditingEventInfo(prev => !prev)}
          />

          {/* Quick Inline Edit Info */}
          {eventDetail && (
            <EditEventInfoDialog
              isOpen={isEditingEventInfo}
              onClose={() => setIsEditingEventInfo(false)}
              eventDetail={eventDetail}
              isDummyUser={isDummyUser}
              onShowDemoWarning={() => setShowDemoWarning(true)}
              onUpdated={(updated) => setEventDetail(updated)}
            />
          )}

          {/* Sub-Tab Contents */}
          {isLoadingDetail ? (
            <div className="p-12 text-center text-zinc-400">
              Memuat data workspace acara...
            </div>
          ) : (
            <>
              {activeSubTab === "overview" && (
                <EventOverviewTab
                  eventDetail={eventDetail}
                  currentSelectedSummary={currentSelectedSummary}
                  isDummyUser={isDummyUser}
                  onShowDemoWarning={() => setShowDemoWarning(true)}
                  onUpdateEventDetail={setEventDetail}
                />
              )}

              {activeSubTab === "budgeting" && (
                <EventBudgetingTab
                  eventDetail={eventDetail}
                  budgetingStats={budgetingStats}
                  currentSelectedSummary={currentSelectedSummary}
                />
              )}

              {activeSubTab === "equipment" && (
                <EventEquipmentTab
                  eventDetail={eventDetail}
                  currentSelectedSummary={currentSelectedSummary}
                  items={items}
                  isDummyUser={isDummyUser}
                  onShowDemoWarning={() => setShowDemoWarning(true)}
                  onUpdateEventDetail={setEventDetail}
                />
              )}

              {activeSubTab === "utility" && (
                <EventUtilityTab
                  eventDetail={eventDetail}
                  budgetingStats={budgetingStats}
                  isDummyUser={isDummyUser}
                  onShowDemoWarning={() => setShowDemoWarning(true)}
                  onUpdateEventDetail={setEventDetail}
                />
              )}

              {activeSubTab === "gueststar" && (
                <EventGuestStarTab
                  eventDetail={eventDetail}
                  currentSelectedSummary={currentSelectedSummary}
                  budgetingStats={budgetingStats}
                  isDummyUser={isDummyUser}
                  onShowDemoWarning={() => setShowDemoWarning(true)}
                  onOpenMasterTimeline={() => setIsMasterTimelineOpen(true)}
                  onUpdateEventDetail={setEventDetail}
                />
              )}

              {activeSubTab === "timeline" && (
                <EventTimelineTab
                  eventDetail={eventDetail}
                  isDummyUser={isDummyUser}
                  onShowDemoWarning={() => setShowDemoWarning(true)}
                  onUpdateEventDetail={setEventDetail}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Master Timeline Modal Popup */}
      <MasterTimelineModal
        isOpen={isMasterTimelineOpen}
        onOpenChange={setIsMasterTimelineOpen}
        eventDetail={eventDetail}
        isDummyUser={isDummyUser}
        onShowDemoWarning={() => setShowDemoWarning(true)}
        onUpdateEventDetail={setEventDetail}
      />

      {/* Standalone Event Dialog */}
      <CreateStandaloneEventDialog
        isOpen={isStandaloneDialogOpen}
        onOpenChange={setIsStandaloneDialogOpen}
        isDummyUser={isDummyUser}
        onShowDemoWarning={() => setShowDemoWarning(true)}
        onCreated={(newEvent) => {
          setEventDetail(newEvent);
          setSelectedHistoryId(newEvent.id);
        }}
      />

      {/* Demo Warning Dialog */}
      <DemoRestrictionDialog
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
      />
    </div>
  );
}

export default EventManagementContainer;

