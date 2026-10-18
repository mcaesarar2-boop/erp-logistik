// Type definitions for POS & Cart feature

import type { Item, PackageTemplate } from "@/shared/types/common";

export interface CartItem {
  lineId: string;
  id: string;
  name: string;
  code: string;
  quantity: number; // max warehouse stock
  qty: number | "";
  price?: number | null;
  rentPercentage?: number | null;
  discount?: number | "";
  footnote?: string;
  imageUrl?: string | null;
  fromPackageId?: string;
}

export interface CustomServiceItem {
  id: string;
  lineId?: string;
  name: string;
  qty: number | "";
  price: number | "";
  discount?: number | "";
  footnote: string;
}

export interface AddRentalDialogProps {
  items: {
    id: string;
    name: string;
    code: string;
    quantity: number;
    imageUrl?: string | null;
    price?: number | null;
    rentPercentage?: number | null;
    categories?: { id: string; name: string }[];
  }[];
  packages?: {
    id: string;
    name: string;
    description?: string | null;
    payload: string;
  }[];
}

