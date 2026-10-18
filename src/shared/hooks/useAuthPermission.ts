"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  isAdminEmail,
  isDemoEmail,
  canExecuteMutation,
  DEMO_MESSAGES,
  type DemoActionType,
} from "@/shared/constants/permissions";
import type { User } from "@supabase/supabase-js";

// In-memory cache singleton untuk menghindari multiple network roundtrips
let cachedUser: User | null = null;
let isInitialized = false;
let authPromise: Promise<User | null> | null = null;
const listeners = new Set<(user: User | null) => void>();

function notifyListeners(user: User | null) {
  cachedUser = user;
  isInitialized = true;
  listeners.forEach((listener) => listener(user));
}

// Single subscription ke Supabase Auth
function initAuthSubscription() {
  if (typeof window === "undefined") return;

  if (!authPromise) {
    authPromise = supabase.auth.getUser().then(({ data, error }) => {
      const user = error ? null : data.user;
      notifyListeners(user);
      return user;
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      notifyListeners(user);
    });
  }
}

export interface UseAuthPermissionResult {
  user: User | null;
  email: string | null;
  isAdmin: boolean;
  isDemo: boolean;
  isDummyUser: boolean; // Alias untuk backwards compatibility
  canMutate: boolean;
  isLoading: boolean;
  demoModalOpen: boolean;
  setDemoModalOpen: (open: boolean) => void;
  showDemoWarning: boolean; // Alias untuk backwards compatibility
  setShowDemoWarning: (open: boolean) => void;
  demoModalContent: { title: string; message: string };
  triggerDemoWarning: (type?: DemoActionType) => void;
}

export function useAuthPermission(): UseAuthPermissionResult {
  const [currentUser, setCurrentUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!isInitialized);

  // State untuk modal pembatasan aksi demo
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoModalContent, setDemoModalContent] = useState<{ title: string; message: string }>({
    title: DEMO_MESSAGES.default.title,
    message: DEMO_MESSAGES.default.message,
  });

  useEffect(() => {
    initAuthSubscription();

    const listener = (user: User | null) => {
      setCurrentUser(user);
      setIsLoading(false);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const email = currentUser?.email ?? null;
  const isAdmin = isAdminEmail(email);
  const isDemo = isDemoEmail(email);
  const canMutate = canExecuteMutation(email);

  const triggerDemoWarning = (type: DemoActionType = "default") => {
    const config = DEMO_MESSAGES[type] ?? DEMO_MESSAGES.default;
    setDemoModalContent({
      title: config.title,
      message: config.message,
    });
    setDemoModalOpen(true);
  };

  return {
    user: currentUser,
    email,
    isAdmin,
    isDemo,
    isDummyUser: isDemo,
    canMutate,
    isLoading,
    demoModalOpen,
    setDemoModalOpen,
    showDemoWarning: demoModalOpen,
    setShowDemoWarning: setDemoModalOpen,
    demoModalContent,
    triggerDemoWarning,
  };
}

