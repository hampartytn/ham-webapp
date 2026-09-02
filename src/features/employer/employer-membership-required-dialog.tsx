"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatPaise } from "@/components/shared/status-badge";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export function EmployerMembershipRequiredDialog({
  open,
  onOpenChange,
  amountPaise,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountPaise: number | null;
}) {
  const t = useTranslations("employer");
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const price = amountPaise != null ? formatPaise(amountPaise) : null;
  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
  const panel = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open ? (
            <Dialog.Overlay asChild key="membership-gate-backdrop">
              <motion.div
                className="ham-employer-mem-gate__backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
              />
            </Dialog.Overlay>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {open ? (
            <Dialog.Content asChild key="membership-gate-panel">
              <motion.div
                className="ham-employer-mem-gate"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, scale: 0.98 }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8, scale: 0.98 }
                }
                transition={panel}
              >
                <span className="ham-employer-mem-gate__icon" aria-hidden>
                  <Briefcase className="size-6" />
                </span>
                <Dialog.Title className="ham-employer-mem-gate__title">
                  {t("gateModalTitle")}
                </Dialog.Title>
                <Dialog.Description className="ham-employer-mem-gate__body">
                  {price
                    ? t("gateModalBody", { price })
                    : t("gateModalBodyNoPrice")}
                </Dialog.Description>
                <ul className="ham-employer-mem-gate__list">
                  <li>
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                    {t("gateModalPointPost")}
                  </li>
                  <li>
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                    {t("gateModalPointReach")}
                  </li>
                  <li>
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                    {t("gateModalPointManage")}
                  </li>
                </ul>
                <p className="ham-employer-mem-gate__note">
                  {t("membershipDoesNotVerifyOrg")}
                </p>
                  <div className="ham-employer-mem-gate__actions">
                    <button
                      type="button"
                      className="ham-employer__btn ham-employer__btn--secondary"
                      onClick={() => {
                        onOpenChange(false);
                        if (pathname !== "/employer") {
                          router.push("/employer");
                        }
                      }}
                    >
                    {t("membershipGoToDashboard")}
                  </button>
                  <Link
                    href="/employer/membership"
                    className="ham-employer__btn ham-employer__btn--primary ham-employer-mem-gate__primary"
                    onClick={() => onOpenChange(false)}
                  >
                    {t("activateMembership")}
                  </Link>
                </div>
              </motion.div>
            </Dialog.Content>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
