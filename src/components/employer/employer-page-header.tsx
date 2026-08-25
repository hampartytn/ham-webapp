import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function EmployerPageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--emp-ink,#1c1412)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--emp-muted,#6b5e5a)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function EmployerStatCard({
  label,
  value,
  hint,
  href,
  icon,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: ReactNode;
  emphasis?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--emp-muted,#6b5e5a)]">
          {label}
        </p>
        {icon ? (
          <span className="text-[var(--emp-muted,#6b5e5a)]" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="ham-employer__stat-value mt-1">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--emp-muted,#6b5e5a)]">{hint}</p>
      ) : null}
    </>
  );

  const className = cn(
    "ham-employer__stat",
    emphasis && "ham-employer__stat--emphasis",
    href && "ham-employer__stat--link",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function EmployerPanel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("ham-employer__panel", className)}>
      {title || action || subtitle ? (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--emp-muted,#6b5e5a)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
