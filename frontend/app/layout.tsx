import type { Metadata, Viewport } from "next";
import { Archivo_Narrow, Bodoni_Moda, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/config";
import { Masthead } from "@/components/Masthead";
import { PendingTxs } from "@/components/PendingTxs";

const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", display: "swap", style: ["normal", "italic"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-sourceserif", display: "swap", style: ["normal", "italic"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plexmono", display: "swap" });
const archivo = Archivo_Narrow({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-archivo", display: "swap" });

const title = "LicenseCheck: a public registry of licensed works and judged misuse reports";
const description =
  "Register a work with structured license terms. Anyone can report misuse with a bond; GenLayer AI validators read the original and the reported page and judge VIOLATION, COMPLIANT or INCONCLUSIVE with quoted findings.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "LicenseCheck",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: { type: "website", url: "/", siteName: "LicenseCheck", title, description },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = { themeColor: "#4a2f1d" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${sourceSerif.variable} ${plexMono.variable} ${archivo.variable}`}>
      <body>
        <Providers>
          <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-6 sm:py-8">
            <Masthead />
            <PendingTxs />
            <main className="mt-6">{children}</main>
            <footer className="mt-16 border-t border-ink/30 pt-4 text-[13px] text-ink-2">
              <p className="mono">
                LicenseCheck runs on GenLayer Studionet (chain 61999). Points are non-monetary registry points with no value.
                Verdicts are produced by AI validators reading public pages and are <b>not legal advice</b>. A wallet is not proof of
                authorship. See <a className="ink-link" href="/trust">Rules &amp; trust</a>.
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
