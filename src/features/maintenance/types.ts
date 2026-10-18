export interface MaintenanceItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  rentedQuantity: number;
  maintenanceQuantity: number;
  price?: number | null;
  rentPercentage?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: Date | string | null;
  categories?: { id: string; name: string }[];
}

export interface MaintenanceCartItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  qty: number | "";
  imageUrl?: string | null;
}

