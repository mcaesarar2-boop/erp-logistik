import { Item } from "@/shared/types/common";

export interface PackageTemplate {
  id: string;
  name: string;
  description: string | null;
  payload: string;
  kategoriUtama?: string | null;
  labelGrade?: string[];
  createdAt?: Date | string;
}

export interface PackagePayloadItem {
  id: string;
  lineId?: string;
  name?: string;
  code?: string;
  qty: number;
  price?: number;
  rentPercentage?: number;
  discount?: number;
  footnote?: string;
  imageUrl?: string | null;
}

export interface PackageDisplayItem extends Item {
  lineId?: string;
  pkgQty?: number;
  pkgFootnote?: string;
  pkgDiscount?: number;
}

export type PackageFormMode = "create" | "edit";

