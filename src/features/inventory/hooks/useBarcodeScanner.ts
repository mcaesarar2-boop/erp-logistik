"use client";

import { useState, useRef } from "react";

export function useBarcodeScanner(
  optionsOrOnScan: ((scannedText: string) => void) | { onScan: (scannedText: string) => void }
) {
  const onScan = typeof optionsOrOnScan === "function" ? optionsOrOnScan : optionsOrOnScan.onScan;
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = barcodeQuery.trim();
      if (trimmed !== "") {
        onScan(trimmed);
        setBarcodeQuery("");
        setTimeout(() => barcodeInputRef.current?.focus(), 0);
      }
    }
  };

  return {
    barcodeQuery,
    setBarcodeQuery,
    barcodeInputRef,
    inputRef: barcodeInputRef,
    handleBarcodeScan,
    handleKeyDown: handleBarcodeScan,
  };
}

