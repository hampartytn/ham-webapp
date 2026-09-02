"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ComponentProps, MouseEvent, PointerEvent } from "react";

import { Link } from "@/i18n/navigation";
import { cancelIdleWork, prefetchRoleHrefIdle } from "@/lib/query/nav-prefetch";

type RoleNavLinkProps = ComponentProps<typeof Link> & {
  prefetchHref?: string;
};

function hrefToPath(href: RoleNavLinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object" && "pathname" in href) {
    return href.pathname ?? "";
  }
  return "";
}

/**
 * Navigate immediately. RSC is prefetched by Next. Nest cache warm-up is idle-only
 * and cancelled when the user presses the link.
 */
export function RoleNavLink({
  href,
  prefetchHref,
  onPointerDown,
  onMouseEnter,
  ...rest
}: RoleNavLinkProps) {
  const queryClient = useQueryClient();
  const path = prefetchHref ?? hrefToPath(href);

  return (
    <Link
      {...rest}
      href={href}
      prefetch
      onPointerDown={(event: PointerEvent<HTMLAnchorElement>) => {
        cancelIdleWork();
        onPointerDown?.(event);
      }}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        if (path) prefetchRoleHrefIdle(queryClient, path);
        onMouseEnter?.(event);
      }}
    />
  );
}
