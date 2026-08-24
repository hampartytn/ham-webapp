"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BffError, bffJson } from "@/lib/api/bff-client";
import type { AuthUserView, OtpPurpose } from "@/lib/api/types";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/redirect";
import { useRouter } from "@/i18n/navigation";

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
  const [seconds, setSeconds] = useState(initialExpiresIn);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
        const dest = safeRedirectPath(
          nextPath,
          homePathForRole(data.user.role),
        );
        router.replace(dest);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <p className="text-sm text-muted-foreground">{t("otpHint")}</p>
      <p className="text-sm font-medium">{phone}</p>
      <p className="text-sm text-muted-foreground">
        {seconds > 0
          ? t("otpExpires", { seconds })
          : t("otpExpired")}
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-xs text-muted-foreground">{t("devOtpNote")}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="otp-code">{t("otpTitle")}</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...form.register("code")}
        />
      </div>

      {errorKey ? (
        <p className="text-sm text-destructive" role="alert">
          {te(errorKey as "INVALID_OR_EXPIRED_CODE")}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {t("submitOtp")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void requestOtp()}
        disabled={seconds > 0 && seconds > initialExpiresIn - 30}
      >
        {t("resendOtp")}
      </Button>
    </form>
  );
}
