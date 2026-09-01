"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { BffError, bffJson } from "@/lib/api/bff-client";
import type { AuthUserView, OtpPurpose } from "@/lib/api/types";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/redirect";
import { useRouter } from "@/i18n/navigation";
import { resolveAppLocale } from "@/i18n/routing";
import { prefetchMe, seedAuthSession } from "@/lib/query/session-cache";
import { cn } from "@/lib/utils";

const schema = z.object({
  code: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function OtpForm({
  phone,
  purpose,
  initialExpiresIn,
  nextPath,
  onResetToken,
}: {
  phone: string;
  purpose: OtpPurpose;
  initialExpiresIn: number;
  nextPath?: string;
  onResetToken?: (token: string) => void;
}) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputId = useId();
  const [seconds, setSeconds] = useState(initialExpiresIn);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  async function requestOtp() {
    setErrorKey(null);
    setResendPending(true);
    try {
      const data = await bffJson<{ expiresIn: number }>(
        "/api/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({ phone, purpose }),
        },
      );
      setSeconds(data.expiresIn);
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setResendPending(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setPending(true);
    setErrorKey(null);
    try {
      const data = await bffJson<
        | { user: AuthUserView; expiresIn: number }
        | { resetToken: string }
      >("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, purpose, code: values.code }),
      });

      if ("resetToken" in data && data.resetToken) {
        onResetToken?.(data.resetToken);
        return;
      }

      if ("user" in data) {
        seedAuthSession(queryClient, data.user);
        prefetchMe(queryClient);
        const dest = safeRedirectPath(
          nextPath,
          homePathForRole(data.user.role),
        );
        router.replace(dest, {
          locale: resolveAppLocale(data.user.preferredLanguage),
        });
      }
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  const resendDisabled =
    resendPending || (seconds > 0 && seconds > initialExpiresIn - 30);

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-left text-xs text-blue-800 md:text-sm">
        <p>{t("otpHint")}</p>
        <p className="mt-1.5 font-semibold text-blue-900">{phone}</p>
        <p className="mt-1 text-blue-700/90">
          {seconds > 0 ? t("otpExpires", { seconds }) : t("otpExpired")}
        </p>
      </div>

      {process.env.NODE_ENV === "development" ? (
        <p className="text-[11px] leading-relaxed text-[#534341]/80">
          {t("devOtpNote")}
        </p>
      ) : null}

      <div>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => {
            const floatActive = focused || Boolean(field.value?.length);
            return (
              <div
                className={cn(
                  "relative flex items-stretch rounded-lg border bg-white transition-[border-color]",
                  errorKey || fieldState.error
                    ? "border-destructive"
                    : focused
                      ? "border-[#d8c2bf]"
                      : "border-[#ebe4e1]",
                )}
              >
                <input
                  id={inputId}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={pending}
                  placeholder={t("otpCodeLabel")}
                  className="ham-auth-otp-input block w-full rounded-lg border-0 bg-transparent px-3.5 py-3.5 text-sm leading-6 tracking-[0.2em] text-[#1c1b1b] shadow-none outline-none ring-0 placeholder:text-transparent"
                  aria-invalid={
                    Boolean(errorKey || fieldState.error) || undefined
                  }
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    field.onBlur();
                  }}
                />
                <label
                  htmlFor={inputId}
                  className={cn(
                    "pointer-events-none absolute left-3.5 bg-white px-1 font-medium transition-all",
                    floatActive
                      ? "-top-2.5 text-xs tracking-normal text-[#d32f2f]"
                      : "top-3.5 text-sm tracking-normal text-[#857371]",
                  )}
                >
                  {t("otpCodeLabel")}
                </label>
              </div>
            );
          }}
        />
      </div>

      {errorKey ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {te(errorKey as "INVALID_OR_EXPIRED_CODE")}
        </div>
      ) : null}

      <div className="space-y-3 pt-1">
        <Button
          type="submit"
          className="ham-auth-btn-designer h-auto w-full"
          disabled={pending}
        >
          {pending ? t("submitting") : t("submitOtp")}
          {!pending ? (
            <ArrowRight className="size-[18px] shrink-0" aria-hidden />
          ) : null}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="ham-auth-btn-designer-secondary h-auto w-full border-[#d32f2f] bg-transparent text-[#d32f2f] shadow-none hover:bg-[#d32f2f]/5 hover:text-[#d32f2f]"
          onClick={() => void requestOtp()}
          disabled={resendDisabled}
        >
          {resendPending ? t("submitting") : t("resendOtp")}
        </Button>
      </div>
    </form>
  );
}
