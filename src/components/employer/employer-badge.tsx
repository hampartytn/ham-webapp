import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "muted" | "warn" | "danger" | "review";

const TONE: Record<Tone, string> = {
  success: "ham-employer__pill--success",
  info: "ham-employer__pill--info",
  muted: "ham-employer__pill--muted",
  warn: "ham-employer__pill--warn",
  danger: "ham-employer__pill--danger",
  review: "ham-employer__pill--review",
};

export function jobBadgeTone(status: string): Tone {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "CLOSED":
      return "danger";
    case "UNPUBLISHED":
      return "muted";
    default:
      return "muted";
  }
}

export function appBadgeTone(status: string): Tone {
  switch (status) {
    case "SUBMITTED":
      return "info";
    case "VIEWED":
      return "review";
    case "SHORTLISTED":
    case "HIRED":
      return "success";
    case "REJECTED":
      return "danger";
    default:
      return "muted";
  }
}

export function EmployerBadge({
  tone,
  children,
  dot,
}: {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={cn("ham-employer__pill", TONE[tone])}>
      {dot ? (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
