// Type definitions for on-rented feature

import type { Item, Category, History } from "@/shared/types/common";

export type { Item, Category, History };

export interface ActiveEventPayloadItem {
  id: string;
  name: string;
  code: string;
  qty: number;
  returnedQty?: number;
  price: number;
  discount?: number;
  imageUrl?: string | null;
  catatan?: string | null;
  footnote?: string | null;
}

export interface OnRentedTabProps {
  items: Item[];
  categories: Category[];
  histories: History[];
  isAdmin: boolean;
  isDummyUser: boolean;
  onNavigateToEvents?: () => void;
  onTriggerDemoWarning?: (action: "add" | "edit" | "delete" | "batch") => void;
}

