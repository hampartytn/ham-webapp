"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { PhoneNumberInput } from "@/components/shared/phone-number-input";
import { Button } from "@/components/ui/button";
import { BffError, bffJson } from "@/lib/api/bff-client";
import { isValidE164, splitE164 } from "@/lib/auth/phone";
import { Link, useRouter } from "@/i18n/navigation";

function isLoginPhone(phone: string): boolean {
  if (!isValidE164(phone)) return false;
  const { country, nationalDigits } = splitE164(phone);
  return nationalDigits.length === country.nationalLength;
}

const schema = z.object({
  phone: z.string().refine(isLoginPhone, { message: "phoneInvalid" }),
});

export function LoginOtpRequestForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
    mode: "onSubmit",
  });

  const passwordHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";

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

  const showPhoneError =
    (phoneTouched || form.formState.isSubmitted) &&
    Boolean(form.formState.errors.phone);

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
            id="otp-login-phone"
            variant="floating"
            label={t("phone")}
            value={field.value}
            onChange={field.onChange}
            onBlur={() => {
              setPhoneTouched(true);
              field.onBlur();
            }}
            error={showPhoneError ? t("phoneInvalid") : null}
            hint={t("otpLoginHelp")}
            disabled={pending}
            autoFocus
          />
        )}
      />

      {errorKey ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {te(errorKey as "UNKNOWN")}
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          type="submit"
          className="ham-auth-btn-designer h-auto w-full"
          disabled={pending}
        >
          {pending ? t("submitting") : t("requestOtp")}
          {!pending ? (
            <ArrowRight className="size-[18px] shrink-0" aria-hidden />
          ) : null}
        </Button>
      </div>

      <p className="text-center text-sm text-[#534341]">
        <Link
          href={passwordHref}
          className="font-medium text-[#1c1b1b] underline-offset-4 hover:text-[#d32f2f] hover:underline"
        >
          {t("loginPasswordInstead")}
        </Link>
      </p>
    </form>
  );
}
