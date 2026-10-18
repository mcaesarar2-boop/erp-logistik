import type { Item, Category } from "@/shared/types/common";

export type { Item, Category };

export type SortOption =
  | "name_asc"
  | "name_desc"
  | "qty_highest"
  | "qty_lowest"
  | "date_modified_desc"
  | "date_modified_asc"
  | "price_highest"
  | "price_lowest";

