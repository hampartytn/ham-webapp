"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { PreferredLanguageChips } from "@/components/shared/preferred-language-chips";
import { PhoneNumberInput } from "@/components/shared/phone-number-input";
import { RoleSegmentedControl } from "@/components/shared/role-segmented-control";
import { Button } from "@/components/ui/button";
import { BffError, bffJson } from "@/lib/api/bff-client";
import { isValidE164, splitE164 } from "@/lib/auth/phone";
import { Link, useRouter } from "@/i18n/navigation";
import { resolveAppLocale } from "@/i18n/routing";

function isRegisterPhone(phone: string): boolean {
  if (!isValidE164(phone)) return false;
  const { country, nationalDigits } = splitE164(phone);
  return nationalDigits.length === country.nationalLength;
}

const schema = z.object({
  phone: z.string().refine(isRegisterPhone, { message: "phoneInvalid" }),
  role: z.enum(["EMPLOYEE", "EMPLOYER"]),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      role: "EMPLOYEE",
    },
    mode: "onSubmit",
  });

  const phoneError =
    phoneTouched || form.formState.isSubmitted
      ? form.formState.errors.phone
        ? t("phoneInvalid")
        : null
      : null;

  async function onSubmit(values: FormValues) {
    setPending(true);
    setErrorKey(null);
    try {
      await bffJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          phone: values.phone,
          role: values.role,
          preferredLanguage: resolveAppLocale(locale),
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
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <Controller
        control={form.control}
        name="phone"
        render={({ field }) => (
          <PhoneNumberInput
            id="register-phone"
            variant="floating"
            label={t("phone")}
            value={field.value}
            onChange={field.onChange}
            onBlur={() => {
              setPhoneTouched(true);
              field.onBlur();
            }}
            error={phoneError}
            hint={t("phoneHelpSecure")}
            disabled={pending}
            autoFocus
          />
        )}
      />

      <Controller
        control={form.control}
        name="role"
        render={({ field }) => (
          <RoleSegmentedControl
            value={field.value}
            onChange={field.onChange}
            disabled={pending}
          />
        )}
      />

      <PreferredLanguageChips disabled={pending} />

      {errorKey ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p>{te(errorKey as "CONFLICT")}</p>
          {errorKey === "CONFLICT" ? (
            <p className="mt-2">
              <Link
                href="/login"
                className="font-semibold underline underline-offset-4"
              >
                {t("conflictLogin")}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 pt-4">
        <Button
          type="submit"
          className="ham-auth-btn-designer h-auto w-full"
          disabled={pending}
        >
          {pending ? t("submitting") : t("submitContinue")}
          {!pending ? (
            <ArrowRight className="size-[18px] shrink-0" aria-hidden />
          ) : null}
        </Button>
        <p className="mt-4 text-center text-xs text-[#534341]">
          {t.rich("registerLegal", {
            terms: (chunks) => (
              <span className="cursor-default text-[#d32f2f]">{chunks}</span>
            ),
            privacy: (chunks) => (
              <span className="cursor-default text-[#d32f2f]">{chunks}</span>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
