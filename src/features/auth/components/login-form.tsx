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
import type { AuthUserView } from "@/lib/api/types";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/redirect";
import { Link, useRouter } from "@/i18n/navigation";

const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    setErrorKey(null);
    try {
      const data = await bffJson<{ user: AuthUserView }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(values),
        },
      );
      const dest = safeRedirectPath(
        nextPath,
        homePathForRole(data.user.role),
      );
      router.replace(dest);
      router.refresh();
    } catch (error) {
      if (error instanceof BffError) {
        setErrorKey(error.code);
      } else {
        setErrorKey("UNKNOWN");
      }
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
      <div className="space-y-2">
        <Label htmlFor="login-phone">{t("phone")}</Label>
        <Input
          id="login-phone"
          autoComplete="username"
          placeholder={t("phonePlaceholder")}
          {...form.register("phone")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">{t("password")}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </div>

      {errorKey ? (
        <p className="text-sm text-destructive" role="alert">
          {te(errorKey as "INVALID_CREDENTIALS")}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {t("submitLogin")}
      </Button>

      <div className="flex flex-col gap-2 text-sm">
        <Link className="underline" href="/login/otp">
          {t("loginOtp")}
        </Link>
        <Link className="underline" href="/password/reset">
          {t("forgotPassword")}
        </Link>
        <Link className="underline" href="/register">
          {t("needAccount")}
        </Link>
      </div>
    </form>
  );
}
