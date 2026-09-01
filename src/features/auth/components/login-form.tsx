"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { PreferredLanguageChips } from "@/components/shared/preferred-language-chips";
import { PasswordField } from "@/components/shared/password-field";
import { PhoneNumberInput } from "@/components/shared/phone-number-input";
import { Button } from "@/components/ui/button";
import { BffError, bffJson } from "@/lib/api/bff-client";
import type { AuthUserView } from "@/lib/api/types";
import { isValidE164, splitE164 } from "@/lib/auth/phone";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/redirect";
import { Link, useRouter } from "@/i18n/navigation";
import { resolveAppLocale } from "@/i18n/routing";
import { prefetchMe, seedAuthSession } from "@/lib/query/session-cache";

function isLoginPhone(phone: string): boolean {
  if (!isValidE164(phone)) return false;
  const { country, nationalDigits } = splitE164(phone);
  return nationalDigits.length === country.nationalLength;
}

const schema = z.object({
  phone: z.string().refine(isLoginPhone, { message: "phoneInvalid" }),
  password: z.string().min(1, { message: "passwordRequired" }),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [touched, setTouched] = useState({ phone: false, password: false });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
    mode: "onSubmit",
  });

  const otpHref = nextPath
    ? `/login/otp?next=${encodeURIComponent(nextPath)}`
    : "/login/otp";

  async function onSubmit(values: FormValues) {
    setPending(true);
    setErrorKey(null);
    try {
      const data = await bffJson<{ user: AuthUserView }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      seedAuthSession(queryClient, data.user);
      prefetchMe(queryClient);
      const dest = safeRedirectPath(nextPath, homePathForRole(data.user.role));
      router.replace(dest, {
        locale: resolveAppLocale(data.user.preferredLanguage),
      });
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

  const showPhoneError =
    (touched.phone || form.formState.isSubmitted) &&
    Boolean(form.formState.errors.phone);
  const showPasswordError =
    (touched.password || form.formState.isSubmitted) &&
    Boolean(form.formState.errors.password);

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
            id="login-phone"
            variant="floating"
            label={t("phone")}
            value={field.value}
            onChange={field.onChange}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, phone: true }));
              field.onBlur();
            }}
            error={showPhoneError ? t("phoneInvalid") : null}
            disabled={pending}
            autoFocus
          />
        )}
      />

      <div className="space-y-2">
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <PasswordField
              id="login-password"
              variant="designer"
              label={t("password")}
              autoComplete="current-password"
              value={field.value}
              onChange={field.onChange}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, password: true }));
                field.onBlur();
              }}
              name={field.name}
              ref={field.ref}
              error={showPasswordError ? t("passwordRequired") : null}
              disabled={pending}
            />
          )}
        />
        <div className="flex justify-end">
          <Link
            href="/password/reset"
            className="text-sm font-medium text-[#534341] underline-offset-4 hover:text-[#d32f2f] hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      <PreferredLanguageChips disabled={pending} />

      {errorKey ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {te(errorKey as "INVALID_CREDENTIALS")}
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          type="submit"
          className="ham-auth-btn-designer h-auto w-full"
          disabled={pending}
        >
          {pending ? t("submitting") : t("submitLogin")}
          {!pending ? (
            <ArrowRight className="size-[18px] shrink-0" aria-hidden />
          ) : null}
        </Button>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-[#d8c2bf]/70" />
        </div>
        <div className="relative flex justify-center text-xs font-medium tracking-wide text-[#534341] uppercase">
          <span className="bg-white px-3">{t("orDivider")}</span>
        </div>
      </div>

      <Button
        asChild
        type="button"
        variant="outline"
        className="ham-auth-btn-designer-secondary h-auto w-full border-[#d32f2f] bg-transparent text-[#d32f2f] shadow-none hover:bg-[#d32f2f]/5 hover:text-[#d32f2f]"
      >
        <Link href={otpHref}>{t("loginOtpInstead")}</Link>
      </Button>
    </form>
  );
}
