"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmployeeNav } from "@/components/layout/employee-nav";

export function EmployeeShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  void t;
  return (
    <div className="flex min-h-screen flex-col">
      <EmployeeNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
