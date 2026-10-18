"use client";

import { PackageFormDialog, PackageFormDialogProps } from "./PackageFormDialog";

export function EditPackageDialog(props: Omit<PackageFormDialogProps, "mode">) {
  return <PackageFormDialog mode="edit" {...props} />;
}

