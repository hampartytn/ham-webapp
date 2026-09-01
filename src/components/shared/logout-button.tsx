"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { bffJson } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

export function LogoutButton() {
  const t = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await bffJson("/api/auth/logout", { method: "POST", body: "{}" });
        } catch {
          /* still clear local UX */
        }
        queryClient.clear();
        router.replace("/login");
      }}
    >
      {t("logout")}
    </Button>
  );
}
