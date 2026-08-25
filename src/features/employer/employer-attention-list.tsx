"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileEdit,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AttentionItem } from "@/features/employer/dashboard-utils";
import { cn } from "@/lib/utils";

export function EmployerAttentionList({ items }: { items: AttentionItem[] }) {
  const t = useTranslations("employer");

  if (items.length === 0) {
    return (
      <div
        className="ham-employer__attention ham-employer__attention--clear"
        role="status"
      >
        <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
        <p className="text-sm font-medium text-[var(--emp-ink)]">
          {t("attentionAllClear")}
        </p>
      </div>
    );
  }

  return (
    <section
      className="ham-employer__attention"
      aria-labelledby="employer-attention-heading"
    >
      <h2
        id="employer-attention-heading"
        className="mb-2 text-sm font-semibold tracking-wide text-[var(--emp-muted)] uppercase"
      >
        {t("attentionTitle")}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <AttentionRow item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const t = useTranslations("employer");

  const icon =
    item.kind === "org_missing" || item.kind === "org_incomplete" ? (
      <Building2 className="size-4" aria-hidden />
    ) : item.kind === "submitted_applicants" ? (
      <Users className="size-4" aria-hidden />
    ) : item.kind === "draft_jobs" ? (
      <FileEdit className="size-4" aria-hidden />
    ) : (
      <AlertCircle className="size-4" aria-hidden />
    );

  const label =
    item.kind === "org_missing"
      ? t("attentionOrgMissing")
      : item.kind === "org_incomplete"
        ? t("attentionOrgIncomplete")
        : item.kind === "submitted_applicants"
          ? t("attentionSubmitted", { count: item.count ?? 0 })
          : t("attentionDrafts", { count: item.count ?? 0 });

  const cta =
    item.kind === "org_missing" || item.kind === "org_incomplete"
      ? t("completeProfile")
      : item.kind === "submitted_applicants"
        ? t("reviewApplicants")
        : t("reviewDrafts");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
        item.severity === "critical" &&
          "border-destructive/30 bg-destructive/5",
        item.severity === "high" &&
          "border-primary/25 bg-[color-mix(in_srgb,var(--emp-primary)_6%,white)]",
        item.severity === "medium" && "border-[var(--emp-border)] bg-white",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5 text-sm">
        <span className="mt-0.5 text-[var(--emp-muted)]">{icon}</span>
        <p className="font-medium text-[var(--emp-ink)]">{label}</p>
      </div>
      <Button asChild size="sm" variant={item.severity === "critical" ? "default" : "outline"}>
        <Link href={item.href}>{cta}</Link>
      </Button>
    </div>
  );
}
