"use client";

import { PackageFormDialog, PackageFormDialogProps } from "./PackageFormDialog";

export function AddPackageDialog(props: Omit<PackageFormDialogProps, "mode">) {
  return <PackageFormDialog mode="create" {...props} />;
}

