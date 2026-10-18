"use client";

import { useState } from "react";
import { generateMarkdownInvoice } from "@/shared/lib/markdownGenerators";
import { updateHistory, deleteHistory } from "../actions/transactionActions";
import { useAuthPermission } from "@/shared/hooks/useAuthPermission";
import type { History, Item } from "@/shared/types/common";

export function useTransactionHistory(items: Item[]) {
  const { isDummyUser, showDemoWarning, setShowDemoWarning, triggerDemoWarning } = useAuthPermission();

  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [editingHistory, setEditingHistory] = useState<History | null>(null);
  const [deletingHistory, setDeletingHistory] = useState<History | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleCopyInvoice = async (hist: History) => {
    try {
      const text = generateMarkdownInvoice(hist, items);
      await navigator.clipboard.writeText(text);
      setCopiedHistoryId(hist.id);
      setTimeout(() => {
        setCopiedHistoryId((prev) => (prev === hist.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin invoice ke clipboard", err);
    }
  };

  const handleUpdateHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDummyUser) {
      setEditingHistory(null);
      triggerDemoWarning("edit");
      return;
    }
    if (!editingHistory) return;
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateHistory(editingHistory.id, formData);
    setIsActionLoading(false);
    setEditingHistory(null);
  };

  const handleDeleteHistory = async () => {
    if (isDummyUser) {
      setDeletingHistory(null);
      triggerDemoWarning("delete");
      return;
    }
    if (!deletingHistory) return;
    setIsActionLoading(true);
    await deleteHistory(deletingHistory.id);
    setIsActionLoading(false);
    setDeletingHistory(null);
  };

  return {
    copiedHistoryId,
    editingHistory,
    setEditingHistory,
    deletingHistory,
    setDeletingHistory,
    isActionLoading,
    handleCopyInvoice,
    handleUpdateHistory,
    handleDeleteHistory,
    showDemoWarning,
    setShowDemoWarning,
  };
}

