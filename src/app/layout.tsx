import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal, Inter } from "next/font/google";
import { SITE, SITE_URL, CONTACT } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { ModeProvider } from "@/lib/mode";
import "../../assets/css/design-tokens.css";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.brandLine}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.taglineAr}`,
    description: SITE.description,
    locale: "ar_EG",
    alternateLocale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.taglineAr} | ${SITE.taglineEn}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.taglineAr}`,
    description: SITE.descriptionEn,
    images: ["/og-image.png"],
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} ${inter.variable}`}
    >
      <body>
        <ModeProvider>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  name: SITE.name,
                  alternateName: SITE.brandLine,
                  url: SITE_URL,
                  inLanguage: "ar-EG",
                  description: SITE.descriptionEn,
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: CONTACT.creatorName,
                  url: SITE_URL,
                  email: CONTACT.email,
                  sameAs: [CONTACT.linkedin, SITE_URL],
                },
              ],
            }}
          />
          {children}
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-fab"
            aria-label="التواصل عبر واتساب"
            title="تواصل عبر واتساب"
          >
            <WhatsAppIcon className="h-6 w-6" />
          </a>
        </ModeProvider>
      </body>
    </html>
  );
}