import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { EmployeeShell } from "@/components/layout/employee-shell";
import { getServerSession } from "@/lib/auth/session";
import { ErrorState } from "@/components/shared/error-state";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployeeLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect(`/${locale}/login?next=/${locale}/employee`);
  }

  if (session.role !== "EMPLOYEE") {
    redirect(`/${locale}/forbidden`);
  }

  if (
    session.accountStatus === "SUSPENDED" ||
    session.accountStatus === "BLOCKED"
  ) {
    return (
      <ErrorState
        code={
          session.accountStatus === "SUSPENDED"
            ? "ACCOUNT_SUSPENDED"
            : "ACCOUNT_BLOCKED"
        }
      />
    );
  }

  return <EmployeeShell>{children}</EmployeeShell>;
}
