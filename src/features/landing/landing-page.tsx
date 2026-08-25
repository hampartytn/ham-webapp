import { Noto_Sans, Noto_Sans_Tamil, Source_Serif_4 } from "next/font/google";

import { LandingBenefits } from "./landing-benefits";
import { LandingFinalCta } from "./landing-final-cta";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingHowItWorks } from "./landing-how";
import { LandingRolePaths } from "./landing-roles";
import { LandingTrust } from "./landing-trust";
import { getServerSession } from "@/lib/auth/session";
import "@/styles/landing.css";

const landingSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  variable: "--font-landing-sans",
  display: "swap",
});

const landingTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-landing-tamil",
  display: "swap",
});

const landingDisplay = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-landing-display",
  display: "swap",
});

/**
 * Landing page composition. Server Components by default;
 * header is a client island (nav, language, mobile menu).
 */
export async function LandingPage() {
  const user = await getServerSession();

  return (
    <div
      className={`ham-landing ${landingSans.variable} ${landingTamil.variable} ${landingDisplay.variable} min-h-full`}
    >
      <LandingHeader user={user} />
      <main>
        <LandingHero />
        <LandingRolePaths />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingTrust />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
