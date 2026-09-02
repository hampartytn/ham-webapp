"use client";

import type { ReactNode } from "react";

export function EmployerPanelPlaceholder({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="ham-employer-jobs__placeholder">
      {icon ? (
        <span className="ham-employer-jobs__placeholder-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <p className="ham-employer-jobs__placeholder-title">{title}</p>
      {description ? (
        <p className="ham-employer-jobs__placeholder-body">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
