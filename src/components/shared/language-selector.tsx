"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  localeDisplayOrder,
  type AppLocale,
} from "@/i18n/routing";
import { bffJson } from "@/lib/api/bff-client";
import { cn } from "@/lib/utils";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  hi: "हिंदी",
  ta: "தமிழ்",
  en: "English",
};

type Props = {
  /** Quieter control for landing / public chrome. */
  appearance?: "default" | "landing" | "form" | "auth";
  className?: string;
};

/**
 * Compact language dropdown. Persists preferredLanguage via PATCH /me when
 * authenticated; guests only switch the UI locale (default remains Hindi).
 */
export function LanguageSelector({
  appearance = "default",
  className,
}: Props) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const landing = appearance === "landing";
  const form = appearance === "form";
  const auth = appearance === "auth";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  async function selectLocale(code: AppLocale) {
    if (code === locale) {
      close();
      return;
    }

    try {
      await bffJson("/api/proxy/me", {
        method: "PATCH",
        body: JSON.stringify({ preferredLanguage: code }),
      });
    } catch {
      // Guest or temporary error — still switch UI locale.
    }

    close();
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  return (
    <div ref={rootRef} className={cn("relative", form && "w-full", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          form
            ? "h-12 w-full justify-between rounded-[var(--auth-radius-sm,0.85rem)] border border-[var(--auth-border-strong,rgba(28,20,18,0.18))] bg-[var(--auth-input-bg,#fff)] px-3.5 text-[var(--auth-ink,#1c1412)] hover:bg-[var(--auth-surface-soft,#f4ebe7)] focus-visible:ring-[var(--auth-focus,#be1b0f)]"
            : "min-h-10 rounded-full px-3",
          !form &&
            !auth &&
            (landing
              ? "text-[var(--landing-ink)] hover:bg-[var(--landing-surface-soft)] focus-visible:ring-[var(--landing-focus)]"
              : "text-foreground hover:bg-muted focus-visible:ring-ring"),
          auth &&
            "rounded-full border border-white/30 bg-transparent px-3 py-1.5 text-white hover:bg-white/10 focus-visible:ring-white/70 focus-visible:ring-offset-0",
          pending && "opacity-70",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t("language")}: ${LOCALE_LABELS[locale]}`}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="inline-flex items-center gap-1.5">
          <Languages className="size-4 shrink-0 opacity-70" aria-hidden />
          <span>{LOCALE_LABELS[locale]}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("language")}
          className={cn(
            "absolute z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border py-1 shadow-lg",
            form ? "inset-x-0" : "end-0",
            landing
              ? "border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_12px_32px_rgba(28,20,18,0.12)]"
              : auth
                ? "border-white/20 bg-[#1c1412]/95 text-[#fffaf8] shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
                : "border-border bg-background",
          )}
        >
          {localeDisplayOrder.map((code) => {
            const selected = code === locale;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors",
                    landing
                      ? selected
                        ? "bg-[var(--landing-primary)]/8 font-semibold text-[var(--landing-primary)]"
                        : "text-[var(--landing-ink)] hover:bg-[var(--landing-surface-soft)]"
                      : auth
                        ? selected
                          ? "bg-[var(--auth-primary,#be1b0f)]/20 font-semibold text-white"
                          : "text-white/90 hover:bg-white/10"
                        : selected
                          ? "bg-primary/10 font-semibold text-primary"
                          : "hover:bg-muted",
                  )}
                  onClick={() => {
                    void selectLocale(code);
                  }}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  {selected ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <span className="size-4" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
