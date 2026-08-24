import type { ReactNode } from "react";

/**
 * Root layout required by Next.js. Locale layout owns <html>/<body>.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
