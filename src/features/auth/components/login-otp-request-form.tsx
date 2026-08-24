"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BffError, bffJson } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
});

export function LoginOtpRequestForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setPending(true);
    setErrorKey(null);
    try {
      const data = await bffJson<{ expiresIn: number }>(
        "/api/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({ phone: values.phone, purpose: "LOGIN" }),
        },
      );
      const q = new URLSearchParams({
        phone: values.phone,
        purpose: "LOGIN",
        expiresIn: String(data.expiresIn),
      });
      if (nextPath) q.set("next", nextPath);
      router.push(`/otp?${q.toString()}`);
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="otp-login-phone">{t("phone")}</Label>
        <Input
          id="otp-login-phone"
          placeholder={t("phonePlaceholder")}
          {...form.register("phone")}
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
