import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import { AccountStatusGate } from "@/components/layout/account-status-gate";
import { EmployerShell } from "@/components/layout/employer-shell";
import { assertRoleLayoutAccess } from "@/lib/auth/layout-auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-employer-sans",
  display: "swap",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployerLayout({ children, params }: Props) {
  const { locale } = await params;
  await assertRoleLayoutAccess(locale, ["EMPLOYER"], "/employer");

  return (
    <div className={`${inter.variable} ${inter.className}`}>
      <EmployerShell>
        <AccountStatusGate>{children}</AccountStatusGate>
      </EmployerShell>
    </div>
  );
}
