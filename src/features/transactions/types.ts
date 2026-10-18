import type { History, Item } from "@/shared/types/common";

export type { History, Item };

export interface HistoryPayloadItem {
  id?: string;
  name: string;
  code: string;
  qty: number;
  price: number;
  footnote?: string;
  discount?: number;
  lineId?: string;
  imageUrl?: string | null;
  categories?: any[];
  labels?: any[];
  returnedQty?: number;
}

