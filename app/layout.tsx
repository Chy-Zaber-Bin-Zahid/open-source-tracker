import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Analytics } from "@vercel/analytics/next";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Server-only, so it is read at runtime rather than inlined at build time.
 *  Vercel supplies the production domain automatically. */
const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const title = "Contribution Tracker";
const description = "A plain record of the pull requests your team has merged in open source, verified against GitHub.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: `%s · ${title}` },
  description,
  openGraph: { title, description, url: siteUrl, siteName: title, type: "website" },
  twitter: { card: "summary", title, description },
};

/**
 * Applies the saved theme before first paint. Without this the page renders in
 * the system theme for a frame and then snaps to the chosen one.
 */
const themeBoot = `(function(){try{var t=localStorage.getItem("tracker-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-10">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
