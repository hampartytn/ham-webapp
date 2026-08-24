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

const schema = z.object({
  password: z
    .string()
    .min(10)
    .regex(/^(?!\d+$).{10,}$/),
  currentPassword: z.string().optional(),
});

export function PasswordSetForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", currentPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setPending(true);
    setErrorKey(null);
    try {
      await bffJson("/api/auth/password/set", {
        method: "POST",
        body: JSON.stringify({
          password: values.password,
          currentPassword: values.currentPassword || undefined,
        }),
      });
      setDone(true);
    } catch (error) {
      if (error instanceof BffError) setErrorKey(error.code);
      else setErrorKey("UNKNOWN");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <p className="text-sm text-foreground">{t("setPasswordTitle")} ✓</p>;
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input
          id="currentPassword"
          type="password"
          {...form.register("currentPassword")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>
      {errorKey ? (
        <p className="text-sm text-destructive" role="alert">
          {te(errorKey as "VALIDATION_ERROR")}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {t("setPasswordTitle")}
      </Button>
    </form>
  );
}
