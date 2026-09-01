import type { ReactNode } from "react";

import { AccountStatusGate } from "@/components/layout/account-status-gate";
import { AdminShell } from "@/components/layout/admin-shell";
import { assertRoleLayoutAccess } from "@/lib/auth/layout-auth";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  await assertRoleLayoutAccess(locale, ["ADMIN", "SUPER_ADMIN"], "/admin");

  return (
    <AdminShell>
      <AccountStatusGate>{children}</AccountStatusGate>
    </AdminShell>
  );
}
