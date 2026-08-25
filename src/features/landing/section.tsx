import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "surface" | "ink";
};

export function LandingSection({
  id,
  children,
  className,
  tone = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "ham-landing__section",
        tone === "surface" && "bg-[var(--landing-surface)]",
        tone === "ink" && "bg-[var(--landing-ink)] text-[var(--landing-primary-fg)]",
        className,
      )}
    >
      <div className="ham-landing__container">{children}</div>
    </section>
  );
}

type HeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function LandingSectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: HeadingProps) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl space-y-3",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-sm font-semibold tracking-wide uppercase",
            light ? "text-white/75" : "text-[var(--landing-primary)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "ham-landing__display text-3xl font-semibold tracking-tight sm:text-4xl",
          light ? "text-white" : "text-[var(--landing-ink)]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-base leading-relaxed sm:text-lg",
            light ? "text-white/80" : "text-[var(--landing-muted)]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
