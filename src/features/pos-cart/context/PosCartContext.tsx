"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PosCartContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  targetEventId: string;
  targetEventName: string;
  openAddonRental: (eventId: string, eventName: string) => void;
  clearTargetEvent: () => void;
  externalAddItem: any | null;
  setExternalAddItem: (item: any | null) => void;
  externalPkgId: string | null;
  setExternalPkgId: (pkgId: string | null) => void;
}

const PosCartContext = createContext<PosCartContextValue | null>(null);

export function PosCartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetEventId, setTargetEventId] = useState("");
  const [targetEventName, setTargetEventName] = useState("");
  const [externalAddItem, setExternalAddItem] = useState<any | null>(null);
  const [externalPkgId, setExternalPkgId] = useState<string | null>(null);

  const openCart = () => setIsOpen(true);
  const closeCart = () => {
    setIsOpen(false);
    setTargetEventId("");
    setTargetEventName("");
  };

  const openAddonRental = (eventId: string, eventName: string) => {
    setTargetEventId(eventId);
    setTargetEventName(eventName);
    setIsOpen(true);
  };

  const clearTargetEvent = () => {
    setTargetEventId("");
    setTargetEventName("");
  };

  // Fallback listener for window events
  useEffect(() => {
    const handleAddToCartEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.pkgId) {
        setExternalPkgId(customEvent.detail.pkgId);
      } else if (customEvent.detail?.item) {
        setExternalAddItem(customEvent.detail.item);
      } else if (customEvent.detail?.itemId) {
        setExternalAddItem({ id: customEvent.detail.itemId });
      }
    };

    const handleOpenAddonEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.eventId) {
        openAddonRental(
          customEvent.detail.eventId,
          customEvent.detail.eventName || "Event"
        );
      }
    };

    window.addEventListener("add-to-pos-cart", handleAddToCartEvent);
    window.addEventListener("open-addon-rental", handleOpenAddonEvent);

    return () => {
      window.removeEventListener("add-to-pos-cart", handleAddToCartEvent);
      window.removeEventListener("open-addon-rental", handleOpenAddonEvent);
    };
  }, []);

  return (
    <PosCartContext.Provider
      value={{
        isOpen,
        setIsOpen,
        openCart,
        closeCart,
        targetEventId,
        targetEventName,
        openAddonRental,
        clearTargetEvent,
        externalAddItem,
        setExternalAddItem,
        externalPkgId,
        setExternalPkgId,
      }}
    >
      {children}
    </PosCartContext.Provider>
  );
}

export function usePosCart() {
  const context = useContext(PosCartContext);
  if (!context) {
    // Return graceful fallback so components don't crash if rendered outside provider
    return {
      isOpen: false,
      setIsOpen: () => {},
      openCart: () => {},
      closeCart: () => {},
      targetEventId: "",
      targetEventName: "",
      openAddonRental: () => {},
      clearTargetEvent: () => {},
      externalAddItem: null,
      setExternalAddItem: () => {},
      externalPkgId: null,
      setExternalPkgId: () => {},
    };
  }
  return context;
}

