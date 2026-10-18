import { useMemo } from "react";
import { Item } from "@/shared/types/common";
import { HighlightMetrics } from "../types";

export function useHighlightMetrics(items: Item[]): HighlightMetrics {
  return useMemo(() => {
    const totalItems = items.length;
    const initial = { availableUnits: 0, rentedUnits: 0, maintenanceUnits: 0, totalValuation: 0 };
    const reduced = items.reduce((acc, item) => {
      const totalQty = item.quantity + item.rentedQuantity + item.maintenanceQuantity;
      return {
        availableUnits: acc.availableUnits + item.quantity,
        rentedUnits: acc.rentedUnits + item.rentedQuantity,
        maintenanceUnits: acc.maintenanceUnits + item.maintenanceQuantity,
        totalValuation: acc.totalValuation + totalQty * (item.price || 0),
      };
    }, initial);

    return {
      totalItems,
      ...reduced,
    };
  }, [items]);
}

