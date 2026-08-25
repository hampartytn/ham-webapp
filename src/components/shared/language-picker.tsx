"use client";

import { LanguageSelector } from "./language-selector";

type Props = {
  compact?: boolean;
  appearance?: "default" | "landing" | "form";
};

/** @deprecated Prefer LanguageSelector — kept for existing call sites. */
export function LanguagePicker({ appearance = "default" }: Props) {
  return <LanguageSelector appearance={appearance} />;
}
