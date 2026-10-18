// Barrel exports for inventory feature

export * from "./types";

// Actions
export * from "./actions/inventoryActions";

// Hooks
export { useBarcodeScanner } from "./hooks/useBarcodeScanner";
export { useInventoryFilter } from "./hooks/useInventoryFilter";

// Components
export { AddItemDialog } from "./components/AddItemDialog";
export { EditItemDialog } from "./components/EditItemDialog";
export { DeleteItemDialog } from "./components/DeleteItemDialog";
export { AddCategoryDialog } from "./components/AddCategoryDialog";
export { EditCategoryDialog } from "./components/EditCategoryDialog";
export { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
export { ItemDetailBarcodeDialog } from "./components/ItemDetailBarcodeDialog";
export { InventoryFilterBar } from "./components/InventoryFilterBar";
export { InventoryGrid } from "./components/InventoryGrid";

