"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BffError, bffJson } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

const schema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "phone must be E.164"),
  role: z.enum(["EMPLOYEE", "EMPLOYER"]),
  preferredLanguage: z.enum(["ta", "en", "hi"]),
  email: z.string().email().optional().or(z.literal("")),
  password: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^(?!\d+$).{10,}$/.test(v) && v.length >= 10),
      "password rules",
    ),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      role: "EMPLOYEE",
      preferredLanguage: locale === "hi" || locale === "en" ? locale : "ta",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    setErrorKey(null);
    try {
      await bffJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          phone: values.phone,
          role: values.role,
          preferredLanguage: values.preferredLanguage,
          email: values.email || undefined,
          password: values.password || undefined,
        }),
      });

      const otp = await bffJson<{ expiresIn: number }>(
        "/api/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({
            phone: values.phone,
            purpose: "REGISTER",
          }),
        },
      );

      router.push(
        `/otp?phone=${encodeURIComponent(values.phone)}&purpose=REGISTER&expiresIn=${otp.expiresIn}`,
      );
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
      <p className="text-sm text-muted-foreground">{t("registerHint")}</p>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          {...form.register("phone")}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("role")}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="EMPLOYEE" {...form.register("role")} />
          {t("roleEmployee")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="EMPLOYER" {...form.register("role")} />
          {t("roleEmployer")}
        </label>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="preferredLanguage">{t("preferredLanguage")}</Label>
        <select
          id="preferredLanguage"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          {...form.register("preferredLanguage")}
        >
          <option value="ta">தமிழ்</option>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("emailOptional")}</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("optionalPassword")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      {errorKey ? (
        <p className="text-sm text-destructive" role="alert">
          {te(errorKey as "CONFLICT")}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {t("submitRegister")}
      </Button>
    </form>
  );
}
