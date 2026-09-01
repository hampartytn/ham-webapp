import type { ReactNode } from "react";

import { AccountStatusGate } from "@/components/layout/account-status-gate";
import { EmployeeShell } from "@/components/layout/employee-shell";
import { assertRoleLayoutAccess } from "@/lib/auth/layout-auth";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployeeLayout({ children, params }: Props) {
  const { locale } = await params;
  await assertRoleLayoutAccess(locale, ["EMPLOYEE"], "/employee");

  return (
    <EmployeeShell>
      <AccountStatusGate>{children}</AccountStatusGate>
    </EmployeeShell>
  );
}
