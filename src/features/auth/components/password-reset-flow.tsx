"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpForm } from "@/features/auth/components/otp-form";
import { BffError, bffJson } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
});

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(10)
    .regex(/^(?!\d+$).{10,}$/),
});

export function PasswordResetFlow() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [resetToken, setResetToken] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "" },
  });

  async function requestReset(values: z.infer<typeof phoneSchema>) {
    setPending(true);
    setErrorKey(null);
    try {
      const data = await bffJson<{ expiresIn: number }>(
        "/api/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({
            phone: values.phone,
            purpose: "PASSWORD_RESET",
          }),
        },
      );
      setPhone(values.phone);
      setExpiresIn(data.expiresIn);
      setStep("otp");
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  async function confirmPassword(values: z.infer<typeof passwordSchema>) {
    setPending(true);
    setErrorKey(null);
    try {
      await bffJson("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({
          phone,
          resetToken,
          newPassword: values.newPassword,
        }),
      });
      router.replace("/login");
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("resetConfirmHint")}</p>
        <OtpForm
          phone={phone}
          purpose="PASSWORD_RESET"
          initialExpiresIn={expiresIn}
          onResetToken={(token) => {
            setResetToken(token);
            setStep("password");
          }}
        />
      </div>
    );
  }

  if (step === "password") {
    return (
      <form
        className="space-y-5"
        onSubmit={passwordForm.handleSubmit(confirmPassword)}
      >
        <p className="text-sm text-muted-foreground">{t("resetTokenStep")}</p>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            {...passwordForm.register("newPassword")}
          />
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        </div>
        {errorKey ? (
          <p className="text-sm text-destructive" role="alert">
            {te(errorKey as "INVALID_OR_EXPIRED_CODE")}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {t("setPasswordTitle")}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={phoneForm.handleSubmit(requestReset)}
    >
      <p className="text-sm text-muted-foreground">{t("resetRequestHint")}</p>
      <div className="space-y-2">
        <Label htmlFor="reset-phone">{t("phone")}</Label>
        <Input
          id="reset-phone"
          placeholder={t("phonePlaceholder")}
          {...phoneForm.register("phone")}
        />
      </div>
      {errorKey ? (
        <p className="text-sm text-destructive" role="alert">
          {te(errorKey as "UNKNOWN")}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {t("requestOtp")}
      </Button>
    </form>
  );
}
